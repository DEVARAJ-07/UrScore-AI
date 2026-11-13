import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Disable Mongoose command buffering so queries never hang for 10000ms if Mongo is disconnected
mongoose.set('bufferCommands', false);

// Connect to MongoDB with timeout
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  })
    .then(() => console.log('[DB] Successfully connected to MongoDB Atlas'))
    .catch(err => console.error('[DB] Failed to connect to MongoDB Atlas (fallback store active):', err.message));
} else {
  console.warn('[DB] MONGO_URI is missing from environment variables. Local fallback store active.');
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
  private scansFile = path.resolve(__dirname, '../scans_db.json');
  private reportsFile = path.resolve(__dirname, '../reports_db.json');
  private evidenceFile = path.resolve(__dirname, '../evidence_db.json');

  private scans: Map<string, Scan> = new Map();
  private reports: Map<string, CompetencyReport> = new Map();
  private evidence: Map<string, EvidenceStore> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.scansFile)) {
        const data = JSON.parse(fs.readFileSync(this.scansFile, 'utf8'));
        Object.keys(data).forEach(k => this.scans.set(k, data[k]));
      }
      if (fs.existsSync(this.reportsFile)) {
        const data = JSON.parse(fs.readFileSync(this.reportsFile, 'utf8'));
        Object.keys(data).forEach(k => this.reports.set(k, data[k]));
      }
      if (fs.existsSync(this.evidenceFile)) {
        const data = JSON.parse(fs.readFileSync(this.evidenceFile, 'utf8'));
        Object.keys(data).forEach(k => this.evidence.set(k, data[k]));
      }
    } catch (err: any) {
      console.error('[DB] Error loading fallback database files:', err.message);
    }
  }

  private saveData() {
    try {
      const scansObj: Record<string, Scan> = {};
      this.scans.forEach((v, k) => { scansObj[k] = v; });
      fs.writeFileSync(this.scansFile, JSON.stringify(scansObj, null, 2));

      const reportsObj: Record<string, CompetencyReport> = {};
      this.reports.forEach((v, k) => { reportsObj[k] = v; });
      fs.writeFileSync(this.reportsFile, JSON.stringify(reportsObj, null, 2));

      const evidenceObj: Record<string, EvidenceStore> = {};
      this.evidence.forEach((v, k) => { evidenceObj[k] = v; });
      fs.writeFileSync(this.evidenceFile, JSON.stringify(evidenceObj, null, 2));
    } catch (err: any) {
      console.error('[DB] Error saving fallback database files:', err.message);
    }
  }

  private isMongoReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  public async getScan(id: string): Promise<Scan | null> {
    if (this.isMongoReady()) {
      try {
        const doc = await ScanModel.findOne({ id }).lean();
        if (doc) return doc as unknown as Scan;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo getScan fallback: ${err.message}`);
      }
    }
    return this.scans.get(id) || null;
  }

  public async getScans(): Promise<Scan[]> {
    if (this.isMongoReady()) {
      try {
        const docs = await ScanModel.find().sort({ created_at: -1 }).lean();
        if (docs && docs.length > 0) return docs as unknown as Scan[];
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo getScans fallback: ${err.message}`);
      }
    }
    return Array.from(this.scans.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async insertScan(scan: Partial<Scan> & { github_username: string }): Promise<Scan> {
    const id = scan.id || crypto.randomUUID();
    const newScanData: Scan = {
      id,
      developer_id: scan.developer_id || null,
      github_username: scan.github_username,
      github_repo_name: scan.github_repo_name || null,
      resume_url: scan.resume_url || null,
      portfolio_url: scan.portfolio_url || null,
      leetcode_username: scan.leetcode_username || null,
      status: scan.status || 'pending',
      progress: scan.progress || 0,
      logs: scan.logs || [],
      created_at: scan.created_at || new Date(),
      updated_at: new Date()
    };

    // Always keep fallback updated so no scan is ever lost
    this.scans.set(id, newScanData);
    this.saveData();

    if (this.isMongoReady()) {
      try {
        const newScan = new ScanModel(newScanData);
        await newScan.save();
        return newScan.toObject() as unknown as Scan;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo insertScan fallback: ${err.message}`);
      }
    }

    return newScanData;
  }

  public async updateScan(id: string, updates: Partial<Scan>): Promise<Scan> {
    const existing = this.scans.get(id);
    const combinedLogs = updates.logs 
      ? [...(existing?.logs || []), ...updates.logs] 
      : (existing?.logs || []);

    const updatedScan: Scan = {
      id,
      developer_id: existing?.developer_id || null,
      github_username: existing?.github_username || 'unknown',
      github_repo_name: existing?.github_repo_name || null,
      resume_url: existing?.resume_url || null,
      portfolio_url: existing?.portfolio_url || null,
      leetcode_username: existing?.leetcode_username || null,
      status: existing?.status || 'pending',
      progress: existing?.progress || 0,
      created_at: existing?.created_at || new Date(),
      ...updates,
      logs: combinedLogs,
      updated_at: new Date()
    };

    this.scans.set(id, updatedScan);
    this.saveData();

    if (this.isMongoReady()) {
      try {
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
        if (scan) return scan as unknown as Scan;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo updateScan fallback: ${err.message}`);
      }
    }

    return updatedScan;
  }

  public async getReportByScanId(scanId: string): Promise<CompetencyReport | null> {
    if (this.isMongoReady()) {
      try {
        const doc = await ReportModel.findOne({ scan_id: scanId }).lean();
        if (doc) return doc as unknown as CompetencyReport;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo getReportByScanId fallback: ${err.message}`);
      }
    }
    return Array.from(this.reports.values()).find(r => r.scan_id === scanId) || null;
  }

  public async insertReport(report: Omit<CompetencyReport, 'id' | 'created_at'>): Promise<CompetencyReport> {
    const id = crypto.randomUUID();
    const createdReport: CompetencyReport = {
      ...report,
      id,
      created_at: new Date()
    };

    this.reports.set(id, createdReport);
    this.saveData();

    if (this.isMongoReady()) {
      try {
        const newReport = new ReportModel(createdReport);
        await newReport.save();
        return newReport.toObject() as unknown as CompetencyReport;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo insertReport fallback: ${err.message}`);
      }
    }

    return createdReport;
  }

  public async getEvidenceByScanId(scanId: string): Promise<EvidenceStore | null> {
    if (this.isMongoReady()) {
      try {
        const doc = await EvidenceModel.findOne({ scan_id: scanId }).lean();
        if (doc) return doc as unknown as EvidenceStore;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo getEvidenceByScanId fallback: ${err.message}`);
      }
    }
    return Array.from(this.evidence.values()).find(e => e.scan_id === scanId) || null;
  }

  public async insertEvidence(scanId: string, raw_evidence: Record<string, any>): Promise<EvidenceStore> {
    const id = crypto.randomUUID();
    const createdEvidence: EvidenceStore = {
      id,
      scan_id: scanId,
      raw_evidence,
      created_at: new Date()
    };

    this.evidence.set(id, createdEvidence);
    this.saveData();

    if (this.isMongoReady()) {
      try {
        const newEvidence = new EvidenceModel(createdEvidence);
        await newEvidence.save();
        return newEvidence.toObject() as unknown as EvidenceStore;
      } catch (err: any) {
        console.warn(`[DB WARNING] Mongo insertEvidence fallback: ${err.message}`);
      }
    }

    return createdEvidence;
  }
}

export const db = new DatabaseClient();
