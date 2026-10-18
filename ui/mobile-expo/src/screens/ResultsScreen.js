import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTheme, alpha } from '../theme';
import { Card, MetricCard, RiskScoreBadge, AwsResourceChip, FindingCard, PrimaryButton, OutlinedButton, Icon, ProgressBar } from '../ui';

export default function ResultsScreen({ analysis, selectedIds, onToggle, onSelectAll, onClearAll, onNavigateToImproved }) {
  const t = useTheme();
  const [tab, setTab] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);

  const missing = analysis.findings.filter((f) => f.type === 'MISSING_CONTROL');
  const detected = analysis.findings.filter((f) => f.type === 'DETECTED_CONTROL');
  const risky = analysis.findings.filter((f) => f.type === 'RISKY_STATEMENT');
  const tabs = [
    { label: `Missing Controls (${missing.length})`, items: missing, testID: 'tab_missing_controls' },
    { label: `Detected Controls (${detected.length})`, items: detected, testID: 'tab_detected_controls' },
    { label: `Risky Statements (${risky.length})`, items: risky, testID: 'tab_risky_statements' },
  ];
  const active = tabs[tab] || tabs[0];
  const selectedCount = selectedIds ? selectedIds.size : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Overview */}
      <Card style={{ padding: 16, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RiskScoreBadge score={analysis.riskScore} level={analysis.riskLevel} />
          <Pressable onPress={() => setShowExplainer((s) => !s)} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="HelpOutline" size={20} color={t.onSurfaceVariant} />
          </Pressable>
        </View>
        <View style={{ height: 12 }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurfaceVariant }}>Analyzed Prompt:</Text>
        <Text style={{ marginTop: 4, fontSize: 14, color: t.onSurface }}>{analysis.prompt}</Text>
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.onSurfaceVariant }}>Security Coverage</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#49686C' }}>{analysis.securityCoverage}%</Text>
        </View>
        <View style={{ height: 6 }} />
        <ProgressBar value={analysis.securityCoverage} color="#49686C" />
        {showExplainer ? (
          <View style={{ marginTop: 14, borderRadius: 10, backgroundColor: t.surfaceVariant, borderWidth: 1, borderColor: t.outline, padding: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurface }}>Metric Guidelines:</Text>
            <Text style={{ marginTop: 4, fontSize: 11, color: t.onSurfaceVariant, lineHeight: 16 }}>
              • Higher risk scores indicate greater identified security risk.{'\n'}
              • Higher coverage means more applicable security controls are specified.{'\n'}
              • Confidence ({analysis.confidence}%) reflects the analyzer's confidence in completeness; it does not guarantee security.
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={{ height: 16 }} />
      {/* Summary tiles */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <MetricCard title="Resources" value={String(analysis.detectedResources.length)} subtitle="AWS Services" accent="#49686C" />
        <MetricCard title="Missing" value={String(missing.length)} subtitle="Controls" accent="#D35400" />
        <MetricCard title="Risky" value={String(risky.length)} subtitle="Statements" accent="#B94D42" />
      </View>

      {/* Detected resources */}
      {analysis.detectedResources.length > 0 ? (
        <>
          <View style={{ height: 16 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.onBackground }}>Detected AWS Resources</Text>
          <View style={{ height: 8 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {analysis.detectedResources.map((r) => (
              <AwsResourceChip key={r.id} name={r.name} />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View style={{ height: 16 }} />
      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {tabs.map((tb, i) => (
          <Pressable
            key={tb.label}
            testID={tb.testID}
            onPress={() => setTab(i)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: 2,
              borderBottomColor: tab === i ? t.primary : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: tab === i ? '700' : '500', color: tab === i ? t.primary : t.onSurfaceVariant }}>
              {tb.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ height: 10 }} />
      {/* Selection toolbar */}
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
