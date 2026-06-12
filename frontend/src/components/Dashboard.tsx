import React, { useState, useEffect, useRef } from 'react';
import { useScanStore } from '../store/useScanStore';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './ReportPDF';
import { 
  Github, Terminal, ShieldCheck, FileText, Cpu, Calendar, 
  TrendingUp, Award, Link, Download, Loader2, Sparkles 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    activeScanId,
    logs,
    progress,
    status,
    report,
    evidence,
    startScanSubscription,
    resetStore
  } = useScanStore();

  // Local Form state
  const [githubUsername, setGithubUsername] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Terminal scroll reference
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Form submit handler
  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUsername.trim()) {
      setErrorMsg('GitHub username is required');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5001/api/scans/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          github_username: githubUsername.trim(),
          resume_text: resumeText.trim(),
          leetcode_username: leetcodeUsername.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          resume_filename: resumeText.trim() ? 'resume_upload.pdf' : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger scan server-side');
      }

      const data = await response.json();
      const scanId = data.scanId;

      // Subscribe to real-time updates over WebSocket gateway
      startScanSubscription(scanId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!report) return [];
    return [
      { subject: 'Skill Verification', value: report.skill_verification, fullMark: 100 },
      { subject: 'Commit Quality', value: report.commit_quality, fullMark: 100 },
      { subject: 'Complexity', value: report.project_complexity, fullMark: 100 },
      { subject: 'Recency Weighting', value: report.recency, fullMark: 100 },
      { subject: 'Cross Reference', value: report.cross_reference, fullMark: 100 },
      { subject: 'Activity Consistency', value: report.activity_consistency, fullMark: 100 },
    ];
  };

  const chartData = getChartData();

  // Rating badge helper
  const getRatingBadge = (score: number) => {
    if (score >= 90) return { label: 'Elite Developer (L4)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (score >= 75) return { label: 'Placement Ready (L3)', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10' };
    if (score >= 55) return { label: 'Capable Contributor (L2)', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' };
    return { label: 'Entry Level (L1)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Developer intelligence
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Gateway Connected
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            UrScore AI <span className="text-violet-400 text-2xl font-light">Hub</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated repository code-checks and resume cross-referencing.
          </p>
        </div>
        
        {status !== 'idle' && (
          <button 
            onClick={resetStore}
            className="px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            Run New Analysis
          </button>
        )}
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Setup Scan Form / Live Telemetry Logs */}
        <div className="lg:col-span-5 space-y-6">
          {status === 'idle' ? (
            <div className="glass-panel rounded-xl p-6 shadow-glow">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-violet-400" />
                Initialize Verification Scan
              </h2>

              <form onSubmit={handleStartScan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    GitHub Username *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. octocat"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      LeetCode Profile (Opt)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. dev_coder"
                      value={leetcodeUsername}
                      onChange={(e) => setLeetcodeUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Portfolio Web URL (Opt)
                    </label>
                    <input
                      type="url"
                      placeholder="https://myport.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Resume Text (Paste Resume Content)
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste the raw text of the candidate's resume here for parsing and automated keyword mapping..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-violet-500 text-slate-100"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-lg text-sm transition shadow-glow flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Triggering Workers...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Verify Developer Readiness
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            // Terminal Live Output Panel
            <div className="glass-panel rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Stateless Worker Console
                </h3>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                  Scan ID: {activeScanId?.slice(0, 8)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 capitalize">Status: {status.replace('_', ' ')}</span>
                  <span className="text-violet-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-indigo-400 h-1.5 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Console log display */}
              <div className="bg-black/80 font-mono text-[11px] text-emerald-300 rounded-lg p-3 h-96 overflow-y-auto border border-slate-900 space-y-1.5">
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
                {status !== 'completed' && status !== 'failed' && (
                  <div className="flex items-center gap-1.5 text-slate-500 italic mt-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Awaiting next worker packet...
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Score Reports & Verification Matrices */}
        <div className="lg:col-span-7 space-y-6">
          {report && evidence ? (
            <>
              {/* Scorecard Hero Panel */}
              <div className="glass-panel rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 text-center md:text-left">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Overall Readiness
                  </span>
                  <div className="text-6xl font-black text-violet-400 mt-1">
                    {report.overall_score}
                    <span className="text-2xl text-slate-500 font-normal">/100</span>
                  </div>
                  
                  {/* Rating Label Badge */}
                  <div className={`mt-3 inline-block px-3 py-1 text-xs font-bold rounded-full border ${getRatingBadge(report.overall_score).color}`}>
                    {getRatingBadge(report.overall_score).label}
                  </div>
                </div>

                <div className="md:col-span-7 space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-violet-400" />
                    <strong>Developer Name:</strong> {evidence.github_profile.name || evidence.github_profile.username}
                  </div>
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-slate-400" />
                    <strong>GitHub Account:</strong> @{evidence.github_profile.username}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <strong>Public Repositories Analyzed:</strong> {report.summary_metrics.total_repos}
                  </div>
                  
                  {/* PDF Download link */}
                  <div className="pt-3">
                    <PDFDownloadLink
                      document={<ReportPDF report={report} evidence={evidence} />}
                      fileName={`competency_report_${githubUsername}.pdf`}
                      className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded text-xs font-bold transition text-white shadow-glow"
                    >
                      {({ loading }) => (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          {loading ? 'Compiling PDF...' : 'Download Competency PDF'}
                        </>
                      )}
                    </PDFDownloadLink>
                  </div>
                </div>
              </div>

              {/* Charts Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar chart of sub-scores */}
                <div className="glass-panel rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    Scoring Balance Matrix
                  </h3>
                  <div className="w-full h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" radius="70%" data={chartData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                        <Radar
                          name="Scoring Weight"
                          dataKey="value"
                          stroke="#7c3aed"
                          fill="#7c3aed"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subscores Bar Chart */}
                <div className="glass-panel rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Scores Breakdown
                  </h3>
                  <div className="w-full h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <YAxis type="category" dataKey="subject" width={100} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#11131e', border: '1px solid #334155', borderRadius: '6px' }} />
                        <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Skills Verification Matrix Table */}
              <div className="glass-panel rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  Competency Verification Matrix
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Match claims from the candidate resume text against concrete repository dependencies found on public GitHub history.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">Skill / Framework Claimed</th>
                        <th className="py-2.5 px-3">Verified GitHub Dependency</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {/* Verified Skills */}
                      {evidence.score_breakdown.verified_keywords.map((skill: string, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/30">
                          <td className="py-3 px-3 font-semibold text-slate-200">{skill}</td>
                          <td className="py-3 px-3 text-slate-400">Verified in repository manifests</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">VERIFIED</td>
                        </tr>
                      ))}
                      
                      {/* Unverified Skills */}
                      {evidence.score_breakdown.unverified_keywords.map((skill: string, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/30">
                          <td className="py-3 px-3 font-semibold text-slate-300">{skill}</td>
                          <td className="py-3 px-3 text-slate-500">No matching library import detected</td>
                          <td className="py-3 px-3 text-right font-bold text-red-400">UNVERIFIED</td>
                        </tr>
                      ))}

                      {evidence.score_breakdown.verified_keywords.length === 0 && 
                       evidence.score_breakdown.unverified_keywords.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-500">
                            No keyword markers detected in resume text. Paste text to see verification.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            // Empty State
            <div className="glass-panel rounded-xl p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center border-dashed border-2 border-slate-800">
              <Cpu className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">No Assessment Loaded</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Initiate a developer scan on the left panel. Workers will stream real-time GitHub commits, languages, and resume checks.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
