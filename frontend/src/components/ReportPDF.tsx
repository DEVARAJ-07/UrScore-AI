import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Inline styling for PDF generation (React PDF does not support Tailwind classes directly)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
    backgroundColor: '#ffffff'
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#7c3aed',
    paddingBottom: 15,
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4
  },
  scoreBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c3aed'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  gridCol: {
    width: '33.33%',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    margin: -0.5
  },
  colLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase'
  },
  colValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4
  },
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
    padding: 6,
    alignItems: 'center'
  },
  col1: { width: '40%' },
  col2: { width: '40%' },
  col3: { width: '20%', textAlign: 'right' },
  badgeVerified: {
    color: '#10b981',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
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
    };
    score_breakdown: {
      verified_keywords: string[];
      unverified_keywords: string[];
    };
  };
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ report, evidence }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>UrScore AI - Competency Report</Text>
          <Text style={styles.subtitle}>Verified GitHub Intelligence & Placement Readiness Scorecard</Text>
        </View>

        {/* Profile / Overall Score */}
        <View style={styles.scoreBadgeContainer}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
              {evidence.github_profile.name || evidence.github_profile.username}
            </Text>
            <Text style={{ color: '#64748b', marginTop: 2 }}>GitHub: @{evidence.github_profile.username}</Text>
            <Text style={{ color: '#64748b' }}>Verified Experience: {report.summary_metrics.experience_years || 1} Years</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.scoreLabel}>PLACEMENT READINESS SCORE</Text>
            <Text style={styles.scoreValue}>{report.overall_score}/100</Text>
          </View>
        </View>

        {/* Competency Subscores Grid */}
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

        {/* Verification Summary Matrix */}
        <Text style={styles.sectionTitle}>Skills Verification Details</Text>
        
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Skill Claimed in Resume</Text>
          <Text style={styles.col2}>GitHub Dependency Evidence</Text>
          <Text style={styles.col3}>Status</Text>
        </View>

        {/* Verified Skills Rows */}
        {evidence.score_breakdown.verified_keywords.map((skill, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.col1}>{skill}</Text>
            <Text style={styles.col2}>Verified in repositories imports</Text>
            <Text style={[styles.col3, styles.badgeVerified]}>VERIFIED</Text>
          </View>
        ))}

        {/* Unverified Skills Rows */}
        {evidence.score_breakdown.unverified_keywords.map((skill, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={styles.col1}>{skill}</Text>
            <Text style={styles.col2}>No direct file package reference</Text>
            <Text style={[styles.col3, { color: '#ef4444', fontWeight: 'bold' }]}>UNVERIFIED</Text>
          </View>
        ))}

        {/* Extra profiles details */}
        {report.summary_metrics.leetcode_solved ? (
          <View style={{ marginTop: 20, backgroundColor: '#f8fafc', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#0f172a', marginBottom: 4 }}>
              LeetCode Algorithm Analytics
            </Text>
            <Text style={{ color: '#475569' }}>
              Candidate has verified algorithmic proficiency with {report.summary_metrics.leetcode_solved} problems solved on LeetCode.
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer}>
          Report generated automatically by UrScore AI. Verification logs and evidence hash are recorded cryptographically.
        </Text>
      </Page>
    </Document>
  );
};
