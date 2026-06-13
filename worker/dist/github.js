"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubCrawler = exports.GithubCrawler = void 0;
const axios_1 = __importDefault(require("axios"));
class GithubCrawler {
    token;
    constructor() {
        this.token = process.env.GITHUB_TOKEN || null;
    }
    /**
     * Main fetch method. If token is invalid or missing, it falls back to mock generator
     */
    async fetchDeveloperProfile(username, logCallback) {
        const headers = {
            'User-Agent': 'UrScore-AI-Worker'
        };
        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
            logCallback(`[GITHUB] Using OAuth token authentication for rate limits.`, 10);
        }
        else {
            logCallback(`[GITHUB] No OAuth token provided. Falling back to simulated crawl/mock environment to avoid API rate limits.`, 10);
            return this.generateSimulatedProfile(username, logCallback);
        }
        try {
            logCallback(`[GITHUB] Querying user profile information for: ${username}`, 15);
            const userRes = await axios_1.default.get(`https://api.github.com/users/${username}`, { headers, timeout: 6000 });
            const userData = userRes.data;
            logCallback(`[GITHUB] User profile retrieved. Public repos: ${userData.public_repos}. Fetching repositories...`, 20);
            const reposRes = await axios_1.default.get(`https://api.github.com/users/${username}/repos?per_page=15&sort=updated`, { headers, timeout: 6000 });
            const reposData = reposRes.data;
            const repos = [];
            let currentProgress = 25;
            const progressIncrement = 40 / Math.max(1, reposData.length);
            for (const r of reposData) {
                currentProgress += progressIncrement;
                logCallback(`[GITHUB] Scraping repository: ${r.name}`, Math.min(65, Math.round(currentProgress)));
                // 1. Fetch languages
                let languages = {};
                try {
                    const langRes = await axios_1.default.get(r.languages_url, { headers, timeout: 3000 });
                    languages = langRes.data;
                }
                catch (e) {
                    if (r.language)
                        languages[r.language] = 1000;
                }
                // 2. Fetch README
                let readme = null;
                try {
                    const readmeRes = await axios_1.default.get(`https://api.github.com/repos/${username}/${r.name}/readme`, { headers, timeout: 3000 });
                    if (readmeRes.data && readmeRes.data.content) {
                        readme = Buffer.from(readmeRes.data.content, 'base64').toString('utf8');
                    }
                }
                catch (e) {
                    // No readme or error
                }
                // 3. Fetch dependencies (check package.json / requirements.txt / go.mod)
                const dependencies = [];
                const filesToCheck = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'Gemfile'];
                for (const file of filesToCheck) {
                    try {
                        const fileRes = await axios_1.default.get(`https://api.github.com/repos/${username}/${r.name}/contents/${file}`, { headers, timeout: 2000 });
                        if (fileRes.data && fileRes.data.content) {
                            const fileContent = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
                            if (file === 'package.json') {
                                const pj = JSON.parse(fileContent);
                                const deps = { ...(pj.dependencies || {}), ...(pj.devDependencies || {}) };
                                dependencies.push(...Object.keys(deps));
                            }
                            else if (file === 'requirements.txt') {
                                const lines = fileContent.split('\n');
                                lines.forEach(l => {
                                    const m = l.match(/^([a-zA-Z0-9_\-]+)/);
                                    if (m)
                                        dependencies.push(m[1].toLowerCase());
                                });
                            }
                            else if (file === 'go.mod') {
                                const lines = fileContent.split('\n');
                                lines.forEach(l => {
                                    const m = l.match(/^\s*([a-zA-Z0-9\.\-_]+)\s+v/);
                                    if (m)
                                        dependencies.push(m[1].split('/').pop() || '');
                                });
                            }
                            else {
                                dependencies.push(file.split('.')[0]); // generic fallback indicators
                            }
                        }
                        break; // Found one dependency manifest file, skip others
                    }
                    catch (e) {
                        // File not found
                    }
                }
                // 4. Fetch Commits
                const commits = [];
                try {
                    const commitsRes = await axios_1.default.get(`https://api.github.com/repos/${username}/${r.name}/commits?author=${username}&per_page=10`, { headers, timeout: 3000 });
                    if (Array.isArray(commitsRes.data)) {
                        commitsRes.data.forEach((c) => {
                            commits.push({
                                message: c.commit.message,
                                date: c.commit.author.date
                            });
                        });
                    }
                }
                catch (e) {
                    // No commits retrieved
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
                    commits
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
        }
        catch (err) {
            logCallback(`[GITHUB ERROR] Failed to fetch data: ${err.message}. Falling back to simulation.`, 20);
            return this.generateSimulatedProfile(username, logCallback);
        }
    }
    /**
     * Generates highly detailed and realistic developer metrics.
     */
    generateSimulatedProfile(username, logCallback) {
        logCallback(`[SIMULATION] Booting GitHub analysis worker mock pipelines...`, 20);
        // Let's create realistic repositories based on standard developer profiles
        const repos = [
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
                ]
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
                ]
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
                ]
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
                ]
            }
        ];
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
exports.GithubCrawler = GithubCrawler;
exports.githubCrawler = new GithubCrawler();
