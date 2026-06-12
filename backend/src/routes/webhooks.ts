import { Router, Request, Response } from 'express';
import { db } from '../db';
import { startWorkerScan } from '../services/runner';
import { getGateway } from '../ws/gateway';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Handle GitHub repository push webhook
router.post('/github', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Extract owner login and repo name from standard GitHub push payload
    const githubUsername = payload.repository?.owner?.login || payload.repository?.owner?.name || payload.pusher?.name;
    const repoName = payload.repository?.name;

    if (!githubUsername) {
      console.warn('[WEBHOOK] Received invalid GitHub webhook event payload (no owner details)');
      return res.status(400).json({ error: 'Invalid payload: missing repository owner details' });
    }

    console.log(`[WEBHOOK] Received push notification from GitHub user: ${githubUsername}, repo: ${repoName}`);

    // Retrieve previous scans matching this username
    const scans = await db.getScans();
    const matchingScan = scans.find(s => s.github_username.toLowerCase() === githubUsername.toLowerCase());

    if (!matchingScan) {
      console.warn(`[WEBHOOK] No prior scan records found for GitHub user "${githubUsername}". Webhook re-scoring bypassed.`);
      return res.status(404).json({
        message: 'No previous scan history found for this profile. Webhook received but bypassed.'
      });
    }

    // Retrieve resume text from local file if possible
    let resumeText = 'Re-score scan triggered automatically via GitHub Webhook.';
    let resumeFilename = '';
    
    if (matchingScan.resume_url) {
      try {
        resumeFilename = path.basename(matchingScan.resume_url);
        const resumePath = path.join(__dirname, '../../public/resumes', resumeFilename);
        if (fs.existsSync(resumePath)) {
          resumeText = fs.readFileSync(resumePath, 'utf8');
        }
      } catch (err: any) {
        console.warn(`[WEBHOOK] Could not read prior resume file: ${err.message}`);
      }
    }

    // Insert a new scan with status 'pending'
    const newScan = await db.insertScan({
      github_username: githubUsername,
      portfolio_url: matchingScan.portfolio_url,
      leetcode_username: matchingScan.leetcode_username,
      resume_url: matchingScan.resume_url,
      status: 'pending',
      progress: 0,
      logs: [`[SYSTEM] Webhook push event detected in repository "${repoName}". Triggering automatic re-scoring.`]
    });

    // Send WS update
    const gateway = getGateway();
    gateway.sendScanUpdate(newScan.id, {
      status: 'pending',
      progress: 0,
      logs: newScan.logs
    });

    // Trigger stateless parallel worker background job
    startWorkerScan(
      newScan.id,
      githubUsername,
      resumeText,
      matchingScan.leetcode_username,
      matchingScan.portfolio_url
    ).catch(err => {
      console.error(`[WEBHOOK] Background worker execution failed for scan ${newScan.id}:`, err);
    });

    res.status(202).json({
      message: 'Automatic re-score triggered successfully via Webhook',
      scanId: newScan.id,
      github_username: githubUsername,
      triggered_by_repo: repoName
    });

  } catch (err: any) {
    console.error('[WEBHOOK ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
