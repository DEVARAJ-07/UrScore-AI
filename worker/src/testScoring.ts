import { computeUrScore } from './scoring';
import { ResumeAnalysis } from './resume';
import { GithubProfile } from './github';

// Test Cases Setup
const mockResumeEmpty: ResumeAnalysis = {
  keywords: { languages: [], frameworks: [], databases: [], tools: [] },
  totalKeywordsCount: 0,
  experienceYears: 1,
  extractedProjects: []
};

const mockGithubEmpty: GithubProfile = {
  username: 'newbie',
  name: 'Newbie Developer',
  avatar_url: '',
  public_repos: 0,
  followers: 0,
  created_at: new Date().toISOString(),
  repos: []
};

const mockResumeStandard: ResumeAnalysis = {
  keywords: {
    languages: ['TypeScript', 'JavaScript', 'Python'],
    frameworks: ['React', 'Express'],
    databases: ['PostgreSQL'],
    tools: ['Docker', 'AWS']
  },
  totalKeywordsCount: 8,
  experienceYears: 3,
  extractedProjects: ['E-Commerce microservice', 'React Admin panel']
};

const mockGithubFull: GithubProfile = {
  username: 'expert',
  name: 'Expert Developer',
  avatar_url: 'http://avatar',
  public_repos: 2,
  followers: 45,
  created_at: new Date(Date.now() - 500 * 24 * 3600 * 1000).toISOString(),
  repos: [
    {
      name: 'e-commerce-microservices',
      description: 'Microservice with postgres, express, typescript and docker',
      html_url: 'http://github/expert/e-commerce-microservices',
      stargazers_count: 50,
      forks_count: 10,
      size: 5000,
      language: 'TypeScript',
      languages: { 'TypeScript': 80, 'JavaScript': 20 },
      readme: 'E-Commerce microservice with Express and Docker containerization.',
      dependencies: ['express', 'typescript', 'pg', 'docker', 'jest'],
      commits: [
        { message: 'feat: configure docker and pg database connection', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
        { message: 'refactor: split routers into modules', date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
        { message: 'fix: validation schema token updates', date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() }
      ],
      total_files: 5,
      test_files: 1,
      extension_counts: {},
      file_paths: [],
      ai_description: ''
    },
    {
      name: 'react-dashboard',
      description: 'Admin dashboard',
      html_url: 'http://github/expert/react-dashboard',
      stargazers_count: 15,
      forks_count: 2,
      size: 1000,
      language: 'TypeScript',
      languages: { 'TypeScript': 90, 'HTML': 10 },
      readme: 'React Admin panel dashboard template.',
      dependencies: ['react', 'tailwindcss', 'zustand', 'vite'],
      commits: [
        { message: 'feat: add analytics graph', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
        { message: 'initial commit', date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() }
      ],
      total_files: 5,
      test_files: 1,
      extension_counts: {},
      file_paths: [],
      ai_description: ''
    }
  ]
};

function runTests() {
  console.log('====================================');
  console.log('RUNNING URSCORE FORMULA ENGINE TESTS');
  console.log('====================================\n');

  // Test Case 1: Empty Profile Baseline Checks
  const score1 = computeUrScore(mockResumeEmpty, mockGithubEmpty, null, null);
  console.log('Test Case 1: Empty/New Profile (No metrics)');
  console.log(`Overall Score: ${score1.overall_score}/100`);
  console.log(`Skill Verification Score: ${score1.skill_verification}%`);
  console.log(`Commit Quality Score: ${score1.commit_quality}%`);
  console.log(`Project Complexity Score: ${score1.project_complexity}%`);
  console.log(`Recency Score: ${score1.recency}%`);
  console.log(`Cross Reference Score: ${score1.cross_reference}%`);
  console.log(`Activity Consistency Score: ${score1.activity_consistency}%\n`);

  // Test Case 2: Full Expert profile
  const score2 = computeUrScore(mockResumeStandard, mockGithubFull, { solvedTotal: 150, solvedEasy: 50, solvedMedium: 80, solvedHard: 20, ranking: 50000, acceptanceRate: 55, topicStats: [] }, { title: 'Expert portfolio', detectedStack: ['React'], responsive: true, isUp: true });
  console.log('Test Case 2: Expert Profile (Verified resume + LeetCode bonus)');
  console.log(`Overall Score: ${score2.overall_score}/100`);
  console.log(`Skill Verification Score: ${score2.skill_verification}%`);
  console.log(`Verified Skills: ${score2.verified_keywords.join(', ')}`);
  console.log(`Unverified Skills: ${score2.unverified_keywords.join(', ')}`);
  console.log(`Commit Quality Score: ${score2.commit_quality}%`);
  console.log(`Project Complexity Score: ${score2.project_complexity}%`);
  console.log(`Recency Score: ${score2.recency}%`);
  console.log(`Cross Reference Score: ${score2.cross_reference}%`);
  console.log(`Activity Consistency Score: ${score2.activity_consistency}%\n`);

  // Assertions
  if (score2.overall_score > score1.overall_score) {
    console.log('✅ SUCCESS: Scoring weights applied correctly. Expert score exceeds baseline.');
  } else {
    console.log('❌ FAILURE: Scoring calculation error.');
  }
}

runTests();
