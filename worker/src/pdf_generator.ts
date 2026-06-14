import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export const generatePdfReport = async (reportData: any, evidenceData: any, scanId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `${scanId}_competency_report.pdf`;
      const reportsDir = path.resolve(__dirname, '../../reports_tmp');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filePath = path.join(reportsDir, filename);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);

      // Header
      doc.fontSize(24).fillColor('#10b981').text('UrScore AI Competency Report', { align: 'center' });
      doc.moveDown();

      // Candidate Info
      doc.fontSize(14).fillColor('#333333').text(`Candidate: ${evidenceData.github_profile?.name || evidenceData.github_profile?.username || 'Unknown'}`);
      doc.fontSize(12).text(`GitHub: @${evidenceData.github_profile?.username || 'N/A'}`);
      doc.text(`Composite Score: ${reportData.overall_score} / 100`);
      doc.moveDown();

      // Section: Resume Analysis
      doc.fontSize(16).fillColor('#10b981').text('Resume Verification');
      doc.fontSize(12).fillColor('#555555').text(`Experience Years: ${reportData.summary_metrics?.experience_years || 0}`);
      doc.text(`Keywords Found: ${evidenceData.resume_extracted_metrics?.keywords?.length || 0}`);
      doc.moveDown();

      // Section: GitHub Verification
      doc.fontSize(16).fillColor('#10b981').text('GitHub Verification');
      doc.fontSize(12).fillColor('#555555').text(`Repositories Audited: ${reportData.summary_metrics?.total_repos || 0}`);
      doc.text(`Verified Skills: ${reportData.summary_metrics?.verified_skills_count || 0}`);
      doc.moveDown();

      // Verified Skills List
      if (evidenceData.score_breakdown?.verified_keywords?.length > 0) {
        doc.fontSize(14).fillColor('#333333').text('Verified Technical Proficiencies:');
        evidenceData.score_breakdown.verified_keywords.forEach((skill: string) => {
          doc.fontSize(10).fillColor('#10b981').text(`✓ ${skill}`, { indent: 20 });
        });
        doc.moveDown();
      }

      if (evidenceData.score_breakdown?.unverified_keywords?.length > 0) {
        doc.fontSize(14).fillColor('#333333').text('Unverified Technical Proficiencies (Not found in repos):');
        evidenceData.score_breakdown.unverified_keywords.forEach((skill: string) => {
          doc.fontSize(10).fillColor('#e63946').text(`✗ ${skill}`, { indent: 20 });
        });
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).fillColor('#999999').text(`Generated automatically by UrScore AI Engine on ${new Date().toLocaleString()}`, { align: 'center' });

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
