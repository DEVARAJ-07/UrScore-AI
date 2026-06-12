import { fork } from 'child_process';
import * as path from 'path';
import { db } from '../db';
import { getGateway } from '../ws/gateway';

export async function startWorkerScan(
  scanId: string,
  githubUsername: string,
  resumeText: string,
  leetcodeUsername: string | null,
  portfolioUrl: string | null
): Promise<void> {
  const gateway = getGateway();
  
  // Path to the worker script
  // During local development using ts-node, we execute the TypeScript worker directly.
  const workerPath = path.resolve(__dirname, '../../../worker/src/index.ts');
  
  console.log(`[RUNNER] Spawning worker for scan ${scanId} at path: ${workerPath}`);

  // We spawn the worker using ts-node to execute TypeScript directly
  const child = fork(
    path.resolve(__dirname, '../../node_modules/ts-node/dist/bin.js'),
    [
      workerPath,
      scanId,
      githubUsername,
      resumeText || '',
      leetcodeUsername || '',
      portfolioUrl || ''
    ],
    {
      env: {
        ...process.env,
        TS_NODE_PROJECT: path.resolve(__dirname, '../../../worker/tsconfig.json')
      },
      stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    }
  );

  child.on('message', async (message: any) => {
    try {
      if (!message || typeof message !== 'object') return;

      const { type } = message;

      if (type === 'LOG') {
        const { text, progress } = message;
        // Append log to DB and update progress
        const updatedScan = await db.updateScan(scanId, {
          status: 'fetching_github', // generic processing status
          progress: progress,
          logs: [text]
        });
        
        // Push update to WebSockets
        gateway.sendScanUpdate(scanId, {
          status: updatedScan.status,
          progress: updatedScan.progress,
          logs: [text]
        });
      } 
      
      else if (type === 'COMPLETED') {
        const { report, evidence, logs } = message;

        // Insert report and evidence into db
        await db.insertReport({
          scan_id: scanId,
          overall_score: report.overall_score,
          skill_verification: report.skill_verification,
          commit_quality: report.commit_quality,
          project_complexity: report.project_complexity,
          recency: report.recency,
          cross_reference: report.cross_reference,
          activity_consistency: report.activity_consistency,
          summary_metrics: report.summary_metrics,
          pdf_report_url: report.pdf_report_url || null
        });

        await db.insertEvidence(scanId, evidence);

        const updatedScan = await db.updateScan(scanId, {
          status: 'completed',
          progress: 100,
          logs: logs || ['[SYSTEM] Scan completed successfully.']
        });

        gateway.sendScanUpdate(scanId, {
          status: 'completed',
          progress: 100,
          logs: ['[SYSTEM] Competency Report finalized. Processing done.']
        });
      } 
      
      else if (type === 'FAILED') {
        const { error, logs } = message;
        
        const updatedScan = await db.updateScan(scanId, {
          status: 'failed',
          progress: 100,
          logs: logs || [`[ERROR] Worker failed: ${error}`]
        });

        gateway.sendScanUpdate(scanId, {
          status: 'failed',
          progress: 100,
          logs: [`[SYSTEM ERROR] Worker failed: ${error}`]
        });
      }
    } catch (err) {
      console.error(`Error processing message from worker for scan ${scanId}:`, err);
    }
  });

  child.on('error', async (err) => {
    console.error(`Child worker error for scan ${scanId}:`, err);
    await db.updateScan(scanId, {
      status: 'failed',
      progress: 100,
      logs: [`[SYSTEM ERROR] Child worker process encountered an error: ${err.message}`]
    });
    gateway.sendScanUpdate(scanId, {
      status: 'failed',
      progress: 100,
      logs: [`[SYSTEM ERROR] Process crashed.`]
    });
  });

  child.on('exit', async (code) => {
    console.log(`Worker process for scan ${scanId} exited with code ${code}`);
    if (code !== 0) {
      const scan = await db.getScan(scanId);
      if (scan && scan.status !== 'completed' && scan.status !== 'failed') {
        await db.updateScan(scanId, {
          status: 'failed',
          progress: 100,
          logs: [`[SYSTEM ERROR] Worker process exited prematurely with code ${code}`]
        });
        gateway.sendScanUpdate(scanId, {
          status: 'failed',
          progress: 100,
          logs: [`[SYSTEM ERROR] Process exited with status code ${code}`]
        });
      }
    }
  });
}
