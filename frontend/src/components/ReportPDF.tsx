import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff'
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#10b981',
    paddingBottom: 8,
    marginBottom: 15
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2
  },
  scoreBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 15
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b'
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981'
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4
  },
  sectionSubtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: -4,
    marginBottom: 10
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  gridCol: {
    width: '33.33%',
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    margin: -0.5
  },
  colLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase'
  },
  colValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 3
  },
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 5,
    alignItems: 'center'
  },
  col1: { width: '40%' },
  col2: { width: '40%' },
  col3: { width: '20%', textAlign: 'right' },
  badgeVerified: {
    color: '#10b981',
    fontWeight: 'bold'
  },
  // Repository and project cards
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fafcfb'
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  cardMeta: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 4
  },
  cardBody: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.3
  },
  cardSection: {
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 4
  },
  // Keyword categorization style
  keywordBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  keywordRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  keywordLabel: {
    width: '25%',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569'
  },
  keywordValue: {
    width: '75%',
    fontSize: 8,
    color: '#64748b'
  },
  // LeetCode styles
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statBox: {
    width: '32%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center'
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  difficultyName: {
    width: '20%',
    fontSize: 8,
    fontWeight: 'bold'
  },
  difficultyCount: {
    width: '15%',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 10
  },
  difficultyBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    position: 'relative'
  },
  difficultyBarFill: {
    height: 6,
    borderRadius: 3
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8'
  }
});

