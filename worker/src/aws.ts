import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import * as fs from 'fs';

const REGION = process.env.AWS_REGION || "global"; 
// We default to us-east-1 for "global" as SES is mostly tied to specific regions
const actualRegion = REGION === 'global' ? 'us-east-1' : REGION;

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "urscore-reports";
const SENDER_EMAIL = process.env.AWS_SES_SENDER || "devakrs07@gmail.com";

const s3Client = new S3Client({
  region: actualRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const sesClient = new SESClient({
  region: actualRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export const uploadReportToS3 = async (filePath: string, filename: string): Promise<string> => {
  try {
    const fileStream = fs.createReadStream(filePath);
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: `reports/${filename}`,
      Body: fileStream,
      ContentType: "application/pdf"
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Construct the public URL assuming the bucket is public or we return a presigned URL.
    const url = `https://${BUCKET_NAME}.s3.${actualRegion}.amazonaws.com/reports/${filename}`;
    return url;
  } catch (err: any) {
    console.error("Error uploading to S3:", err);
    throw new Error(`Failed to upload to S3: ${err.message}`);
  }
};

export const sendReportEmail = async (recipientEmail: string, reportUrl: string, candidateName: string) => {
  try {
    const params = {
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <h2>UrScore AI Competency Report</h2>
              <p>Hello,</p>
              <p>The competency report for <strong>${candidateName}</strong> has been successfully generated.</p>
              <p>You can view and download the verified PDF report here:</p>
              <p><a href="${reportUrl}">${reportUrl}</a></p>
              <br/>
              <p>Best regards,<br/>UrScore AI Team</p>
            `,
          },
          Text: {
            Charset: "UTF-8",
            Data: `Hello,\n\nThe competency report for ${candidateName} has been successfully generated.\nView it here: ${reportUrl}\n\nBest regards,\nUrScore AI Team`,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `UrScore AI Report Ready: ${candidateName}`,
        },
      },
      Source: SENDER_EMAIL,
    };

    await sesClient.send(new SendEmailCommand(params));
    return true;
  } catch (err: any) {
    console.error("Error sending SES email:", err);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};
