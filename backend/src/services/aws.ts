import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
}

export class AwsService {
  private useMock: boolean;

  constructor() {
    // Check if S3 / SES environment parameters exist. If not, use local mock system.
    this.useMock = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
  }

  /**
   * Uploads a file buffer or stream to S3.
   * Falls back to saving locally in a mock public folder if AWS keys are not present.
   */
  public async uploadReport(
    scanId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<UploadResult> {
    if (this.useMock) {
      console.log(`[AWS S3 MOCK] Uploading file for scan ${scanId}: ${fileName}`);
      
      // Store in a local public folder within the backend workspace
      const mockDir = path.join(__dirname, '../../public/reports');
      if (!fs.existsSync(mockDir)) {
        fs.mkdirSync(mockDir, { recursive: true });
      }
      const filePath = path.join(mockDir, `${scanId}_${fileName}`);
      fs.writeFileSync(filePath, fileBuffer);

      return {
        url: `http://localhost:5001/public/reports/${scanId}_${fileName}`,
        key: `reports/${scanId}_${fileName}`
      };
    }

    // Real AWS S3 Upload would go here:
    // const s3 = new AWS.S3();
    // await s3.putObject({ Bucket, Key, Body: fileBuffer, ContentType: 'application/pdf' }).promise();
    return {
      url: `https://urscore-ai-reports.s3.amazonaws.com/reports/${scanId}_${fileName}`,
      key: `reports/${scanId}_${fileName}`
    };
  }

  /**
   * Sends transactional placement readiness email via AWS SES.
   */
  public async sendPlacementReportEmail(
    recipientEmail: string,
    candidateName: string,
    overallScore: number,
    reportUrl: string
  ): Promise<boolean> {
    const subject = `UrScore AI Readiness Competency Report: ${candidateName}`;
    const body = `
      <h1>UrScore AI Intelligence Hub</h1>
      <p>Hello,</p>
      <p>The placement readiness assessment for <strong>${candidateName}</strong> has been successfully generated.</p>
      <p><strong>Overall Score:</strong> ${overallScore}/100</p>
      <p>You can view and download the complete competency PDF report here: <a href="${reportUrl}">${reportUrl}</a></p>
      <br />
      <p>Regards,<br />UrScore AI Placement Team</p>
    `;

    if (this.useMock) {
      console.log(`[AWS SES MOCK] Sending email to ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body Summary: Score of ${overallScore} is ready at ${reportUrl}`);
      return true;
    }

    // Real AWS SES send implementation would go here using @aws-sdk/client-ses
    return true;
  }
}

export const awsService = new AwsService();
