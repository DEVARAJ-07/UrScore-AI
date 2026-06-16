import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export const generatePdfReport = async (reportData: any, evidenceData: any, scanId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const filename = `${scanId}_competency_report.pdf`;
      const reportsDir = path.resolve(__dirname, '../../reports_tmp');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filePath = path.join(reportsDir, filename);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);

      // Color Palette
      const colors = {
        primary: '#0f172a',    // Dark Slate
        emerald: '#10b981',    // Emerald Green
        indigo: '#4f46e5',     // Indigo
        textDark: '#1e293b',   // Charcoal Slate
        textMuted: '#64748b',  // Slate Gray
        border: '#e2e8f0',     // Light Gray Border
        bgLight: '#f8fafc',    // Very Light Slate
        danger: '#ef4444'      // Coral Red
      };

      // Helper for drawing headers on new pages
      const addHeaderAndFooter = (sectionTitle: string, pageNum: number) => {
        // Header
        doc.fontSize(8).fillColor(colors.textMuted).text('UrScore AI Competency Report', 50, 25);
        doc.fontSize(8).fillColor(colors.textMuted).text(sectionTitle, 300, 25, { align: 'right', width: 245 });
        doc.moveTo(50, 38).lineTo(545, 38).strokeColor(colors.border).lineWidth(1).stroke();
        
        // Footer
        doc.moveTo(50, 795).lineTo(545, 795).strokeColor(colors.border).lineWidth(1).stroke();
        doc.fontSize(8).fillColor(colors.textMuted).text(`UrScore AI Engine - Private & Confidential`, 50, 805);
        doc.fontSize(8).fillColor(colors.textMuted).text(`Page ${pageNum}`, 300, 805, { align: 'right', width: 245 });
      };

      // --- PAGE 1: TITLE & CANDIDATE INFO & OVERVIEW ---
      addHeaderAndFooter('OVERVIEW', 1);

      // Title Block
      doc.y = 70;
      doc.fontSize(26).fillColor(colors.primary).text('UrScore AI', { continued: true });
      doc.fontSize(26).fillColor(colors.emerald).text(' Competency Report');
      
      doc.fontSize(10).fillColor(colors.textMuted).text(`Report Generated: ${new Date().toLocaleString()}`);
      doc.moveDown(1.5);

      // Candidate Metadata Card
      const name = evidenceData.github_profile?.name || evidenceData.github_profile?.username || 'Unknown Candidate';
      const username = evidenceData.github_profile?.username || 'N/A';
      
      doc.rect(50, doc.y, 495, 100).fillAndStroke(colors.bgLight, colors.border);
      
      const cardY = doc.y + 15;
      doc.fontSize(14).fillColor(colors.primary).text('Candidate Profile Summary', 70, cardY);
      doc.fontSize(11).fillColor(colors.textDark).text(`Name: ${name}`, 70, cardY + 25);
      doc.text(`GitHub Username: @${username}`, 70, cardY + 42);
      
      // Composite Score Badge on the right
      doc.rect(380, cardY - 5, 140, 75).fill(colors.emerald);
      doc.fontSize(12).fillColor('#ffffff').text('OVERALL URSCORE', 390, cardY, { align: 'center', width: 120 });
      doc.fontSize(28).text(`${reportData.overall_score || 0}`, 390, cardY + 18, { align: 'center', width: 120 });
      doc.fontSize(10).text('/ 100', 390, cardY + 50, { align: 'center', width: 120 });

      // Move doc cursor below the card
      doc.y = cardY + 95;

      // Score Breakdown Section
      doc.fontSize(16).fillColor(colors.primary).text('Competency Breakdown');
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor(colors.border).lineWidth(1).stroke();
      doc.moveDown(1.5);

      const metrics = [
        { label: 'Skill Verification', score: reportData.skill_verification, weight: '25%' },
        { label: 'Commit Quality', score: reportData.commit_quality, weight: '20%' },
        { label: 'Project Complexity', score: reportData.project_complexity, weight: '20%' },
        { label: 'Recency of Activity', score: reportData.recency, weight: '15%' },
        { label: 'Cross Reference Matching', score: reportData.cross_reference, weight: '12%' },
        { label: 'Activity Consistency', score: reportData.activity_consistency, weight: '8%' },
      ];

      metrics.forEach((m) => {
        const barWidth = 200;
        const fillWidth = (m.score / 100) * barWidth;
        const currentY = doc.y;

        doc.fontSize(11).fillColor(colors.textDark).text(`${m.label} (${m.weight})`, 50, currentY);
        doc.fontSize(11).fillColor(colors.primary).text(`${m.score}/100`, 280, currentY, { align: 'right', width: 50 });

        // Draw Progress Bar
        doc.rect(345, currentY + 2, barWidth, 10).fill(colors.border);
        doc.rect(345, currentY + 2, fillWidth, 10).fill(colors.indigo);

        doc.y = currentY + 22;
      });

      // --- SEGMENT 1: GITHUB ANALYSIS ---
      doc.addPage();
      addHeaderAndFooter('GITHUB ANALYSIS', 2);
      
      doc.y = 60;
      doc.fontSize(18).fillColor(colors.primary).text('1. GitHub Repositories Analysis');
      doc.fontSize(10).fillColor(colors.textMuted).text(`Repositories Audited: ${reportData.summary_metrics?.total_repos || evidenceData.repositories_analyzed?.length || 0}`);
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor(colors.border).lineWidth(1).stroke();
      doc.moveDown(1.5);

      const repos = evidenceData.repositories_analyzed || [];
      if (repos.length > 0) {
        repos.forEach((repo: any, index: number) => {
          // Check for page overflow
          if (doc.y > 620) {
            doc.addPage();
            addHeaderAndFooter('GITHUB ANALYSIS', 2);
            doc.y = 60;
          }

          const repoY = doc.y;
          doc.fontSize(13).fillColor(colors.indigo).text(`${index + 1}. ${repo.name}`);
          
          doc.fontSize(9).fillColor(colors.textMuted).text(
            `Stats: ${repo.stars || 0} Stars | ${repo.forks || 0} Forks | ${repo.commits_analyzed || 0} Commits Analyzed`,
            50,
            repoY + 16
          );

          // Files Accessed/Analyzed
          const filesLimit = 8;
          const files = repo.file_paths || [];
          const filesText = files.length > 0
            ? (files.slice(0, filesLimit).join(', ') + (files.length > filesLimit ? ` (and ${files.length - filesLimit} more)` : ''))
            : 'No source files accessed';

          doc.fontSize(9).fillColor(colors.textDark).text('Files Accessed: ', 50, repoY + 30, { continued: true });
          doc.fontSize(9).fillColor(colors.textMuted).text(filesText);

          // AI Description/Short Notes
          doc.fontSize(10).fillColor(colors.textDark).text('AI Analysis / Assessment:', 50, repoY + 45);
          doc.fontSize(10).fillColor(colors.textMuted).text(
            repo.ai_description || 'No analysis available for this repository.',
            65,
            repoY + 58,
            { width: 480 }
          );

          doc.y = doc.y + 12;
          // Draw a small divider between repos
          if (index < repos.length - 1) {
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(colors.border).lineWidth(0.5).stroke();
            doc.moveDown(0.8);
          }
        });
      } else {
        doc.fontSize(11).fillColor(colors.textMuted).text('No GitHub repositories were processed.');
      }

      // --- SEGMENT 2: RESUME ANALYSIS ---
      doc.addPage();
      addHeaderAndFooter('RESUME ANALYSIS', 3);
      
      doc.y = 60;
      doc.fontSize(18).fillColor(colors.primary).text('2. Resume Verification & Analysis');
      doc.fontSize(10).fillColor(colors.textMuted).text(`Experience Detected: ${reportData.summary_metrics?.experience_years || evidenceData.resume_extracted_metrics?.experience_years || 0} Years`);
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor(colors.border).lineWidth(1).stroke();
      doc.moveDown(1.5);

      // Resume Project Descriptions
      const extractedProjects = evidenceData.resume_extracted_metrics?.extracted_projects || [];
      doc.fontSize(14).fillColor(colors.primary).text('Extracted Projects from Resume');
      doc.moveDown(0.5);

      if (extractedProjects.length > 0) {
        extractedProjects.forEach((proj: any) => {
          if (doc.y > 650) {
            doc.addPage();
            addHeaderAndFooter('RESUME ANALYSIS', 3);
            doc.y = 60;
          }

          doc.fontSize(12).fillColor(colors.indigo).text(`• ${proj.name || 'Unnamed Project'}`);
          doc.fontSize(10).fillColor(colors.textDark).text(proj.description || 'No description provided.', {
            indent: 15,
            width: 480
          });
          doc.moveDown(0.8);
        });
      } else {
        doc.fontSize(11).fillColor(colors.textMuted).text('No project descriptions were extracted from the resume.');
        doc.moveDown(1);
      }

      // Matching Skills (Verified)
      if (doc.y > 600) {
        doc.addPage();
        addHeaderAndFooter('RESUME ANALYSIS', 3);
        doc.y = 60;
      }

      doc.fontSize(14).fillColor(colors.primary).text('Matching Skills (Verified via GitHub)');
      doc.fontSize(10).fillColor(colors.textMuted).text('Keywords detected on resume and verified through codebase languages/dependencies');
      doc.moveDown(0.5);

      const verified = evidenceData.score_breakdown?.verified_keywords || [];
      if (verified.length > 0) {
        // Group and render verified skills nicely
        let verifiedText = '';
        verified.forEach((s: string, i: number) => {
          verifiedText += `✓ ${s}    `;
          if ((i + 1) % 4 === 0) verifiedText += '\n';
        });
        doc.fontSize(10).fillColor(colors.emerald).text(verifiedText, { indent: 15, lineGap: 4 });
      } else {
        doc.fontSize(10).fillColor(colors.textMuted).text('No matching skills were successfully verified.');
      }
      doc.moveDown(1.5);

      // Matching Keywords (All Extracted Resume Keywords)
      if (doc.y > 600) {
        doc.addPage();
        addHeaderAndFooter('RESUME ANALYSIS', 3);
        doc.y = 60;
      }

      doc.fontSize(14).fillColor(colors.primary).text('Resume Extracted Keywords');
      doc.fontSize(10).fillColor(colors.textMuted).text('All technical keyword indicators parsed from the candidate resume');
      doc.moveDown(0.5);

      const resumeKeywords = evidenceData.resume_extracted_metrics?.keywords;
      if (resumeKeywords) {
        const categories = [
          { name: 'Languages', items: resumeKeywords.languages },
          { name: 'Frameworks/Libraries', items: resumeKeywords.frameworks },
          { name: 'Databases', items: resumeKeywords.databases },
          { name: 'Tools/DevOps', items: resumeKeywords.tools }
        ];

        categories.forEach((cat) => {
          if (cat.items && cat.items.length > 0) {
            doc.fontSize(11).fillColor(colors.textDark).text(`${cat.name}:`, { indent: 15 });
            doc.fontSize(10).fillColor(colors.textMuted).text(cat.items.join(', '), { indent: 30 });
            doc.moveDown(0.4);
          }
        });
      } else {
        doc.fontSize(10).fillColor(colors.textMuted).text('No keywords extracted.');
      }

      // --- SEGMENT 3: LEETCODE STATS (OPTIONAL) ---
      if (evidenceData.leetcode_stats) {
        doc.addPage();
        addHeaderAndFooter('LEETCODE STATS', 4);
        
        doc.y = 60;
        doc.fontSize(18).fillColor(colors.primary).text('3. LeetCode Algorithm Statistics');
        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor(colors.border).lineWidth(1).stroke();
        doc.moveDown(1.5);

        const lc = evidenceData.leetcode_stats;
        
        // Summary Cards Grid
        const gridY = doc.y;
        
        // Total Solved Box
        doc.rect(50, gridY, 150, 80).fillAndStroke(colors.bgLight, colors.border);
        doc.fontSize(10).fillColor(colors.textMuted).text('TOTAL PROBLEMS SOLVED', 60, gridY + 15);
        doc.fontSize(24).fillColor(colors.primary).text(`${lc.solvedTotal || 0}`, 60, gridY + 32);

        // Acceptance Rate Box
        doc.rect(222, gridY, 150, 80).fillAndStroke(colors.bgLight, colors.border);
        doc.fontSize(10).fillColor(colors.textMuted).text('ACCEPTANCE RATE', 232, gridY + 15);
        doc.fontSize(24).fillColor(colors.primary).text(`${lc.acceptanceRate || 0}%`, 232, gridY + 32);

        // Ranking Box
        doc.rect(395, gridY, 150, 80).fillAndStroke(colors.bgLight, colors.border);
        doc.fontSize(10).fillColor(colors.textMuted).text('GLOBAL RANKING', 405, gridY + 15);
        doc.fontSize(24).fillColor(colors.primary).text(lc.ranking > 0 ? `#${lc.ranking.toLocaleString()}` : 'N/A', 405, gridY + 32);

        doc.y = gridY + 105;

        // Difficulty Breakdown
        doc.fontSize(14).fillColor(colors.primary).text('Difficulty Breakdown');
        doc.moveDown(0.5);

        const difficulty = [
          { name: 'Easy', count: lc.solvedEasy, color: colors.emerald },
          { name: 'Medium', count: lc.solvedMedium, color: '#d97706' }, // Amber
          { name: 'Hard', count: lc.solvedHard, color: colors.danger }
        ];

        difficulty.forEach((diff) => {
          const currentY = doc.y;
          doc.fontSize(11).fillColor(colors.textDark).text(diff.name, 50, currentY);
          doc.fontSize(11).fillColor(colors.textDark).text(`${diff.count || 0} solved`, 180, currentY);

          // Mini bar representation
          const maxBarWidth = 250;
          // compute proportional width relative to total solved
          const totalVal = Math.max(1, lc.solvedTotal || 1);
          const barW = ((diff.count || 0) / totalVal) * maxBarWidth;
          
          doc.rect(260, currentY + 2, maxBarWidth, 8).fill(colors.border);
          doc.rect(260, currentY + 2, barW, 8).fill(diff.color);

          doc.y = currentY + 20;
        });
        doc.moveDown(1.5);

        // Topic stats
        if (lc.topicStats && lc.topicStats.length > 0) {
          doc.fontSize(14).fillColor(colors.primary).text('Algorithm Focus Areas (Top Topics)');
          doc.moveDown(0.5);

          let topicsText = '';
          lc.topicStats.forEach((topic: any, idx: number) => {
            topicsText += `${topic.tagName} (${topic.problemsSolved})    `;
            if ((idx + 1) % 4 === 0) topicsText += '\n';
          });
          doc.fontSize(10).fillColor(colors.textDark).text(topicsText, { indent: 15, lineGap: 4 });
        }
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
      
    } catch (err) {
      reject(err);
    }
  });
};
