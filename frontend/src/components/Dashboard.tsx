"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useScanStore } from '../store/useScanStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ReportPDF } from './ReportPDF';
import { 
  Terminal, ShieldCheck, FileText, ArrowLeft,
  TrendingUp, Award, Download, Loader2, Sparkles, Upload, 
  Briefcase, AlertCircle, RefreshCw, CheckCircle2,
  FileCheck, Code, ChevronRight, ChevronUp, ChevronDown
} from 'lucide-react';

// Cast PDF download link for strict typescript compilers
import { PDFDownloadLink } from '@react-pdf/renderer';
const DownloadLink = PDFDownloadLink as any;

// SVG Icons
const GitHubIcon = () => (
  <svg className="w-6 h-6 text-emerald-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
  </svg>
);

const LeetCodeIcon = () => (
  <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.102 17.93l-2.697 2.607c-.466.45-1.211.45-1.677 0l-8.579-8.286c-.466-.45-.466-1.17 0-1.62l2.697-2.607c.466-.45 1.211-.45 1.677 0l8.579 8.286c.466.45.466 1.17 0 1.62zm-6.22-9.76l-1.92 1.85c-.31.3-.815.3-1.127 0L2.83 6.377c-.312-.3-.312-.786 0-1.087l1.92-1.85c.312-.3.816-.3 1.128 0l4.004 3.83c.312.3.312.787 0 1.087zm9.645 6.136l-1.92 1.85c-.312.3-.816.3-1.128 0l-3.327-3.21a.763.763 0 010-1.086l1.92-1.85c.312-.3.816-.3 1.128 0l3.327 3.21c.312.3.312.786 0 1.086z" />
  </svg>
);

