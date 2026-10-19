import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Share } from 'react-native';
import { useTheme, alpha, RISK } from '../theme';
import { Card, MetricCard, RiskScoreBadge, AwsResourceChip, FindingCard, PrimaryButton, OutlinedButton, Icon, ProgressBar } from '../components';

const SEV_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function markdownReport(analysis, improvedText) {
  const date = new Date(analysis.timestamp).toISOString();
  const lines = [];
  lines.push('# Vector — Security Diagnosis Report', '');
  lines.push(`**Date:** ${date}`);
  lines.push(`**Analysis ID:** \`${analysis.id}\``);
  lines.push(`**Overall Risk Score:** ${analysis.riskScore}/100 (${analysis.riskLevel})`);
  lines.push(`**Security Coverage:** ${analysis.securityCoverage}%`);
  lines.push(`**Analyzer Confidence:** ${analysis.confidence}%`, '', '---', '');
  lines.push('## 1. Evaluated Prompt', '', '```text', analysis.prompt, '```', '', '---', '');
  lines.push('## 2. Detected AWS Resources', '');
  if (analysis.detectedResources.length === 0) lines.push('*No specific AWS resources detected.*');
  else analysis.detectedResources.forEach((r) => lines.push(`- **${r.name}** (\`${r.shortName}\`)`));
  lines.push('', '---', '', '## 3. Security Findings Summary', '');
  lines.push(`- **Total Findings:** ${analysis.findings.length}`, '');
  analysis.findings.forEach((f, i) => {
    lines.push(`#### ${i + 1}. [${f.severity}] ${f.title}`);
    if (f.affectedResource) lines.push(`- **Resource:** ${f.affectedResource}`);
    lines.push(`- **Diagnosis:** ${f.explanation}`);
    lines.push(`- **Recommended Fix:** ${f.recommendedFix}`);
    lines.push(`- **Security Clause:**`, `  > ${f.securityClause}`, '');
  });
  lines.push('---', '', '## 4. Hardened Infrastructure Prompt', '', '```text', improvedText || analysis.prompt, '```');
  return lines.join('\n');
}

export default function ResultsScreen({ analysis, selectedIds, onToggle, onSelectAll, onClearAll, onNavigateToImproved, improvedText, onSnackbar }) {
  const t = useTheme();
  const [tab, setTab] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);

  const bySev = (a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9);
  const missing = analysis.findings.filter((f) => f.type === 'MISSING_CONTROL').sort(bySev);
  const detected = analysis.findings.filter((f) => f.type === 'DETECTED_CONTROL');
  const risky = analysis.findings.filter((f) => f.type === 'RISKY_STATEMENT').sort(bySev);
  const tabs = [
    { label: `Missing Controls (${missing.length})`, items: missing, testID: 'tab_missing_controls' },
    { label: `Detected Controls (${detected.length})`, items: detected, testID: 'tab_detected_controls' },
    { label: `Risky Statements (${risky.length})`, items: risky, testID: 'tab_risky_statements' },
  ];
  const active = tabs[tab] || tabs[0];
  const selectedCount = selectedIds ? selectedIds.size : 0;

  const downloadReport = async () => {
    try {
      await Share.share({ message: markdownReport(analysis, improvedText), title: 'Vector security report' });
      if (onSnackbar) onSnackbar('Security report ready to share.');
    } catch (e) {
      if (onSnackbar) onSnackbar('Failed to export report: ' + (e.message || 'unknown error'));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Overview */}
      <Card style={{ padding: 16, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RiskScoreBadge score={analysis.riskScore} level={analysis.riskLevel} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable testID="download_report_button" onPress={downloadReport} style={{ height: 34, borderRadius: 8, borderWidth: 1, borderColor: t.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
              <Icon name="Download" size={15} color={t.primary} />
              <View style={{ width: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: t.primary }}>Download Report</Text>
            </Pressable>
            <View style={{ width: 6 }} />
            <Pressable onPress={() => setShowExplainer((s) => !s)} hitSlop={8} style={{ padding: 4 }}>
              <Icon name="HelpOutline" size={20} color={t.onSurfaceVariant} />
            </Pressable>
          </View>
        </View>
        <View style={{ height: 12 }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurfaceVariant }}>Evaluated Prompt:</Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: t.onSurface, lineHeight: 20 }}>{analysis.prompt}</Text>
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.onSurfaceVariant }}>Security Controls Coverage</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>{analysis.securityCoverage}%</Text>
        </View>
        <View style={{ height: 6 }} />
        <ProgressBar value={analysis.securityCoverage} color={t.primary} />
        {showExplainer ? (
          <View style={{ marginTop: 14, borderRadius: 10, backgroundColor: t.surfaceVariant, borderWidth: 1, borderColor: t.outline, padding: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurface }}>Metric Guidelines:</Text>
            <Text style={{ marginTop: 4, fontSize: 11, color: t.onSurfaceVariant, lineHeight: 16 }}>
              â€¢ Risk Score (0-100): Calculated deterministically from detected risky configurations and missing security controls.{'\n'}
              â€¢ Security Coverage: Ratio of specified controls versus total expected controls for detected AWS services.{'\n'}
              â€¢ Confidence ({analysis.confidence}%): Reflects completeness of prompt structural parsing. Does not guarantee environment safety.
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={{ height: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <MetricCard title="AWS Services" value={String(analysis.detectedResources.length)} subtitle="Identified" accent={t.primary} />
        <MetricCard title="Missing" value={String(missing.length)} subtitle="Controls" accent={RISK.HIGH} />
        <MetricCard title="Risky Statements" value={String(risky.length)} subtitle="Flagged" accent={RISK.CRITICAL} />
      </View>

      {analysis.detectedResources.length > 0 ? (
        <>
          <View style={{ height: 16 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.onBackground }}>Detected AWS Infrastructure Resources</Text>
          <View style={{ height: 8 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {analysis.detectedResources.map((r) => (
              <AwsResourceChip key={r.id} name={r.name} />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={{ height: 16 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {tabs.map((tb, i) => (
          <Pressable
            key={tb.label}
            testID={tb.testID}
            onPress={() => setTab(i)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: tab === i ? t.primary : 'transparent' }}
          >
            <Text style={{ fontSize: 13, fontWeight: tab === i ? '700' : '500', color: tab === i ? t.primary : t.onSurfaceVariant }}>
              {tb.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ height: 10 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: t.primary }}>{selectedCount} clause(s) selected</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <OutlinedButton compact testID="select_all_recommendations_button" label="Select All" icon="Check" onPress={onSelectAll} />
          <OutlinedButton compact testID="clear_recommendations_button" label="Clear" icon="Clear" onPress={onClearAll} />
        </View>
      </View>

      <View style={{ height: 12 }} />
      {active.items.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center', borderRadius: 14 }}>
          <Text style={{ fontSize: 14, color: t.onSurfaceVariant }}>No findings in this category.</Text>
        </Card>
      ) : (
        active.items.map((f) => (
          <FindingCard key={f.id} finding={f} selected={selectedIds ? selectedIds.has(f.id) : false} onToggleSelect={() => onToggle(f.id)} />
        ))
      )}

      <View style={{ height: 10 }} />
      <PrimaryButton
        testID="review_improved_prompt_button"
        label={`Review Improved Prompt (${selectedCount})`}
        icon="ArrowForward"
        onPress={onNavigateToImproved}
      />
    </ScrollView>
  );
}
