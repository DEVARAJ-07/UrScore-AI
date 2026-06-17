import { analyzeResumeText } from './resume';
import { githubCrawler } from './github';
import { extraScraper } from './portfolio';
import { computeUrScore } from './scoring';
import * as fs from 'fs';
import * as path from 'path';
import { generatePdfReport } from './pdf_generator';
import { uploadReportToS3, sendReportEmail } from './aws';

// Helper to log updates back to backend process via IPC or console
const logs: string[] = [];
function sendLog(text: string, progress: number) {
  const formattedText = `[WORKER] ${text}`;
  logs.push(formattedText);
  console.log(formattedText);
  if (process.send) {
    process.send({
      type: 'LOG',
      text: formattedText,
      progress
    });
  }
}

async function run() {
  fs.writeFileSync(path.resolve(__dirname, '../../worker_started.txt'), `started at ${new Date().toISOString()}`);
  // Read CLI arguments
  const args = process.argv.slice(2);
  const scanId = args[0] || 'mock-scan-id';
  const githubUsername = args[1] || 'octocat';
  const resumeText = args[2] || '';
  const leetcodeUsername = args[3] || null;
  const portfolioUrl = args[4] || null;
  const githubRepoName = args[5] || null;

  const targetRepoLog = githubRepoName ? ` (repo: ${githubRepoName})` : '';
  sendLog(`Starting competency verification for GitHub: ${githubUsername}${targetRepoLog}`, 5);

  try {
    // 1. Analyze Resume Text
    sendLog(`Analyzing resume text content for matching keywords...`, 15);
    const resumeAnalysis = analyzeResumeText(resumeText);
    sendLog(`Resume analyzed. Detected experience: ${resumeAnalysis.experienceYears} years. Found keywords: ${resumeAnalysis.totalKeywordsCount}.`, 25);

    // 2. Fetch/Scrape GitHub Profile
    sendLog(`Querying GitHub API metrics...`, 30);
    const githubProfile = await githubCrawler.fetchDeveloperProfile(githubUsername, githubRepoName, (msg, prog) => {
      sendLog(msg, prog);
    });
    sendLog(`GitHub repos parsed. Total repositories processed: ${githubProfile.repos.length}.`, 65);

    // 3. Optional: Scrape LeetCode and Portfolio website
    let leetcodeStats = null;
    if (leetcodeUsername && leetcodeUsername.trim() !== '') {
      sendLog(`Scraping LeetCode analytics for developer ${leetcodeUsername}...`, 70);
      leetcodeStats = await extraScraper.fetchLeetCode(leetcodeUsername, (msg) => sendLog(msg, 72));
    }

    let portfolioStats = null;
    if (portfolioUrl && portfolioUrl.trim() !== '') {
      sendLog(`Analyzing portfolio URL domain: ${portfolioUrl}...`, 75);
      portfolioStats = await extraScraper.scrapePortfolio(portfolioUrl, (msg) => sendLog(msg, 78));
    }

    // 4. Calculate UrScore
    sendLog(`Computing scoring matrices according to platform formula weighting...`, 85);
    const report = computeUrScore(resumeAnalysis, githubProfile, leetcodeStats, portfolioStats);
    sendLog(`Scoring calculation done. Composite Score: ${report.overall_score}/100.`, 90);

    // 5. Structure raw evidence schema
    const evidence = {
      github_profile: {
        username: githubProfile.username,
        name: githubProfile.name,
        avatar_url: githubProfile.avatar_url,
        public_repos: githubProfile.public_repos,
        followers: githubProfile.followers,
        created_at: githubProfile.created_at
      },
      repositories_analyzed: githubProfile.repos.map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        languages: r.languages,
        dependencies: r.dependencies,
        commits_analyzed: r.commits.length,
        readme_summary: r.readme ? `${r.readme.substring(0, 150)}...` : 'No README found',
        ai_description: r.ai_description || 'No analysis available',
        file_paths: r.file_paths || []
      })),
      resume_extracted_metrics: {
        keywords: resumeAnalysis.keywords,
        experience_years: resumeAnalysis.experienceYears,
        extracted_projects: resumeAnalysis.extractedProjects
      },
      leetcode_stats: leetcodeStats,
      portfolio_stats: portfolioStats,
      score_breakdown: {
        verified_keywords: report.verified_keywords,
        unverified_keywords: report.unverified_keywords
      }
    };

    // 6. Generate and Upload actual PDF report to AWS S3
    sendLog(`Generating print-ready PDF Competency Report...`, 92);
    const pdfPath = await generatePdfReport(report, evidence, scanId);
    
    sendLog(`Uploading report to AWS S3...`, 95);
    const filename = `${scanId}_competency_report.pdf`;
    let pdfUrl = '';
    try {
      if (process.env.AWS_ACCESS_KEY_ID) {
        pdfUrl = await uploadReportToS3(pdfPath, filename);
        sendLog(`Report uploaded successfully to S3: ${pdfUrl}`, 97);
        
        // 7. Send SES Email
        const email = process.env.AWS_SES_SENDER || 'devakrs07@gmail.com';
        if (email) {
          sendLog(`Dispatching report via AWS SES to ${email}...`, 98);
          await sendReportEmail(email, pdfUrl, githubProfile.name || githubProfile.username);
        }
      } else {
        pdfUrl = `http://localhost:5001/public/reports/${filename}`;
        sendLog(`[AWS WARNING] Missing credentials. Simulated PDF upload: ${pdfUrl}`, 97);
        try {
          const destDir = path.resolve(__dirname, '../../backend/public/reports');
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(pdfPath, path.join(destDir, filename));
        } catch (copyErr: any) {
          sendLog(`[SYSTEM ERROR] Local copy failed: ${copyErr.message}`, 97);
        }
      }
    } catch (e: any) {
      sendLog(`[AWS ERROR] S3/SES Failed: ${e.message}`, 97);
      pdfUrl = `http://localhost:5001/public/reports/${filename}`;
      try {
        const destDir = path.resolve(__dirname, '../../backend/public/reports');
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(pdfPath, path.join(destDir, filename));
      } catch (copyErr: any) {
        sendLog(`[SYSTEM ERROR] Local copy failed: ${copyErr.message}`, 97);
      }
    }

    const finalizedReport = {
      ...report,
      pdf_report_url: pdfUrl,
      summary_metrics: {
        total_repos: githubProfile.repos.length,
        verified_skills_count: report.verified_keywords.length,
        leetcode_solved: leetcodeStats ? leetcodeStats.solvedTotal : 0,
        portfolio_title: portfolioStats ? portfolioStats.title : null,
        experience_years: resumeAnalysis.experienceYears
      }
    };

    // Notify backend process of completion
    if (process.send) {
      process.send({
        type: 'COMPLETED',
        report: finalizedReport,
        evidence,
        logs
      }, (err) => {
        if (err) console.error("Failed to send COMPLETED ipc message:", err);
        sendLog(`Worker completed task successfully.`, 100);
        process.exit(0);
      });
    } else {
      sendLog(`Worker completed task successfully (No IPC channel).`, 100);
      process.exit(0);
    }

  } catch (err: any) {
    sendLog(`Fatal Error: ${err.message}`, 95);
    if (process.send) {
      process.send({
        type: 'FAILED',
        error: err.message,
        logs
      }, () => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }
}

run();