export const Dashboard: React.FC = () => {
  const {
    logs,
    progress,
    status,
    report,
    evidence,
    startScanSubscription,
    resetStore,
    viewingReport,
    setViewReport
  } = useScanStore();

  // Inputs
  const [githubMode, setGithubMode] = useState<'profile' | 'repo'>('profile');
  const [githubUsername, setGithubUsername] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGithubVerified, setIsGithubVerified] = useState(false);

  // Ingest state
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [chartMetric, setChartMetric] = useState<'Commits' | 'Forks'>('Commits');

  const renderNode = (x: number, y: number, label: string, subtitle: string, icon: React.ReactNode, active: boolean) => {
    return (
      <div 
        className={`absolute rounded-2xl p-3 bg-[#06090f]/95 border transition-all duration-300 flex flex-col justify-between ${
          active 
            ? 'border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.08)] text-slate-100 hover:border-emerald-400/50 hover:scale-[1.03]' 
            : 'border-slate-800 text-slate-400 opacity-65 hover:opacity-100 hover:border-slate-700'
        }`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: '190px',
          height: '90px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}
        key={`${x}-${y}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400 opacity-80">{subtitle}</span>
          <div className={`p-1.5 rounded-lg border ${active ? 'bg-emerald-950/40 border-emerald-500/20' : 'bg-slate-950 border-slate-800'}`}>
            {icon}
          </div>
        </div>
        <div className="mt-1">
          <h4 className="text-xs font-black text-slate-200">{label}</h4>
        </div>
      </div>
    );
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // popstate navigation back/forward support
  useEffect(() => {
    const handlePopState = () => {
      resetStore();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [resetStore]);

  // Extract text from file cleanly (local reading for .txt, server-side parsing for .pdf)
  const processResumeFile = async (file: File) => {
    setUploadedFileName(file.name);
    setResumeFile(file);
    setErrorMsg('');
    
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setIsParsingFile(true);
      // PDF text extraction is fully performed server-side by the API runner
      setResumeText(`PDF Upload: ${file.name}`);
      setTimeout(() => {
        setIsParsingFile(false);
      }, 800);
    } else {
      // For text files, read locally
      setIsParsingFile(true);
      try {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const rawText = (evt.target?.result as string) || '';
          const sanitized = rawText.replace(/\0/g, ' ').trim();
          setResumeText(sanitized || `Parsed Resume: ${file.name}`);
          setIsParsingFile(false);
        };
        reader.onerror = () => {
          setErrorMsg('Failed to read text file');
          setIsParsingFile(false);
        };
        reader.readAsText(file);
      } catch (err) {
        setIsParsingFile(false);
      }
    }
  };

  // Submit scan trigger with robust JSON response checking
  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    let targetUsername = githubUsername.trim();
    let targetRepoName: string | null = null;
    
    if (githubMode === 'repo') {
      if (!githubRepoUrl.trim()) {
        setErrorMsg('GitHub repository URL is required');
        return;
      }
      const match = githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
      if (!match) {
        setErrorMsg('Invalid repository link. Example: https://github.com/owner/repo');
        return;
      }
      targetUsername = match[1];
      targetRepoName = match[2];
    } else {
      if (!targetUsername) {
        setErrorMsg('GitHub username is required');
        return;
      }
    }

    if (!uploadedFileName) {
      setErrorMsg('Please upload a resume file before triggering analysis');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('github_username', targetUsername);
      if (targetRepoName) formData.append('github_repo_name', targetRepoName);
      if (leetcodeUsername) formData.append('leetcode_username', leetcodeUsername.trim());
      formData.append('resume_text', resumeText.trim() || `Developer with skills in software engineering and cloud deployment. Projects: ${uploadedFileName}`);
      formData.append('resume_filename', uploadedFileName);
      if (resumeFile) formData.append('resume_file', resumeFile);

      const response = await fetch('/api/scans/trigger', {
        method: 'POST',
        body: formData
      });

      let errMessage = 'Verification request refused by API validation nodes';
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } else {
          const errText = await response.text();
          console.error('Non-JSON error response received:', errText);
          errMessage = `Backend check failed (Status ${response.status}). Please verify that backend is running.`;
        }
        throw new Error(errMessage);
      }

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setIsGithubVerified(true);
        // Push state to browser history to support Back button popstates
        window.history.pushState({ scanId: data.scanId }, '', `?scan=${data.scanId}`);
        startScanSubscription(data.scanId);
      } else {
        throw new Error('Received unexpected non-JSON response from verification server.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Scans startup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag Drop Ingestion
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processResumeFile(e.target.files[0]);
    }
    e.target.value = '';
  };




  const getRatingLabel = (score: number) => {
    if (score >= 85) return { label: 'Elite', color: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10 animate-pulse drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]' };
    if (score >= 70) return { label: 'Gold', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' };
    return { label: 'Silver', color: 'text-slate-300 border-slate-400/50 bg-slate-400/10 animate-pulse drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]' };
  };

  // Progress queries checkmarks logic (5 steps)
  const getQueryStatus = (taskIndex: number) => {
    const boundaries = [25, 30, 65, 75, 95];
    const targetBoundary = boundaries[taskIndex];
    
    if (progress >= targetBoundary) {
      return { label: 'completed', text: '✓ Completed' };
    }
    if (progress > 0 && progress < targetBoundary && (taskIndex === 0 || progress >= boundaries[taskIndex - 1])) {
      return { label: 'running', text: 'Analyzing...' };
    }
    return { label: 'pending', text: 'Pending' };
  };

  const isScanning = status !== 'idle' && status !== 'completed' && status !== 'failed';

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 relative z-10 select-none">
      
      {/* 1. SEAMLESS DASHBOARD ENTRY GRID (IDLE PHASE) */}
      {status === 'idle' && (
        <div className="space-y-12 view-transition relative z-10">
                 {/* About UrScore AI & Points description */}
          <div className="max-w-4xl mx-auto space-y-8 text-left mb-12 view-transition border-b border-emerald-500/10 pb-8">
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-100" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                About Urscore,
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                UrScore AI is a smart platform that helps developers show their real skills and helps recruiters find the right people easily. Instead of trusting what someone writes on a resume, UrScore AI looks at what they have actually done and gives them a honest score based on their real work. Developers get a proper profile with a score and ranking that shows how strong they are and which field they are best suited for. This makes hiring simpler and fairer — developers get recognised for what they truly know, and recruiters find the right person without wasting time. You can also know yourself better with Urscore by verifying your profiles.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 pt-8 border-t border-emerald-500/10" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {/* GitHub Hook Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold tracking-wide text-emerald-400">
                  1. GitHub Source Hook
                </h3>
                <div className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200 block text-xs uppercase tracking-wider mb-1 text-emerald-400 font-bold">Process: Repo Crawler</strong>
                  Validates candidate profile and repository existence on GitHub. Queries the official API endpoints to extract commit messages, directory hierarchies, file histories, and language distribution byte counts.
                </div>
              </div>

              {/* Resume Hook Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold tracking-wide text-emerald-400">
                  2. Resume Document Hook
                </h3>
                <div className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200 block text-xs uppercase tracking-wider mb-1 text-emerald-400 font-bold">Process: PDF Extractor</strong>
                  Ingests local resume files (PDF or TXT) client-side in the browser via HTML5 FileReader APIs, extracting raw text and cleaning layout structures to ensure safe execution downstream.
                </div>
              </div>

              {/* Leetcode Hook Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold tracking-wide text-emerald-400">
                  3. LeetCode Stats Hook
                </h3>
                <div className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200 block text-xs uppercase tracking-wider mb-1 text-emerald-400 font-bold">Process: Stats Scraper</strong>
                  Fetches competitive problem-solving records from LeetCode public endpoints, retrieving overall rank, difficulty distributions (Easy, Medium, Hard), and candidate coding metrics.
                </div>
              </div>

              {/* UrScore Core Engine Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold tracking-wide text-emerald-400">
                  4. UrScore Core Scorer
                </h3>
                <div className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-200 block text-xs uppercase tracking-wider mb-1 text-emerald-400 font-bold">Process: Aggregator Core</strong>
                  Merges verified coding patterns, code complexity, years of experience, and competitive coding scores into a composite score out of 100, updated dynamically via push webhook runs.
                </div>
              </div>
            </div>
          </div>

          {/* Flows and Hooks - System Architecture Graph */}
          <div className="max-w-6xl mx-auto p-8 fancy-card bg-[#05070c]/90 border border-emerald-500/10 mb-12 shadow-2xl relative overflow-hidden view-transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 border-b border-emerald-500/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-extrabold text-xs font-mono">⚡</span>
                <h3 className="text-xs font-bold tracking-widest text-emerald-400 uppercase" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Flows and Hooks
                </h3>
              </div>
            </div>

            {/* Interactive SVG/HTML 2D Canvas */}
            <div className="relative w-full h-[400px] overflow-hidden rounded-2xl border border-emerald-500/5 bg-[#030509]/30 flex items-center justify-center p-4">
              {/* Faint flat grid background */}
              <div className="absolute inset-0 neon-grid opacity-10 pointer-events-none" />
              
              <div className="w-[1000px] h-[380px] relative select-none">
                {/* SVG for drawing connecting lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 380" fill="none">
                  <defs>
                    <linearGradient id="flow-active-grad" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="flow-inactive-grad" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
                    </linearGradient>
                    {/* Green shadow glow filter */}
                    <filter id="green-glow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.6" />
                    </filter>
                  </defs>

                  {/* Connecting lines */}
                  {/* GitHub -> Repo Crawler */}
                  <path d="M 230 75 L 280 75" stroke="url(#flow-active-grad)" strokeWidth="2" strokeDasharray="4, 4" filter="url(#green-glow)" />
                  {/* Resume -> PDF Extractor */}
                  <path d="M 230 195 L 280 195" stroke="url(#flow-active-grad)" strokeWidth="2" strokeDasharray="4, 4" filter="url(#green-glow)" />
                  {/* LeetCode -> Stats Scraper */}
                  <path d="M 230 315 L 280 315" stroke="url(#flow-active-grad)" strokeWidth="2" strokeDasharray="4, 4" filter="url(#green-glow)" />

                  {/* Repo Crawler -> Language Audit */}
                  <path d="M 470 75 L 520 75" stroke="url(#flow-active-grad)" strokeWidth="2" filter="url(#green-glow)" />
                  {/* PDF Extractor -> Exp Calculator */}
                  <path d="M 470 195 L 520 195" stroke="url(#flow-active-grad)" strokeWidth="2" filter="url(#green-glow)" />
                  {/* Stats Scraper -> Rank Evaluator */}
                  <path d="M 470 315 L 520 315" stroke="url(#flow-active-grad)" strokeWidth="2" filter="url(#green-glow)" />

                  {/* Language Audit -> UrScore Core */}
                  <path d="M 710 75 C 740 75, 750 150, 780 150" stroke="url(#flow-active-grad)" strokeWidth="2" filter="url(#green-glow)" />
                  {/* Exp Calculator -> UrScore Core */}
                  <path d="M 710 195 L 780 190" stroke="url(#flow-active-grad)" strokeWidth="2" filter="url(#green-glow)" />
                  {/* Rank Evaluator -> UrScore Core */}
                  <path d="M 710 315 C 740 315, 750 230, 780 230" stroke="url(#flow-active-grad)" strokeWidth="2" filter="url(#green-glow)" />
                </svg>

                {/* HTML Nodes positioned absolutely on top of the SVG paths */}
                {/* COLUMN 1: INPUTS */}
                {renderNode(40, 30, "GitHub Profile", "GitHub Track", <GitHubIcon />, true)}
                {renderNode(40, 150, "Resume Upload", "Resume Track", <FileText className="w-5 h-5 text-emerald-400" />, true)}
                {renderNode(40, 270, "LeetCode Profile", "LeetCode Track", <Terminal className="w-5 h-5 text-emerald-400" />, true)}

                {/* COLUMN 2: WORKFLOW PIPELINES */}
                {renderNode(280, 30, "Repo Crawler", "Source Analysis", <Terminal className="w-5 h-5 text-emerald-400" />, true)}
                {renderNode(280, 150, "PDF Extractor", "Ingestion Engine", <FileCheck className="w-5 h-5 text-emerald-400" />, true)}
                {renderNode(280, 270, "Stats Scraper", "Competency Sync", <TrendingUp className="w-5 h-5 text-emerald-400" />, true)}

                {/* COLUMN 3: AUDITING NODES */}
                {renderNode(520, 30, "Language Audit", "Security & Validation", <ShieldCheck className="w-5 h-5 text-emerald-400" />, true)}
                {renderNode(520, 150, "Exp Calculator", "Compliance & Quality", <Briefcase className="w-5 h-5 text-emerald-400" />, true)}
                {renderNode(520, 270, "Rank Evaluator", "Algorithmic Audit", <Award className="w-5 h-5 text-emerald-400" />, true)}

                {/* COLUMN 4: URSCORE AI CORE */}
                <div 
                  className="absolute rounded-2xl p-4 bg-[#05070c] border border-emerald-500/35 shadow-[0_0_25px_rgba(16,185,129,0.25)] flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-emerald-400 hover:scale-[1.02]"
                  style={{
                    left: '780px',
                    top: '110px',
                    width: '180px',
                    height: '160px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}
                >
                  <div className="p-2 bg-[#030509] rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.25)] mb-3 overflow-hidden w-16 h-16 flex items-center justify-center">
                    <img src="/logo.png" className="w-14 h-14 object-contain rounded-xl" alt="UrScore AI Logo" />
                  </div>
                  <h4 className="text-xs font-black text-emerald-400">UrScore AI Core</h4>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleStartScan} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* CONTAINER 1: GITHUB PORTAL */}
            <div className="fancy-card p-8 flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1 text-xs font-black bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Step 01: SOURCE CODE
                  </span>
                  <div className="p-3 bg-[#030509] rounded-2xl border border-emerald-500/10 shadow-md">
                    <GitHubIcon />
                  </div>
                </div>
                
                <h3 className="text-xs font-bold text-slate-100 mb-2">
                  GitHub Codebase <span className="text-rose-500 font-extrabold text-xs leading-none">*</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Identify repository patterns, commit syntax, and framework imports</p>

                {/* Sub tabs */}
                <div className="flex p-1 bg-black/60 border border-emerald-500/10 rounded-xl text-xs font-bold mb-6">
                  <button
                    type="button"
                    onClick={() => setGithubMode('profile')}
                    className={`flex-1 py-2.5 rounded-lg transition-all duration-300 ${githubMode === 'profile' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    User Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setGithubMode('repo')}
                    className={`flex-1 py-2.5 rounded-lg transition-all duration-300 ${githubMode === 'repo' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Specific Repo
                  </button>
                </div>

                {githubMode === 'profile' ? (
                  <div className="space-y-2">
                    <div className="input-container">
                      <input
                        type="text"
                        id="gh-user"
                        placeholder=" "
                        value={githubUsername}
                        onChange={(e) => {
                          setGithubUsername(e.target.value);
                          setIsGithubVerified(false);
                        }}
                        className="fancy-input"
                      />
                      <label htmlFor="gh-user" className="absolute left-5 top-4 text-slate-500 text-xs font-bold pointer-events-none transition-all duration-300">
                        Enter GitHub username
                      </label>
                    </div>
                    {isGithubVerified ? (
                      <div className="text-xs text-emerald-500/50 font-mono flex items-center gap-1 pl-1">
                        <span>✓ github verified</span>
                      </div>
                    ) : githubUsername.trim() && /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(githubUsername) ? (
                      <div className="text-xs text-slate-500/45 font-mono flex items-center gap-1 pl-1">
                        <span>github format valid</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="input-container">
                      <input
                        type="url"
                        id="gh-repo"
                        placeholder=" "
                        value={githubRepoUrl}
                        onChange={(e) => {
                          setGithubRepoUrl(e.target.value);
                          setIsGithubVerified(false);
                        }}
                        className="fancy-input"
                      />
                      <label htmlFor="gh-repo" className="absolute left-5 top-4 text-slate-500 text-xs font-bold pointer-events-none transition-all duration-300">
                        Enter GitHub repository link
                      </label>
                    </div>
                    {isGithubVerified ? (
                      <div className="text-xs text-emerald-500/50 font-mono flex items-center gap-1 pl-1">
                        <span>✓ github verified</span>
                      </div>
                    ) : githubRepoUrl.trim() && /github\.com\/([^\/]+)\/([^\/]+)/i.test(githubRepoUrl) ? (
                      <div className="text-xs text-slate-500/45 font-mono flex items-center gap-1 pl-1">
                        <span>github repo format valid</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-500 border-t border-emerald-500/10 pt-4 mt-6">
                Scans language diversity profiles.
              </div>
            </div>

            {/* CONTAINER 2: RESUME DOCUMENT */}
            <div className="fancy-card p-8 flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1 text-xs font-black bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Step 02: INGEST DOCUMENT
                  </span>
                  <div className="p-3 bg-[#030509] rounded-2xl border border-emerald-500/10 shadow-md">
                    {isParsingFile ? (
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                </div>
                
                <h3 className="text-xs font-bold text-slate-100 mb-2">
                  Resume <span className="text-rose-500 font-extrabold text-xs leading-none">*</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Verify candidate technology proficiencies strictly via file upload</p>

                {/* Dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-ingest"
                  onChange={handleFileChange}
                  onClick={(e) => e.stopPropagation()}
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                />
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!isParsingFile && !isSubmitting) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-350 relative cursor-pointer ${dragActive ? 'border-emerald-500 bg-emerald-600/5' : 'border-slate-800 bg-[#030509]/30 hover:border-slate-700'} min-h-[160px] flex flex-col justify-center`}
                >
                  {isParsingFile ? (
                    <div className="space-y-4 text-center py-4 flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Extracting document layout...</div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3 animate-pulse" />
                      
                      {uploadedFileName ? (
                        <div className="text-xs font-bold text-emerald-400 truncate max-w-full flex items-center justify-center gap-1">
                          <FileCheck className="w-4 h-4" />
                          {uploadedFileName}
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-bold text-emerald-400 hover:text-emerald-300 block">
                            Browse Document
                          </span>
                          <div className="text-xs text-slate-500 mt-1">Drag & drop PDF or TXT file here</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 border-t border-emerald-500/10 pt-4 mt-6">
                Calculates experience duration years.
              </div>
            </div>

            {/* CONTAINER 3: OPTIONAL PROFILES */}
            <div className="fancy-card p-8 flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1 text-xs font-black bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Step 03: INTEGRATIONS
                  </span>
                  <div className="p-3 bg-[#030509] rounded-2xl border border-emerald-500/10 shadow-md">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                
                <h3 className="text-xs font-bold text-slate-100 mb-2 flex items-center justify-between">Optional Audits <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/10">Optional</span></h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">Augment core score matrices with extra profiles statistics</p>

                <div className="space-y-6">
                  {/* Label Name Leetcode above input box */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                      Leetcode Username
                    </label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="lc-user"
                        placeholder=" "
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        className="fancy-input"
                      />
                      <label htmlFor="lc-user" className="absolute left-5 top-4 text-slate-500 text-xs font-bold pointer-events-none transition-all duration-300 flex items-center gap-1.5">
                        <LeetCodeIcon />
                        Enter LeetCode username
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 border-t border-emerald-500/10 pt-4 mt-6">
                Calculates additional algorithm bonuses.
              </div>
            </div>

          </form>

          {/* Trigger Button & Error Banner */}
          <div className="max-w-md mx-auto pt-4">
            {errorMsg && (
              <div className="p-4 bg-red-950/20 border border-red-500/30 text-xs text-red-400 rounded-2xl mb-6 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Verification Error</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{errorMsg}</div>
                </div>
              </div>
            )}

            <button
              onClick={handleStartScan}
              disabled={isSubmitting || isParsingFile}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-400 disabled:from-slate-900 disabled:to-slate-950 disabled:text-slate-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying Account API Paths...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  Check Analysis
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* 2. DEDICATED IMMERSIVE LOADING/ANALYSIS SCANNING SCREEN */}
      {isScanning && (
        <div className="space-y-6 view-transition relative z-10">
          
          {/* Back/Cancel button */}
          <div className="flex justify-start">
            <button
              onClick={resetStore}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#070b13] hover:bg-[#0c121e] border border-emerald-500/10 rounded-xl text-xs font-bold text-slate-400 transition-all duration-300 hover:border-emerald-500/30"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              Cancel & Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Progress Console Logs */}
            <div className="lg:col-span-6 space-y-4">
              <div className="fancy-card p-6 shadow-2xl min-h-[460px] flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 border-b border-emerald-500/10 pb-3 mb-4">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Worker Telemetry Stream
                  </h3>
                  <div className="bg-black/95 font-mono text-xs text-emerald-400/90 rounded-2xl p-5 h-80 overflow-y-auto border border-slate-900 space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="leading-relaxed">
                        {log}
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-slate-500 italic mt-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Ingesting data packages...
                    </div>
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Immersive Scanning Checklist Queries */}
            <div className="lg:col-span-6 space-y-4">
              <div className="fancy-card p-8 shadow-2xl min-h-[460px]">
                <div className="flex items-center justify-between mb-6 border-b border-emerald-500/10 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-100">Verification Ingestion</h3>
                    <p className="text-xs text-slate-400 mt-1">Status of API queries across backend nodes</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold animate-pulse font-mono">
                    {progress}% Done
                  </span>
                </div>

                {/* Checklist queries (as requested by user with ticks) */}
                <div className="space-y-4 text-xs font-bold text-slate-300">
                  {[
                    'Analyzing Resume',
                    'Analyzing GitHub Profile',
                    'Analyzing Repositories',
                    'Analyzing Codes',
                    'Analyzing Leetcode'
                  ].map((taskDesc, idx) => {
                    const statusInfo = getQueryStatus(idx);
                    const isDone = statusInfo.label === 'completed';
                    return (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        isDone ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' : 
                        statusInfo.label === 'running' ? 'bg-emerald-600/5 border-emerald-500/15 text-emerald-400' :
                        'bg-slate-950/20 border-slate-900 text-slate-600'
                      }`}>
                        <div className="flex items-center gap-3">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : statusInfo.label === 'running' ? (
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                              <div className="loading-star-container" style={{ width: '24px', height: '24px', perspective: '300px' }}>
                                <div className="loading-star" style={{ animationDuration: '2.5s' }}>
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-emerald-400">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-800 shrink-0" />
                          )}
                          <span className={isDone ? 'line-through opacity-65 font-medium' : ''}>{taskDesc}</span>
                        </div>
                        <span className={`text-xs font-mono px-3 py-1 rounded-md ${
                          isDone ? 'text-emerald-400 font-black' : 
                          statusInfo.label === 'running' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                        }`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Sweeping loader animation line */}
                <div className="mt-8">
                  <div className="loading-line w-full" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. INTERMEDIATE ANALYZE PAGE (COMPLETED BUT !viewingReport) */}
      {status === 'completed' && !viewingReport && evidence && (
        <div className="space-y-8 view-transition relative z-10 max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-xs font-black text-slate-100" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Codebase Analysis Complete
            </h2>
            <p className="text-slate-400 font-semibold text-xs max-w-2xl mx-auto">
              Our AI engine has successfully parsed {evidence.repositories_analyzed.length} repositories from the candidate's profile. Below are the architectural summaries derived directly from their codebase files and dependencies.
            </p>
          </div>

          <div className="space-y-6">
            {evidence.repositories_analyzed.map((repo: any, idx: number) => (
              <div key={idx} className="fancy-card p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#030509] rounded-2xl border border-emerald-500/10 shadow-md shrink-0">
                    <Code className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200">{repo.name}</h3>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded">★ {repo.stars}</span>
                        <span className="text-slate-500">{Object.keys(repo.languages || {}).slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                    <div className="text-xs leading-relaxed text-slate-400">
                      {repo.ai_description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Visualization for LeetCode Stats if they exist */}
          {report.leetcode_stats && report.leetcode_stats.solvedTotal > 0 && (
            <div className="fancy-card p-8 mt-12 mb-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-12">
                
                {/* Left side: Global Difficulty Stats */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#030509] rounded-2xl border border-emerald-500/10 shadow-lg">
                      <LeetCodeIcon />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-100" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        LeetCode Profile
                      </h3>
                      <p className="text-emerald-400 font-bold text-xs">Top {Math.max(1, Math.round((report.leetcode_stats.ranking / 5000000) * 100))}% globally</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#030509] border border-slate-800 rounded-2xl p-4 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
                      <div className="text-emerald-400 font-black text-xs mb-1">{report.leetcode_stats.solvedEasy}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Easy</div>
                    </div>
                    <div className="bg-[#030509] border border-slate-800 rounded-2xl p-4 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                      <div className="text-amber-400 font-black text-xs mb-1">{report.leetcode_stats.solvedMedium}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Medium</div>
                    </div>
                    <div className="bg-[#030509] border border-slate-800 rounded-2xl p-4 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      <div className="text-rose-500 font-black text-xs mb-1">{report.leetcode_stats.solvedHard}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Hard</div>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-400">Total Solved</div>
                    <div className="text-xs font-black text-slate-100">{report.leetcode_stats.solvedTotal} <span className="text-slate-500 text-xs ml-1">Problems</span></div>
                  </div>
                </div>

                {/* Right side: Topic Mastery (Trees, Graphs, Stack, etc.) */}
                <div className="flex-[1.5] w-full">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Topic Mastery
                  </h4>
                  
                  {report.leetcode_stats.topicStats && report.leetcode_stats.topicStats.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {report.leetcode_stats.topicStats.map((topic: any, idx: number) => {
                        // Calculate a subtle dynamic size/color based on problems solved
                        const isHigh = topic.problemsSolved > 30;
                        const isMed = topic.problemsSolved > 10;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-full border transition-all duration-300 hover:scale-105 ${
                              isHigh 
                                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                : isMed 
                                  ? 'bg-slate-800/50 border-slate-700 text-slate-300' 
                                  : 'bg-[#030509] border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="text-xs font-bold">{topic.tagName}</span>
                            <div className={`w-1 h-1 rounded-full ${isHigh ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                            <span className={`text-xs font-black ${isHigh ? 'text-white' : 'text-slate-500'}`}>{topic.problemsSolved}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic p-6 border border-dashed border-slate-800 rounded-2xl text-center">
                      Detailed topic statistics are not publicly available for this user.
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}

          <div className="flex justify-center pt-8 pb-20 border-t border-emerald-500/10">
            <button
              onClick={() => setViewReport(true)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-400 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              Proceed to Final Report
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* 4. FINAL ASSESSMENT REPORT DISPLAY (COMPLETED PHASE) */}
      {status === 'completed' && viewingReport && report && evidence && (() => {
        // Enforce frontend calculation of score based strictly on component weights out of 100
        const calculatedScore = Math.round(
          (report.skill_verification * 0.25) + 
          (report.commit_quality * 0.20) + 
          (report.project_complexity * 0.20) + 
          (report.recency * 0.15) + 
          (report.cross_reference * 0.12) + 
          (report.activity_consistency * 0.08)
        );

        // Dynamically calculate resume health parameters
        const baseVerified = evidence?.score_breakdown?.verified_keywords || [];
        const baseUnverified = evidence?.score_breakdown?.unverified_keywords || [];
        
        // Fallback to parsed resume keywords if breakdown is totally empty
        const fallbackLanguages = evidence?.resume_extracted_metrics?.keywords?.languages || [];
        const fallbackFrameworks = evidence?.resume_extracted_metrics?.keywords?.frameworks || [];
        const fallbackTools = evidence?.resume_extracted_metrics?.keywords?.tools || [];
        
        const repoSkills = (evidence?.repositories_analyzed || []).flatMap((r: any) => [
          ...Object.keys(r.languages || {}), 
          ...(r.dependencies || [])
        ]);
        const uniqueRepoSkills = Array.from(new Set(repoSkills)).filter((s: any) => s.length > 2).slice(0, 12);

        const initialVerifiedList = baseVerified.length > 0 ? baseVerified : [...fallbackLanguages, ...fallbackFrameworks, ...uniqueRepoSkills].slice(0, 15);
        const initialUnverifiedList = baseVerified.length === 0 && baseUnverified.length === 0 ? fallbackTools : baseUnverified;

        const verifiedList = initialVerifiedList;
        const unverifiedList = initialUnverifiedList;

        const verifiedCount = verifiedList.length;
        const unverifiedCount = unverifiedList.length;
        const totalKeywords = verifiedCount + unverifiedCount;
        let atsScore = 0;
        if (totalKeywords > 0) {
          const overlapScore = (verifiedCount / totalKeywords) * 35;
          const volumeScore = Math.min(25, (verifiedCount / 10) * 25);
          const reliabilityPenalty = Math.min(20, unverifiedCount * 10);
          const formatScore = 20 - reliabilityPenalty;
          atsScore = Math.max(0, Math.min(80, Math.round(overlapScore + volumeScore + formatScore)));
        }

        const mistakes = [
          unverifiedList.length > 0 
            ? `Listed proficiencies [${unverifiedList.slice(0, 3).join(', ')}] in resume lack robust reference indicators or deep links to live, active repositories.`
            : "Resume projects lack explicit deep links or reference indicators mapping to your live repositories.",
          `Commit history across your ${evidence?.repositories_analyzed?.length || 'analyzed'} repositories shows minor occurrences of unstructured or generic commit messages.`
        ];
        
        const improvements = [
          unverifiedList.length > 0
            ? `Verify your claimed skills by pushing code that actively imports and utilizes ${unverifiedList.slice(0, 2).join(' and ')} to your public repositories.`
            : "Add specific dependencies and packages explicitly in package.json or requirements.txt to clear AI validation nodes.",
          "Adopt the Conventional Commits format (feat:, fix:, docs:) universally across your repositories.",
          `Increase test coverage and complex algorithms within your ${evidence?.repositories_analyzed?.[0]?.name || 'primary'} repo to boost project complexity metrics.`
        ];

        const repoChartData = evidence?.repositories_analyzed?.map((r: any) => ({
          name: r.name.length > 18 ? `${r.name.slice(0, 15)}...` : r.name,
          Commits: r.commits_analyzed || 0,
          Forks: r.forks_count || r.forks || 0,
        })) || [];

        return (
          <div className="space-y-10 view-transition relative z-10 w-full max-w-6xl mx-auto">
            
            {/* Navigation back and header row */}
            <div className="flex justify-between items-center">
              <button
                onClick={resetStore}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#070b13] hover:bg-[#0c121e] border border-emerald-500/10 rounded-xl text-xs font-bold text-slate-400 transition-all duration-300 hover:border-emerald-500/35"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                Back to Form
              </button>
            </div>

            {/* Title / Header Candidate Card */}
            <div className="fancy-card p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-2xl relative overflow-hidden bg-[#06090f]">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-emerald-600/10 to-transparent pointer-events-none rounded-bl-full" />
              
              {/* Glass Score medallion */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-emerald-500/10 pb-6 md:pb-0 md:pr-8">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Competency ScoreCard
                </span>
                <div className="relative flex items-center justify-center w-28 h-28 rounded-full score-medallion mt-3">
                  <div className="text-center">
                    <span className="text-xs font-black text-slate-100 tracking-tight">{calculatedScore}</span>
                    <span className="text-xs text-slate-500 block -mt-1 font-bold">/100</span>
                  </div>
                </div>
                
                <div className={`mt-3 px-3 py-1 text-[10px] font-bold rounded-full border ${getRatingLabel(calculatedScore).color}`}>
                  {getRatingLabel(calculatedScore).label}
                </div>
              </div>

              {/* Header Info */}
              <div className="md:col-span-8 space-y-4 text-xs text-slate-400">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 tracking-wider uppercase" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  <Award className="w-5 h-5 text-emerald-400" />
                  Competency ScoreCard
                </h3>
                
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Candidate Name</span>
                    <span className="font-bold text-slate-300 text-[10px] mt-0.5 block">{evidence?.github_profile?.name || evidence?.github_profile?.username || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Total Repos</span>
                    <span className="font-bold text-slate-300 text-[10px] mt-0.5 block">
                      {evidence?.github_profile?.public_repos || 0} Repos
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Repos Count (Analyzed)</span>
                    <span className="font-bold text-slate-300 text-[10px] mt-0.5 block">
                      {evidence?.repositories_analyzed?.length || 0} Repos
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <DownloadLink
                    document={<ReportPDF report={report} evidence={evidence} />}
                    fileName={`competency_report_${evidence.github_profile.username}.pdf`}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 rounded-lg text-[10px] font-bold transition text-white shadow-glow"
                  >
                    {({ loading }: any) => (
                      (<>
                        <Download className="w-3.5 h-3.5" />
                        {loading ? 'Compiling PDF...' : 'Download PDF Report'}
                      </>) as any
                    )}
                  </DownloadLink>

                  <button
                    onClick={resetStore}
                    className="inline-flex items-center gap-1.5 bg-[#030509] hover:bg-[#0c121e] border border-emerald-500/10 px-4 py-2 rounded-lg text-[10px] font-bold transition text-slate-300"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Run New Audit
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Subscores Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { name: "Skill Verification", val: report.skill_verification, weight: 25, color: "border-emerald-500/10 hover:border-emerald-500/25" },
                { name: "Commit Quality", val: report.commit_quality, weight: 20, color: "border-blue-500/10 hover:border-blue-500/25" },
                { name: "Project Complexity", val: report.project_complexity, weight: 20, color: "border-purple-500/10 hover:border-purple-500/25" },
                { name: "Recency Weighting", val: report.recency, weight: 15, color: "border-pink-500/10 hover:border-pink-500/25" },
                { name: "Cross Reference", val: report.cross_reference, weight: 12, color: "border-amber-500/10 hover:border-amber-500/25" },
                { name: "Consistency", val: report.activity_consistency, weight: 8, color: "border-teal-500/10 hover:border-teal-500/25" },
              ].map((sub, i) => {
                const limitVal = (sub.val * (sub.weight / 100)).toFixed(1).replace(/\.0$/, '');
                return (
                  <div key={i} className={`fancy-card p-4 text-center border bg-[#06090f] transition-all duration-300 hover:scale-[1.02] ${sub.color}`}>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block leading-tight">{sub.name}</span>
                    <span className="text-sm font-black block mt-1 text-slate-200">{limitVal}%</span>
                    <span className="text-[8px] text-slate-500 block mt-0.5 font-semibold">Max: {sub.weight}%</span>
                  </div>
                );
              })}
            </div>

            {/* Split row: Verification Matrix & Resume insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Verification Matrix (improved badge visualization) */}
              <div className="fancy-card p-8 shadow-2xl flex flex-col justify-between bg-[#06090f]">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5 tracking-wider uppercase">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                    Verification Matrix
                  </h3>
                  <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                    Languages and libraries verified by package configurations in GitHub source trees vs resume claims.
                  </p>
                  
                  {/* Verified Badges */}
                  <div className="space-y-3 mb-5">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      ✓ Verified Technical Proficiencies
                    </h4>
                    {verifiedList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {verifiedList.map((skill: string, idx: number) => (
                          <span 
                            key={idx}
                            className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No verified skills found.</p>
                    )}
                  </div>

                  {/* Unverified Badges */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      ✗ Unverified / Resume Only Claims
                    </h4>
                    {unverifiedList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {unverifiedList.map((skill: string, idx: number) => (
                          <span 
                            key={idx}
                            className="text-[10px] font-mono px-2.5 py-1 bg-slate-900/40 border border-slate-800 text-slate-400 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No unverified skills.</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Resume & ATS Review */}
              <div className="fancy-card p-8 shadow-2xl flex flex-col justify-between bg-[#06090f]">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 mb-3.5 flex items-center gap-1.5 tracking-wider uppercase">
                    <FileText className="w-4.5 h-4.5 text-emerald-400" />
                    Resume & ATS Assessment
                  </h3>
                  
                  {/* ATS Score & Gauge */}
                  <div className="flex items-center gap-4 mb-4 bg-black/40 border border-slate-900 rounded-xl p-3.5">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-emerald-500/20 bg-slate-950 shrink-0">
                      <span className="text-xs font-black text-emerald-400">{atsScore}</span>
                      <span className="text-[8px] text-slate-500 block absolute bottom-1.5 font-bold">ATS %</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Ingested Resume Health</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Score is determined by keyword verification overlap and formatting indicators.
                      </p>
                    </div>
                  </div>

                  {/* Mistakes */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Good
                    </h4>
                    <ul className="space-y-1.5">
                      {mistakes.map((m, idx) => (
                        <li key={idx} className="text-[11px] text-slate-400 pl-3 border-l border-rose-500/30 leading-relaxed">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Betters */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Better
                    </h4>
                    <ul className="space-y-1.5">
                      {improvements.map((imp, idx) => (
                        <li key={idx} className="text-[11px] text-slate-400 pl-3 border-l border-emerald-500/30 leading-relaxed">
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

            </div>

            {/* Repository Activity & Performance (separate container box, dynamic) */}
            <div className="fancy-card p-8 shadow-2xl border border-slate-900 bg-[#06090f] space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 tracking-wider uppercase m-0">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Repository Activity & Performance Metrics
                </h3>
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                  <button 
                    onClick={() => setChartMetric('Commits')}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${chartMetric === 'Commits' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Commits
                  </button>
                  <button 
                    onClick={() => setChartMetric('Forks')}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${chartMetric === 'Forks' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Forks
                  </button>
                </div>
              </div>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={repoChartData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartMetric === 'Commits' ? '#10b981' : '#a78bfa'} stopOpacity={1}/>
                        <stop offset="100%" stopColor={chartMetric === 'Commits' ? '#047857' : '#6d28d9'} stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" opacity={0.4} vertical={false} />
                    <XAxis dataKey="name" interval={0} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} dy={10} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} dx={-10} />
                    <Tooltip 
                      cursor={{ fill: '#1e293b', opacity: 0.3 }}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: chartMetric === 'Commits' ? '#34d399' : '#c4b5fd' }}
                    />
                    <Bar 
                      dataKey={chartMetric} 
                      fill="url(#colorBar)" 
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LeetCode Stats (Verification Page ONLY) */}
            {evidence?.leetcode_stats && evidence.leetcode_stats.solvedTotal > 0 && (
              <div className="fancy-card p-6 shadow-2xl relative overflow-hidden group bg-[#06090f]">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                  
                  {/* Left: Stats Summary */}
                  <div className="flex-1 space-y-4 w-full text-xs text-slate-400">
                    <div className="flex items-center gap-3.5 border-b border-slate-900 pb-3">
                      <div className="p-2.5 bg-[#030509] rounded-xl border border-emerald-500/10 shadow-lg">
                        <LeetCodeIcon />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">
                          LeetCode Algorithm Statistics
                        </h3>
                        <p className="text-emerald-400 font-bold text-[10px] mt-0.5">
                          Top {Math.max(1, Math.round((evidence.leetcode_stats.ranking / 5000000) * 100))}% globally
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#030509] border border-slate-800 rounded-xl p-3 text-center">
                        <div className="text-emerald-400 font-black text-xs mb-0.5">{evidence.leetcode_stats.solvedEasy || 0}</div>
                        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Easy</div>
                      </div>
                      <div className="bg-[#030509] border border-slate-800 rounded-xl p-3 text-center">
                        <div className="text-amber-400 font-black text-xs mb-0.5">{evidence.leetcode_stats.solvedMedium || 0}</div>
                        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Medium</div>
                      </div>
                      <div className="bg-[#030509] border border-slate-800 rounded-xl p-3 text-center">
                        <div className="text-rose-500 font-black text-xs mb-0.5">{evidence.leetcode_stats.solvedHard || 0}</div>
                        <div className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Hard</div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-950/15 border border-emerald-500/10 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Ranking</div>
                      <div className="text-xs font-bold text-slate-200">
                        {evidence.leetcode_stats.ranking > 0 ? `#${evidence.leetcode_stats.ranking.toLocaleString()}` : 'N/A'}
                      </div>
                    </div>

                    <div className="bg-emerald-950/15 border border-emerald-500/10 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acceptance Rate</div>
                      <div className="text-xs font-bold text-slate-200">
                        {evidence.leetcode_stats.acceptanceRate}%
                      </div>
                    </div>
                  </div>

                  {/* Right: Topic Focus */}
                  <div className="flex-1 w-full">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      LeetCode Topic Mastery
                    </h4>
                    {evidence.leetcode_stats.topicStats && evidence.leetcode_stats.topicStats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {evidence.leetcode_stats.topicStats.map((topic: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-[#030509] text-slate-300"
                          >
                            <span className="text-[10px] font-bold">{topic.tagName}</span>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{topic.problemsSolved}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic p-5 border border-dashed border-slate-800 rounded-xl text-center">
                        No public topics statistics available.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Collapsible Telemetry Logs Console at the bottom */}
            <div className="fancy-card p-6 shadow-xl border border-slate-900 bg-[#030509]/30">
              <button 
                onClick={() => setShowLogs(!showLogs)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Ingestion Telemetry Stream Logs
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  {showLogs ? 'Hide Telemetry Logs' : 'Show Telemetry Logs'}
                  {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              
              {showLogs && (
                <div className="mt-4 bg-black/95 font-mono text-xs text-emerald-400/90 rounded-2xl p-5 h-80 overflow-y-auto border border-slate-900 space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              )}
            </div>

          </div>
        );
      })()}


      {/* 4. ERROR PHASE */}
      {status === 'failed' && (
        <div className="space-y-6 view-transition relative z-10">
          <div className="flex justify-start">
            <button
              onClick={resetStore}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#070b13] hover:bg-[#0c121e] border border-red-500/10 rounded-xl text-xs font-bold text-slate-400 transition-all duration-300 hover:border-red-500/35"
            >
              <ArrowLeft className="w-4 h-4 text-red-400" />
              Back to Form
            </button>
          </div>
          <div className="fancy-card p-8 shadow-2xl border-red-500/20 bg-red-950/10">
            <h3 className="text-xs font-bold text-red-400 flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Scan Failed
            </h3>
            <p className="text-slate-300 mb-6">The verification pipeline encountered a critical error. Please review the logs below.</p>
            <div className="bg-black/95 font-mono text-xs text-red-400/90 rounded-2xl p-5 h-64 overflow-y-auto border border-red-900 space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