interface ReportPDFProps {
  report: {
    overall_score: number;
    skill_verification: number;
    commit_quality: number;
    project_complexity: number;
    recency: number;
    cross_reference: number;
    activity_consistency: number;
    summary_metrics: {
      total_repos: number;
      verified_skills_count: number;
      leetcode_solved?: number;
      experience_years?: number;
    };
  };
  evidence: {
    github_profile: {
      username: string;
      name: string;
    };
    resume_extracted_metrics: {
      experience_years: number;
      keywords?: {
        languages: string[];
        frameworks: string[];
        databases: string[];
        tools: string[];
      };
      extracted_projects?: {
        name: string;
        description: string;
      }[];
    };
    score_breakdown: {
      verified_keywords: string[];
      unverified_keywords: string[];
    };
    repositories_analyzed?: {
      name: string;
      stars: number;
      forks: number;
      commits_analyzed?: number;
      file_paths?: string[];
      ai_description?: string;
    }[];
    leetcode_stats?: {
      solvedTotal: number;
      solvedEasy: number;
      solvedMedium: number;
      solvedHard: number;
      ranking: number;
      acceptanceRate: number;
      topicStats?: {
        tagName: string;
        problemsSolved: number;
      }[];
    };
  };
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ report, evidence }) => {
  const name = evidence.github_profile?.name || evidence.github_profile?.username || 'Unknown Developer';
  const username = evidence.github_profile?.username || 'N/A';
  const totalRepos = report.summary_metrics?.total_repos || evidence.repositories_analyzed?.length || 0;
  const expYears = report.summary_metrics?.experience_years || evidence.resume_extracted_metrics?.experience_years || 0;

  // Keyword extraction categories safely fallback
  const keywords = evidence.resume_extracted_metrics?.keywords || {
    languages: [],
    frameworks: [],
    databases: [],
    tools: []
  };

  const repos = evidence.repositories_analyzed || [];
  const projects = evidence.resume_extracted_metrics?.extracted_projects || [];
  const leetcode = evidence.leetcode_stats;

  return (
    <Document>
      {/* PAGE 1: OVERVIEW & SKILLS MATRIX */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>UrScore AI - Competency Report</Text>
          <Text style={styles.subtitle}>Verified GitHub Intelligence & Placement Readiness Scorecard</Text>
        </View>

        <View style={styles.scoreBadgeContainer}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>{name}</Text>
            <Text style={{ color: '#64748b', marginTop: 2, fontSize: 8.5 }}>GitHub: @{username}</Text>
            <Text style={{ color: '#64748b', fontSize: 8.5 }}>Verified Industry Experience: {expYears} Years</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.scoreLabel}>PLACEMENT READINESS SCORE</Text>
            <Text style={styles.scoreValue}>{report.overall_score}/100</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Verification Sub-Scores Breakdown</Text>
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Skill Verification (25%)</Text>
            <Text style={styles.colValue}>{report.skill_verification}%</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Commit Quality (20%)</Text>
            <Text style={styles.colValue}>{report.commit_quality}%</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Project Complexity (20%)</Text>
            <Text style={styles.colValue}>{report.project_complexity}%</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Recency Weighting (15%)</Text>
            <Text style={styles.colValue}>{report.recency}%</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Cross-Reference (12%)</Text>
            <Text style={styles.colValue}>{report.cross_reference}%</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.colLabel}>Activity Consistency (8%)</Text>
            <Text style={styles.colValue}>{report.activity_consistency}%</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Technical Skills Verification Matrix</Text>
        <Text style={styles.sectionSubtitle}>Cross-referencing technology claims with actual public repository footprints</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Skill Claimed in Resume</Text>
          <Text style={styles.col2}>GitHub Dependency Evidence</Text>
          <Text style={styles.col3}>Status</Text>
        </View>

        {evidence.score_breakdown?.verified_keywords?.slice(0, 10).map((skill, index) => (
          <View style={styles.tableRow} key={`v-${index}`}>
            <Text style={styles.col1}>{skill}</Text>
            <Text style={styles.col2}>Verified in active repository dependencies</Text>
            <Text style={[styles.col3, styles.badgeVerified]}>VERIFIED</Text>
          </View>
        ))}

        {evidence.score_breakdown?.unverified_keywords?.slice(0, 5).map((skill, index) => (
          <View style={styles.tableRow} key={`uv-${index}`}>
            <Text style={styles.col1}>{skill}</Text>
            <Text style={styles.col2}>No active package or file import footprint</Text>
            <Text style={[styles.col3, { color: '#ef4444', fontWeight: 'bold' }]}>UNVERIFIED</Text>
          </View>
        ))}

        <Text style={styles.footer}>Page 1/3 - UrScore AI Engine - Private & Confidential</Text>
      </Page>

      {/* PAGE 2: GITHUB ANALYSIS & CODE AUDIT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>1. GitHub Codebase Audit</Text>
          <Text style={styles.subtitle}>Granular inspection of active repositories and repository files</Text>
        </View>

        <Text style={{ fontSize: 9.5, color: '#475569', marginBottom: 10, fontWeight: 'bold' }}>
          Total Audited Repositories: {totalRepos}
        </Text>

        {repos.length > 0 ? (
          repos.slice(0, 4).map((repo, idx) => {
            const files = repo.file_paths || [];
            const filesText = files.length > 0 
              ? files.slice(0, 6).join(', ') + (files.length > 6 ? ` (and ${files.length - 6} more)` : '')
              : 'No source files accessed';

            return (
              <View style={styles.card} key={`repo-${idx}`} wrap={false}>
                <Text style={styles.cardTitle}>{idx + 1}. {repo.name}</Text>
                <Text style={styles.cardMeta}>
                  Stars: {repo.stars} | Forks: {repo.forks} | Commits Analysed: {repo.commits_analyzed || 0}
                </Text>
                
                <Text style={styles.cardBody}>
                  <Text style={{ fontWeight: 'bold' }}>Files Accessed: </Text>
                  {filesText}
                </Text>

                <View style={styles.cardSection}>
                  <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 }}>
                    AI Code Assessment:
                  </Text>
                  <Text style={styles.cardBody}>
                    {repo.ai_description || 'No detailed codebase assessment available for this repository.'}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ fontStyle: 'italic', color: '#64748b' }}>No active GitHub repositories were processed.</Text>
        )}

        <Text style={styles.footer}>Page 2/3 - UrScore AI Engine - Private & Confidential</Text>
      </Page>

      {/* PAGE 3: RESUME PROJECT DESCRIPTIONS & KEYWORDS / LEETCODE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>2. Resume Verification & Alignments</Text>
          <Text style={styles.subtitle}>Analyzing project alignment and technical keyword matches</Text>
        </View>

        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 }}>
          Resume Extracted Projects & Matching Details
        </Text>

        {projects.length > 0 ? (
          projects.slice(0, 3).map((proj, idx) => (
            <View style={styles.card} key={`proj-${idx}`} wrap={false}>
              <Text style={styles.cardTitle}>{proj.name}</Text>
              <Text style={[styles.cardBody, { marginTop: 4 }]}>{proj.description}</Text>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Uploaded Project Footprint</Text>
            <Text style={[styles.cardBody, { marginTop: 4 }]}>
              Resume projects cross-referenced with GitHub codebase structures to verify execution viability.
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginTop: 10, marginBottom: 6 }}>
          Extracted Technical Keywords
        </Text>

        <View style={styles.keywordBlock}>
          <View style={styles.keywordRow}>
            <Text style={styles.keywordLabel}>Languages:</Text>
            <Text style={styles.keywordValue}>{keywords.languages?.join(', ') || 'N/A'}</Text>
          </View>
          <View style={styles.keywordRow}>
            <Text style={styles.keywordLabel}>Frameworks:</Text>
            <Text style={styles.keywordValue}>{keywords.frameworks?.join(', ') || 'N/A'}</Text>
          </View>
          <View style={styles.keywordRow}>
            <Text style={styles.keywordLabel}>Databases:</Text>
            <Text style={styles.keywordValue}>{keywords.databases?.join(', ') || 'N/A'}</Text>
          </View>
          <View style={styles.keywordRow}>
            <Text style={styles.keywordLabel}>Tools & DevOps:</Text>
            <Text style={styles.keywordValue}>{keywords.tools?.join(', ') || 'N/A'}</Text>
          </View>
        </View>

        {/* LEETCODE OPTIONAL SEGMENT */}
        {leetcode && leetcode.solvedTotal > 0 ? (
          <View style={{ marginTop: 15 }} wrap={false}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4 }}>
              3. LeetCode Algorithm Analytics
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>TOTAL SOLVED</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>
                  {leetcode.solvedTotal}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>ACCEPTANCE RATE</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>
                  {leetcode.acceptanceRate}%
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>GLOBAL RANK</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 3 }}>
                  {leetcode.ranking > 0 ? `#${leetcode.ranking.toLocaleString()}` : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Difficulty Breakdown bars */}
            <View style={{ marginTop: 4 }}>
              <View style={styles.difficultyRow}>
                <Text style={[styles.difficultyName, { color: '#10b981' }]}>Easy</Text>
                <Text style={styles.difficultyCount}>{leetcode.solvedEasy || 0}</Text>
                <View style={styles.difficultyBarBg}>
                  <View style={[styles.difficultyBarFill, { 
                    width: `${((leetcode.solvedEasy || 0) / (leetcode.solvedTotal || 1)) * 100}%`,
                    backgroundColor: '#10b981' 
                  }]} />
                </View>
              </View>

              <View style={styles.difficultyRow}>
                <Text style={[styles.difficultyName, { color: '#f59e0b' }]}>Medium</Text>
                <Text style={styles.difficultyCount}>{leetcode.solvedMedium || 0}</Text>
                <View style={styles.difficultyBarBg}>
                  <View style={[styles.difficultyBarFill, { 
                    width: `${((leetcode.solvedMedium || 0) / (leetcode.solvedTotal || 1)) * 100}%`,
                    backgroundColor: '#f59e0b' 
                  }]} />
                </View>
              </View>

              <View style={styles.difficultyRow}>
                <Text style={[styles.difficultyName, { color: '#ef4444' }]}>Hard</Text>
                <Text style={styles.difficultyCount}>{leetcode.solvedHard || 0}</Text>
                <View style={styles.difficultyBarBg}>
                  <View style={[styles.difficultyBarFill, { 
                    width: `${((leetcode.solvedHard || 0) / (leetcode.solvedTotal || 1)) * 100}%`,
                    backgroundColor: '#ef4444' 
                  }]} />
                </View>
              </View>
            </View>

            {leetcode.topicStats && leetcode.topicStats.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#475569', marginBottom: 2 }}>
                  Algorithm Focus Areas (Topics):
                </Text>
                <Text style={{ fontSize: 8, color: '#64748b', lineHeight: 1.3 }}>
                  {leetcode.topicStats.slice(0, 10).map(t => `${t.tagName} (${t.problemsSolved})`).join('  |  ')}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <Text style={styles.footer}>Page 3/3 - UrScore AI Engine - Private & Confidential</Text>
      </Page>
    </Document>
  );
};
