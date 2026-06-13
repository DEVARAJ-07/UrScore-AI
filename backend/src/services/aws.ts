import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export interface UploadResult {
  url: string;
  key: string;
}

export class AwsService {
  private useMock: boolean;
  private s3Client: S3Client | null = null;
  private sesClient: SESClient | null = null;
  private region: string;
  private bucket: string;
  private sender: string;

  constructor() {
    // Check if S3 / SES environment parameters exist. If not, use local mock system.
    this.useMock = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || 'urscore-ai-reports';
    this.sender = process.env.AWS_SES_SENDER || 'no-reply@urscore.ai';

    if (!this.useMock) {
      console.log(`[AWS] Initializing S3 and SES clients in region: ${this.region}`);
      const credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      };
      this.s3Client = new S3Client({ region: this.region, credentials });
      this.sesClient = new SESClient({ region: this.region, credentials });
    }
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
    const key = `reports/${scanId}_${fileName}`;

    if (this.useMock || !this.s3Client) {
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
        key
      };
    }

    try {
      console.log(`[AWS S3] Uploading file to bucket: ${this.bucket}, key: ${key}`);
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: 'application/pdf'
      });
      await this.s3Client.send(command);

      return {
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        key
      };
    } catch (err: any) {
      console.error(`[AWS S3 ERROR] Failed to upload: ${err.message}. Saving locally as fallback.`);
      const mockDir = path.join(__dirname, '../../public/reports');
      if (!fs.existsSync(mockDir)) {
        fs.mkdirSync(mockDir, { recursive: true });
      }
      const filePath = path.join(mockDir, `${scanId}_${fileName}`);
      fs.writeFileSync(filePath, fileBuffer);

      return {
        url: `http://localhost:5001/public/reports/${scanId}_${fileName}`,
        key
      };
    }
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
    const htmlBody = `
      <h1>UrScore AI Intelligence Hub</h1>
      <p>Hello,</p>
      <p>The placement readiness assessment for <strong>${candidateName}</strong> has been successfully generated.</p>
      <p><strong>Overall Score:</strong> ${overallScore}/100</p>
      <p>You can view and download the complete competency PDF report here: <a href="${reportUrl}">${reportUrl}</a></p>
      <br />
      <p>Regards,<br />UrScore AI Placement Team</p>
    `;

    if (this.useMock || !this.sesClient) {
      console.log(`[AWS SES MOCK] Sending email to ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body Summary: Score of ${overallScore} is ready at ${reportUrl}`);
      return true;
    }

    try {
      console.log(`[AWS SES] Sending email to: ${recipientEmail} from: ${this.sender}`);
      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [recipientEmail]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: htmlBody
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: this.sender
      });
      await this.sesClient.send(command);
      console.log(`[AWS SES] Email sent successfully.`);
      return true;
    } catch (err: any) {
      console.error(`[AWS SES ERROR] Failed to send email: ${err.message}`);
      return false;
    }
  }
}

export const awsService = new AwsService();
