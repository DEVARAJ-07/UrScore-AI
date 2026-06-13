import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Define DB Models matching schema.sql
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

// Memory database with file synchronization for simple mock persistence
class DatabaseClient {
  private scansFile = path.join(__dirname, '../scans_db.json');
  private reportsFile = path.join(__dirname, '../reports_db.json');
  private evidenceFile = path.join(__dirname, '../evidence_db.json');

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
    } catch (err) {
      console.error('Error loading mock database files:', err);
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
    } catch (err) {
      console.error('Error saving mock database files:', err);
    }
  }

  // --- Scans Table CRUD ---
  public async getScan(id: string): Promise<Scan | null> {
    return this.scans.get(id) || null;
  }

  public async getScans(): Promise<Scan[]> {
    return Array.from(this.scans.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async insertScan(scan: Partial<Scan> & { github_username: string }): Promise<Scan> {
    const id = scan.id || crypto.randomUUID();
    const newScan: Scan = {
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
    this.scans.set(id, newScan);
    this.saveData();
    return newScan;
  }

  public async updateScan(id: string, updates: Partial<Scan>): Promise<Scan> {
    const scan = this.scans.get(id);
    if (!scan) throw new Error(`Scan ${id} not found`);
    
    const updatedScan: Scan = {
      ...scan,
      ...updates,
      logs: updates.logs ? [...scan.logs, ...updates.logs] : scan.logs,
      updated_at: new Date()
    };
    this.scans.set(id, updatedScan);
    this.saveData();
    return updatedScan;
  }

  // --- Competency Reports Table CRUD ---
  public async getReportByScanId(scanId: string): Promise<CompetencyReport | null> {
    return Array.from(this.reports.values()).find(r => r.scan_id === scanId) || null;
  }

  public async insertReport(report: Omit<CompetencyReport, 'id' | 'created_at'>): Promise<CompetencyReport> {
    const id = crypto.randomUUID();
    const newReport: CompetencyReport = {
      ...report,
      id,
      created_at: new Date()
    };
    this.reports.set(id, newReport);
    this.saveData();
    return newReport;
  }

  // --- Evidence Table CRUD ---
  public async getEvidenceByScanId(scanId: string): Promise<EvidenceStore | null> {
    return Array.from(this.evidence.values()).find(e => e.scan_id === scanId) || null;
  }

  public async insertEvidence(scanId: string, raw_evidence: Record<string, any>): Promise<EvidenceStore> {
    const id = crypto.randomUUID();
    const newEvidence: EvidenceStore = {
      id,
      scan_id: scanId,
      raw_evidence,
      created_at: new Date()
    };
    this.evidence.set(id, newEvidence);
    this.saveData();
    return newEvidence;
  }
}

export const db = new DatabaseClient();
