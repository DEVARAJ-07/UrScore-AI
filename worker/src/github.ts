import axios from 'axios';
import * as path from 'path';

export interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  size: number;
  language: string | null;
  languages: Record<string, number>;
  readme: string | null;
  dependencies: string[];
  commits: {
    message: string;
    date: string;
  }[];
  total_files: number;
  test_files: number;
  extension_counts: Record<string, number>;
  file_paths: string[];
}

export interface GithubProfile {
  username: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
  repos: GithubRepo[];
}

export class GithubCrawler {
  private token: string | null;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || null;
  }

  /**
   * Main fetch method. If token is invalid or missing, it falls back to mock generator
   */
  public async fetchDeveloperProfile(username: string, repoName: string | null, logCallback: (msg: string, progress: number) => void): Promise<GithubProfile> {
    const headers: Record<string, string> = {
      'User-Agent': 'UrScore-AI-Worker'
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
      logCallback(`[GITHUB] Using OAuth token authentication for rate limits.`, 10);
    } else {
      logCallback(`[GITHUB] No OAuth token provided. Falling back to simulated crawl/mock environment to avoid API rate limits.`, 10);
      return this.generateSimulatedProfile(username, repoName, logCallback);
    }

    try {
      logCallback(`[GITHUB] Querying user profile information for: ${username}`, 15);
      const userRes = await axios.get(`https://api.github.com/users/${username}`, { headers, timeout: 6000 });
      const userData = userRes.data;

      let reposData = [];
      if (repoName) {
        logCallback(`[GITHUB] User profile retrieved. Fetching specific repository: ${repoName}...`, 20);
        const repoRes = await axios.get(`https://api.github.com/repos/${username}/${repoName}`, { headers, timeout: 6000 });
        reposData = [repoRes.data];
      } else {
        logCallback(`[GITHUB] User profile retrieved. Public repos: ${userData.public_repos}. Fetching repositories...`, 20);
        const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=15&sort=updated`, { headers, timeout: 6000 });
        reposData = reposRes.data;
      }

      const repos: GithubRepo[] = [];
      let currentProgress = 25;
      const progressIncrement = 40 / Math.max(1, reposData.length);

      for (const r of reposData) {
        currentProgress += progressIncrement;
        logCallback(`[GITHUB] Scraping repository: ${r.name}`, Math.min(65, Math.round(currentProgress)));

        // 1. Fetch languages
        let languages: Record<string, number> = {};
        try {
          const langRes = await axios.get(r.languages_url, { headers, timeout: 3000 });
          languages = langRes.data;
        } catch (e) {
          if (r.language) languages[r.language] = 1000;
        }

        // 2. Fetch README
        let readme: string | null = null;
        try {
          const readmeRes = await axios.get(`https://api.github.com/repos/${username}/${r.name}/readme`, { headers, timeout: 3000 });
          if (readmeRes.data && readmeRes.data.content) {
            readme = Buffer.from(readmeRes.data.content, 'base64').toString('utf8');
          }
        } catch (e) {
          // No readme or error
        }

        // 3. Fetch dependencies (check package.json / requirements.txt / go.mod)
        const dependencies: string[] = [];
        const filesToCheck = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'Gemfile'];
        for (const file of filesToCheck) {
          try {
            const fileRes = await axios.get(`https://api.github.com/repos/${username}/${r.name}/contents/${file}`, { headers, timeout: 2000 });
            if (fileRes.data && fileRes.data.content) {
              const fileContent = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
              if (file === 'package.json') {
                const pj = JSON.parse(fileContent);
                const deps = { ...(pj.dependencies || {}), ...(pj.devDependencies || {}) };
                dependencies.push(...Object.keys(deps));
              } else if (file === 'requirements.txt') {
                const lines = fileContent.split('\n');
                lines.forEach(l => {
                  const m = l.match(/^([a-zA-Z0-9_\-]+)/);
                  if (m) dependencies.push(m[1].toLowerCase());
                });
              } else if (file === 'go.mod') {
                const lines = fileContent.split('\n');
                lines.forEach(l => {
                  const m = l.match(/^\s*([a-zA-Z0-9\.\-_]+)\s+v/);
                  if (m) dependencies.push(m[1].split('/').pop() || '');
                });
              } else {
                dependencies.push(file.split('.')[0]); // generic fallback indicators
              }
            }
            break; // Found one dependency manifest file, skip others
          } catch (e) {
            // File not found
          }
        }

        // 4. Fetch Commits
        const commits: { message: string; date: string; }[] = [];
        try {
          const commitsRes = await axios.get(`https://api.github.com/repos/${username}/${r.name}/commits?author=${username}&per_page=10`, { headers, timeout: 3000 });
          if (Array.isArray(commitsRes.data)) {
            commitsRes.data.forEach((c: any) => {
              commits.push({
                message: c.commit.message,
                date: c.commit.author.date
              });
            });
          }
        } catch (e) {
          // No commits retrieved
        }

        // 5. Fetch and analyze all files via Git Trees API
        let totalFilesCount = 0;
        let testFilesCount = 0;
        const extensionCounts: Record<string, number> = {};
        const filePaths: string[] = [];

        try {
          const defaultBranch = r.default_branch || 'main';
          logCallback(`[GITHUB] Fetching recursive file tree for ${r.name} (${defaultBranch})...`, Math.min(65, Math.round(currentProgress)));
          
          const treeRes = await axios.get(`https://api.github.com/repos/${username}/${r.name}/git/trees/${defaultBranch}?recursive=1`, { headers, timeout: 5000 });
          
          if (treeRes.data && Array.isArray(treeRes.data.tree)) {
            const tree = treeRes.data.tree;
            tree.forEach((entry: any) => {
              if (entry.type === 'blob') {
                totalFilesCount++;
                filePaths.push(entry.path);
                
                const ext = path.extname(entry.path).toLowerCase();
                if (ext) {
                  extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
                }
                
                if (entry.path.toLowerCase().includes('test') || entry.path.toLowerCase().includes('spec') || entry.path.toLowerCase().startsWith('tests/')) {
                  testFilesCount++;
                }
              }
            });
            logCallback(`[GITHUB] Audited repository file structure: ${totalFilesCount} files analyzed.`, Math.min(65, Math.round(currentProgress)));
          }
        } catch (e: any) {
          logCallback(`[GITHUB WARNING] Git Trees API skipped for ${r.name}: ${e.message}`, Math.min(65, Math.round(currentProgress)));
        }

        repos.push({
          name: r.name,
          description: r.description,
          html_url: r.html_url,
          stargazers_count: r.stargazers_count,
          forks_count: r.forks_count,
          size: r.size,
          language: r.language,
          languages,
          readme,
          dependencies,
          commits,
          total_files: totalFilesCount,
          test_files: testFilesCount,
          extension_counts: extensionCounts,
          file_paths: filePaths
        });
      }

      return {
        username,
        name: userData.name || username,
        avatar_url: userData.avatar_url,
        public_repos: userData.public_repos,
        followers: userData.followers,
        created_at: userData.created_at,
        repos
      };
    } catch (err: any) {
      logCallback(`[GITHUB ERROR] Failed to fetch data: ${err.message}. Falling back to simulation.`, 20);
      return this.generateSimulatedProfile(username, repoName, logCallback);
    }
  }

  /**
   * Generates highly detailed and realistic developer metrics.
   */
  private generateSimulatedProfile(username: string, repoName: string | null, logCallback: (msg: string, progress: number) => void): GithubProfile {
    logCallback(`[SIMULATION] Booting GitHub analysis worker mock pipelines...`, 20);

    let repos: GithubRepo[] = [];
    if (repoName) {
      logCallback(`[SIMULATION] Generating simulated repository: ${repoName}`, 30);
      repos = [
        {
          name: repoName,
          description: `High quality audited repository representing codebase metrics for ${repoName}. Built with modular architecture.`,
          html_url: `https://github.com/${username}/${repoName}`,
          stargazers_count: 24,
          forks_count: 5,
          size: 7800,
          language: 'TypeScript',
          languages: { 'TypeScript': 6200, 'JavaScript': 1200, 'CSS': 400 },
          readme: `# ${repoName}\nThis is a production-grade verified project folder for ${repoName}. Includes complete test coverage and CD setups.`,
          dependencies: ['express', 'typescript', 'dotenv', 'jest', 'cors'],
          commits: [
            { message: 'feat: implement core services and configurations', date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
            { message: 'fix: optimize middleware validation logic', date: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString() },
            { message: 'initial commit', date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() }
          ],
          total_files: 45,
          test_files: 4,
          extension_counts: { '.ts': 28, '.tsx': 12, '.json': 3, '.md': 2 },
          file_paths: ['package.json', 'tsconfig.json', 'src/server.ts', 'src/routes.ts', 'src/controllers/auth.ts', 'tests/auth.test.ts']
        }
      ];
    } else {
      repos = [
        {
          name: 'e-commerce-microservices',
          description: 'High-throughput Node.js microservices for shopping cart and authentication backend, leveraging Redis caching and PostgreSQL.',
          html_url: `https://github.com/${username}/e-commerce-microservices`,
          stargazers_count: 34,
          forks_count: 8,
          size: 14200,
          language: 'TypeScript',
          languages: { 'TypeScript': 8400, 'JavaScript': 4200, 'HTML': 1600 },
          readme: `# E-Commerce Microservice Suite
This project implements the core ordering and shopping API.
## Architecture
- Express API Gateway
- JWT Authentication Middleware
- Database: PostgreSQL with Prisma ORM
- Caching layer: Redis server
## Dev Setup
\`npm install\` and run \`npm run dev\``,
          dependencies: ['express', 'typescript', 'redis', 'pg', 'prisma', 'jsonwebtoken', 'dotenv', 'cors', 'jest'],
          commits: [
            { message: 'feat: add docker-compose configuration for Redis/postgres', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
            { message: 'fix: jwt validation token expiration issue resolved', date: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString() },
            { message: 'docs: update setup guidelines in readme', date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
            { message: 'feat: cart router endpoints and checkout schemas', date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
            { message: 'initial commit', date: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString() }
          ],
          total_files: 112,
          test_files: 12,
          extension_counts: { '.ts': 75, '.js': 20, '.json': 8, '.md': 4, '.yml': 5 },
          file_paths: ['package.json', 'tsconfig.json', 'src/index.ts', 'src/services/db.ts', 'tests/db.test.ts']
        },
        {
          name: 'react-dashboard-tailwind',
          description: 'Vite React admin dashboard panel utilizing TailwindCSS, Zustand, and React Query.',
          html_url: `https://github.com/${username}/react-dashboard-tailwind`,
          stargazers_count: 18,
          forks_count: 3,
          size: 3400,
          language: 'TypeScript',
          languages: { 'TypeScript': 2100, 'CSS': 900, 'HTML': 400 },
          readme: `# React Admin Hub
Premium admin dashboard using Zustand global store.
- Real-time Recharts data plots.
- Responsive tailwind grid layouts.`,
          dependencies: ['react', 'react-dom', 'typescript', 'zustand', 'recharts', 'tailwindcss', 'postcss', 'vite'],
          commits: [
            { message: 'refactor: clean up dashboard analytics grid sizes', date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() },
            { message: 'feat: add dark mode toggler with state persistence', date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
            { message: 'add recharts graphs for transaction stats', date: new Date(Date.now() - 16 * 24 * 3600 * 1000).toISOString() }
          ],
          total_files: 48,
          test_files: 2,
          extension_counts: { '.tsx': 25, '.ts': 10, '.css': 8, '.html': 2, '.json': 3 },
          file_paths: ['package.json', 'src/main.tsx', 'src/App.tsx', 'src/components/Chart.tsx', 'src/components/Chart.test.tsx']
        },
        {
          name: 'python-data-crawler',
          description: 'Scrapes financial listings, parses HTML contents, and dumps structured JSON/CSV files to AWS S3 bucket.',
          html_url: `https://github.com/${username}/python-data-crawler`,
          stargazers_count: 5,
          forks_count: 1,
          size: 820,
          language: 'Python',
          languages: { 'Python': 820 },
          readme: `# Python S3 Data Pipeline
Pulls listings and stores them in AWS S3 buckets.
### Prerequisites
Setup \`boto3\` AWS credentials in environment variables.`,
          dependencies: ['boto3', 'requests', 'beautifulsoup4', 'pandas', 'pytest'],
          commits: [
            { message: 'feat: add boto3 s3 client upload implementation', date: new Date(Date.now() - 32 * 24 * 3600 * 1000).toISOString() },
            { message: 'fix: soup parsing error for dynamic tables', date: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString() }
          ],
          total_files: 18,
          test_files: 3,
          extension_counts: { '.py': 12, '.txt': 2, '.csv': 2, '.md': 2 },
          file_paths: ['requirements.txt', 'crawler.py', 'parser.py', 'tests/test_crawler.py']
        },
        {
          name: 'ci-cd-docker-template',
          description: 'GitHub Actions template workflow configurations for running automated tests, linting, and Docker container pushes.',
          html_url: `https://github.com/${username}/ci-cd-docker-template`,
          stargazers_count: 2,
          forks_count: 0,
          size: 150,
          language: 'YAML',
          languages: { 'YAML': 150 },
          readme: `# DevOps Template
Workflows for running node tasks on push and pull request.`,
          dependencies: ['docker', 'kubernetes', 'github-actions'],
          commits: [
            { message: 'configure docker pull and push step actions', date: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString() }
          ],
          total_files: 7,
          test_files: 0,
          extension_counts: { '.yml': 4, '.yaml': 2, '.md': 1 },
          file_paths: ['.github/workflows/ci.yml', '.github/workflows/cd.yml', 'Dockerfile', 'README.md']
        }
      ];
    }

    logCallback(`[SIMULATION] Successfully loaded 4 mock repositories for ${username}.`, 50);

    return {
      username,
      name: username.charAt(0).toUpperCase() + username.slice(1) + ' Developer',
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
      public_repos: 4,
      followers: 12,
      created_at: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
      repos
    };
  }
}
export const githubCrawler = new GithubCrawler();
