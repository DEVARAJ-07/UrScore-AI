import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getGateway } from '../ws/gateway';
import { startWorkerScan } from '../services/runner';
import axios from 'axios';

const router = Router();

// Retrieve all scans
router.get('/', async (req: Request, res: Response) => {
  try {
    const scans = await db.getScans();
    res.json(scans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve specific scan details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scan = await db.getScan(req.params.id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve the calculated competency report
router.get('/:id/report', async (req: Request, res: Response) => {
  try {
    const report = await db.getReportByScanId(req.params.id);
    if (!report) return res.status(404).json({ error: 'Competency report not found for this scan' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve the raw evidence logs
router.get('/:id/evidence', async (req: Request, res: Response) => {
  try {
    const evidence = await db.getEvidenceByScanId(req.params.id);
    if (!evidence) return res.status(404).json({ error: 'No raw evidence stored for this scan' });
    res.json(evidence);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger a new placement scan (B2B2C worker pattern)
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    const { github_username, github_repo_name, resume_text, resume_filename, portfolio_url, leetcode_username } = req.body;

    if (!github_username) {
      return res.status(400).json({ error: 'GitHub username is required' });
    }

    // 1. Perform GitHub existence validation check
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = { 'User-Agent': 'UrScore-AI-API' };
    if (token) headers['Authorization'] = `token ${token}`;

    try {
      if (github_repo_name) {
        console.log(`[API] Checking if repo exists: https://github.com/${github_username}/${github_repo_name}`);
        await axios.get(`https://api.github.com/repos/${github_username}/${github_repo_name}`, { headers, timeout: 3500 });
      } else {
        console.log(`[API] Checking if user exists: https://github.com/${github_username}`);
        await axios.get(`https://api.github.com/users/${github_username}`, { headers, timeout: 3500 });
      }
    } catch (err: any) {
      // If the error status is explicitly 404, return validation failure
      if (err.response && err.response.status === 404) {
        const targetDesc = github_repo_name 
          ? `Repository "${github_username}/${github_repo_name}"` 
          : `GitHub Username "${github_username}"`;
        return res.status(422).json({
          error: `${targetDesc} does not exist. Please enter a valid GitHub account or repository link.`
        });
      }
      // If rate-limited or timeout, log warning and let background worker handle mock fallback
      console.warn(`[API WARNING] GitHub validation check bypassed due to network/rate-limit: ${err.message}`);
    }

    // Insert scan with "pending" status
    const scan = await db.insertScan({
      github_username,
      portfolio_url: portfolio_url || null,
      leetcode_username: leetcode_username || null,
      resume_url: resume_filename ? `http://localhost:5001/public/resumes/${resume_filename}` : null,
      status: 'pending',
      progress: 0,
      logs: [`[SYSTEM] Created scan request for GitHub user ${github_username}.`]
    });

    // Send WS update
    const gateway = getGateway();
    gateway.sendScanUpdate(scan.id, {
      status: 'pending',
      progress: 0,
      logs: scan.logs
    });

    // Trigger stateless parallel worker background job
    startWorkerScan(scan.id, github_username, resume_text || '', leetcode_username || null, portfolio_url || null)
      .catch(err => {
        console.error(`Error in background worker for scan ${scan.id}:`, err);
      });

    res.status(202).json({
      message: 'Scan triggered successfully',
      scanId: scan.id,
      status: scan.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
