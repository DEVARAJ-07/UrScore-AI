import { ResumeAnalysis } from './resume';
import { GithubProfile, GithubRepo } from './github';
import { LeetCodeStats, PortfolioStats } from './portfolio';

export interface ScoreBreakdown {
  overall_score: number;
  skill_verification: number;
  commit_quality: number;
  project_complexity: number;
  recency: number;
  cross_reference: number;
  activity_consistency: number;
  verified_keywords: string[];
  unverified_keywords: string[];
}

export function computeUrScore(
  resume: ResumeAnalysis,
  github: GithubProfile,
  leetcode: LeetCodeStats | null,
  portfolio: PortfolioStats | null
): ScoreBreakdown {
  const allResumeKeywords = [
    ...resume.keywords.languages,
    ...resume.keywords.frameworks,
    ...resume.keywords.databases,
    ...resume.keywords.tools
  ];

  // 1. Skill Verification (25%)
  // Ratio of resume keywords verified by GitHub repository languages or dependency imports
  const githubLanguages = new Set<string>();
  const githubDeps = new Set<string>();

  github.repos.forEach(repo => {
    if (repo.language) githubLanguages.add(repo.language.toLowerCase());
    Object.keys(repo.languages).forEach(lang => githubLanguages.add(lang.toLowerCase()));
    repo.dependencies.forEach(dep => githubDeps.add(dep.toLowerCase()));
  });

  const verifiedKeywords: string[] = [];
  const unverifiedKeywords: string[] = [];

  allResumeKeywords.forEach(keyword => {
    const kw = keyword.toLowerCase();
    const isLangVerified = githubLanguages.has(kw);
    // Check if keyword matches any dependency (e.g. "express" in dependencies) or language
    const isDepVerified = githubDeps.has(kw);
    
    // Support basic sub-string mapping (e.g. "next.js" matches "next")
    const isFuzzyVerified = Array.from(githubDeps).some(dep => dep.includes(kw) || kw.includes(dep));

    if (isLangVerified || isDepVerified || isFuzzyVerified) {
      verifiedKeywords.push(keyword);
    } else {
      unverifiedKeywords.push(keyword);
    }
  });

  let skill_verification = 50; // default baseline if no resume keywords
  if (allResumeKeywords.length > 0) {
    skill_verification = (verifiedKeywords.length / allResumeKeywords.length) * 100;
  } else if (githubLanguages.size > 0) {
    // If no resume, base on GitHub language diversity
    skill_verification = Math.min(100, githubLanguages.size * 20);
  }

  // 2. Commit Quality (20%)
  // Descriptive commit messages (long enough, containing structural keywords, avoiding lazy expressions)
  let totalCommits = 0;
  let descriptiveCommits = 0;
  let totalLength = 0;

  github.repos.forEach(repo => {
    repo.commits.forEach(commit => {
      totalCommits++;
      const msg = commit.message.trim();
      totalLength += msg.length;

      // Lazy check: does it consist of simple lazy words?
      const isLazy = /^(update|fix|commit|test|wip|changes|patch|done)$/i.test(msg) || msg.length < 8;
      // Structured check: does it use conventional commits?
      const isStructured = /^(feat|fix|docs|style|refactor|test|chore|perf|ci)(\([a-z0-9\-]+\))?:\s/i.test(msg);

      if (!isLazy || isStructured) {
        descriptiveCommits++;
      }
    });
  });

  let commit_quality = 70; // baseline default
  if (totalCommits > 0) {
    const ratioScore = (descriptiveCommits / totalCommits) * 80; // max 80 points
    const avgLength = totalLength / totalCommits;
    const lengthBonus = Math.min(20, (avgLength / 30) * 20); // max 20 points for average length > 30 chars
    commit_quality = Math.min(100, ratioScore + lengthBonus);
  }

  // 3. Project Complexity (20%)
  // Based on repository size, stars, forks, and count of dependencies used
  let project_complexity = 50; // baseline
  if (github.repos.length > 0) {
    let totalStars = 0;
    let totalForks = 0;
    let totalSize = 0;
    let totalDepsCount = 0;

    github.repos.forEach(repo => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      totalSize += repo.size;
      totalDepsCount += repo.dependencies.length;
    });

    const avgStars = totalStars / github.repos.length;
    const avgDeps = totalDepsCount / github.repos.length;
    
    // stars scoring: log scale (avg 5 stars = 15 points, avg 50 stars = 30 points)
    const starScore = Math.min(30, Math.log1p(avgStars) * 8);
    // dependencies scoring: depth of libraries used (avg 15 deps = 35 points)
    const depScore = Math.min(40, (avgDeps / 12) * 40);
    // size scoring: scale size (avg size > 5MB = 30 points)
    const avgSize = totalSize / github.repos.length;
    const sizeScore = Math.min(30, (avgSize / 5000) * 30);

    project_complexity = Math.min(100, Math.max(30, starScore + depScore + sizeScore));
  }

  // 4. Recency (15%)
  // Calculates score based on number of days since the absolute latest commit
  let recency = 50; // baseline
  let mostRecentDate = 0;

  github.repos.forEach(repo => {
    repo.commits.forEach(commit => {
      const time = new Date(commit.date).getTime();
      if (time > mostRecentDate) {
        mostRecentDate = time;
      }
    });
  });

  if (mostRecentDate > 0) {
    const diffDays = (Date.now() - mostRecentDate) / (1000 * 3600 * 24);
    if (diffDays <= 7) {
      recency = 100;
    } else if (diffDays <= 30) {
      recency = 95 - (diffDays - 7) * 0.5; // decay slowly to 83.5
    } else if (diffDays <= 90) {
      recency = 80 - (diffDays - 30) * 0.3; // decay to 62
    } else {
      recency = Math.max(20, 60 - (diffDays - 90) * 0.1); // slow decay to 20
    }
  }

  // 5. Cross Reference (12%)
  // Overlap between candidate resume projects and active repositories (or README terms)
  let cross_reference = 50; // baseline
  if (resume.extractedProjects.length > 0 && github.repos.length > 0) {
    let matches = 0;
    resume.extractedProjects.forEach(proj => {
      const projCleaned = proj.toLowerCase();
      const hasMatch = github.repos.some(repo => {
        const repoName = repo.name.toLowerCase();
        const repoDesc = (repo.description || '').toLowerCase();
        const readmeContent = (repo.readme || '').toLowerCase();

        // Project keywords contained in repo names/descs or READMEs
        const words = projCleaned.split(/\s+/).filter(w => w.length > 3);
        const nameMatch = repoName.includes(projCleaned) || projCleaned.includes(repoName);
        const keywordMatch = words.some(w => repoName.includes(w) || repoDesc.includes(w) || readmeContent.includes(w));

        return nameMatch || keywordMatch;
      });
      if (hasMatch) matches++;
    });

    cross_reference = (matches / resume.extractedProjects.length) * 100;
    // ensure a reasonable baseline if we find partial keywords
    cross_reference = Math.min(100, Math.max(30, cross_reference));
  }

  // 6. Activity Consistency (8%)
  // Percentage of weeks in the past 52 weeks that contain at least one commit
  let activity_consistency = 30; // baseline default
  const commitWeeks = new Set<string>();

  github.repos.forEach(repo => {
    repo.commits.forEach(commit => {
      const date = new Date(commit.date);
      // Calculate ISO week number
      const year = date.getUTCFullYear();
      const oneJan = new Date(year, 0, 1);
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 3600 * 1000));
      const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
      commitWeeks.add(`${year}-w${week}`);
    });
  });

  if (commitWeeks.size > 0) {
    // 52 weeks in a year. If they have active commits in 20+ weeks, score high.
    activity_consistency = Math.min(100, (commitWeeks.size / 20) * 100);
  }

  // Calculate composite Score based on formula:
  // Score = (Skill_Verification * 0.25) + (Commit_Quality * 0.20) + (Project_Complexity * 0.20) + (Recency * 0.15) + (Cross_Reference * 0.12) + (Activity_Consistency * 0.08)
  let overall_score = 
    (skill_verification * 0.25) +
    (commit_quality * 0.20) +
    (project_complexity * 0.20) +
    (recency * 0.15) +
    (cross_reference * 0.12) +
    (activity_consistency * 0.08);

  // LeetCode / Portfolio Bonus adjustments:
  // - If they have LeetCode solved counts > 100, add +3 bonus
  // - If they have a working portfolio, add +2 bonus
  let bonus = 0;
  if (leetcode && leetcode.solvedTotal > 100) {
    bonus += Math.min(5, (leetcode.solvedTotal / 100) * 2.5); // max 5 pts
  }
  if (portfolio && portfolio.isUp) {
    bonus += 2;
  }

  overall_score = Math.min(100, overall_score + bonus);

  return {
    overall_score: Math.round(overall_score * 100) / 100,
    skill_verification: Math.round(skill_verification * 100) / 100,
    commit_quality: Math.round(commit_quality * 100) / 100,
    project_complexity: Math.round(project_complexity * 100) / 100,
    recency: Math.round(recency * 100) / 100,
    cross_reference: Math.round(cross_reference * 100) / 100,
    activity_consistency: Math.round(activity_consistency * 100) / 100,
    verified_keywords: verifiedKeywords,
    unverified_keywords: unverifiedKeywords
  };
}
