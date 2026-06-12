import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getGateway } from '../ws/gateway';
import { startWorkerScan } from '../services/runner';

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
    const { github_username, resume_text, resume_filename, portfolio_url, leetcode_username } = req.body;

    if (!github_username) {
      return res.status(400).json({ error: 'GitHub username is required' });
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
