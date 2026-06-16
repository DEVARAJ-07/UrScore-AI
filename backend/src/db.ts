import * as crypto from 'crypto';
import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('[DB] Successfully connected to MongoDB Atlas'))
    .catch(err => console.error('[DB] Failed to connect to MongoDB', err));
} else {
  console.error('[DB] MONGO_URI is missing from environment variables');
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'developer' | 'recruiter';
  created_at: Date;
}

export interface Scan {
  id: string;
  developer_id: string | null;
  github_username: string;
  github_repo_name: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  leetcode_username: string | null;
  status: 'pending' | 'parsing_resume' | 'fetching_github' | 'calculating' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CompetencyReport {
  id: string;
  scan_id: string;
  overall_score: number;
  skill_verification: number;
  commit_quality: number;
  project_complexity: number;
  recency: number;
  cross_reference: number;
  activity_consistency: number;
  summary_metrics: Record<string, any>;
  pdf_report_url: string | null;
  created_at: Date;
}

export interface EvidenceStore {
  id: string;
  scan_id: string;
  raw_evidence: Record<string, any>;
  created_at: Date;
}

// Mongoose Schemas
const scanSchema = new Schema({
  id: { type: String, required: true, unique: true },
  developer_id: { type: String, default: null },
  github_username: { type: String, required: true },
  github_repo_name: { type: String, default: null },
  resume_url: { type: String, default: null },
  portfolio_url: { type: String, default: null },
  leetcode_username: { type: String, default: null },
  status: { type: String, default: 'pending' },
  progress: { type: Number, default: 0 },
  logs: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const ScanModel = mongoose.model('Scan', scanSchema);

const reportSchema = new Schema({
  id: { type: String, required: true, unique: true },
  scan_id: { type: String, required: true },
  overall_score: Number,
  skill_verification: Number,
  commit_quality: Number,
  project_complexity: Number,
  recency: Number,
  cross_reference: Number,
  activity_consistency: Number,
  summary_metrics: Schema.Types.Mixed,
  pdf_report_url: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

const ReportModel = mongoose.model('Report', reportSchema);

const evidenceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  scan_id: { type: String, required: true },
  raw_evidence: Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now }
});

const EvidenceModel = mongoose.model('Evidence', evidenceSchema);

class DatabaseClient {
  public async getScan(id: string): Promise<Scan | null> {
    const doc = await ScanModel.findOne({ id }).lean();
    return doc as unknown as Scan;
  }

  public async getScans(): Promise<Scan[]> {
    const docs = await ScanModel.find().sort({ created_at: -1 }).lean();
    return docs as unknown as Scan[];
  }

  public async insertScan(scan: Partial<Scan> & { github_username: string }): Promise<Scan> {
    const id = scan.id || crypto.randomUUID();
    const newScan = new ScanModel({
      ...scan,
      id,
      created_at: scan.created_at || new Date(),
      updated_at: new Date()
    });
    await newScan.save();
    return newScan.toObject() as unknown as Scan;
  }

  public async updateScan(id: string, updates: Partial<Scan>): Promise<Scan> {
    const mongoUpdate: any = { $set: { ...updates, updated_at: new Date() } };
    
    if (updates.logs) {
      delete mongoUpdate.$set.logs;
      mongoUpdate.$push = { logs: { $each: updates.logs } };
    }

    const scan = await ScanModel.findOneAndUpdate(
      { id },
      mongoUpdate,
      { new: true }
    ).lean();

    if (!scan) throw new Error(`Scan ${id} not found`);
    return scan as unknown as Scan;
  }

  public async getReportByScanId(scanId: string): Promise<CompetencyReport | null> {
    const doc = await ReportModel.findOne({ scan_id: scanId }).lean();
    return doc as unknown as CompetencyReport;
  }

  public async insertReport(report: Omit<CompetencyReport, 'id' | 'created_at'>): Promise<CompetencyReport> {
    const id = crypto.randomUUID();
    const newReport = new ReportModel({
      ...report,
      id,
      created_at: new Date()
    });
    await newReport.save();
    return newReport.toObject() as unknown as CompetencyReport;
  }

  public async getEvidenceByScanId(scanId: string): Promise<EvidenceStore | null> {
    const doc = await EvidenceModel.findOne({ scan_id: scanId }).lean();
    return doc as unknown as EvidenceStore;
  }

  public async insertEvidence(scanId: string, raw_evidence: Record<string, any>): Promise<EvidenceStore> {
    const id = crypto.randomUUID();
    const newEvidence = new EvidenceModel({
      id,
      scan_id: scanId,
      raw_evidence,
      created_at: new Date()
    });
    await newEvidence.save();
    return newEvidence.toObject() as unknown as EvidenceStore;
  }
}

export const db = new DatabaseClient();
