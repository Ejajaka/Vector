import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTheme, riskColor, riskLabel, RISK } from '../theme';
import { Card, MetricCard, RiskScoreBadge, Icon, RiskDistributionCard } from '../components';
import VectorLogo from '../VectorLogo';

function RecentRow({ item, onPress }) {
  const t = useTheme();
  const date = new Date(item.timestamp).toLocaleDateString();
  return (
    <Card onPress={() => onPress(item)} style={{ padding: 14, borderRadius: 14, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RiskScoreBadge score={item.riskScore} level={item.riskLevel} />
        <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>{date}</Text>
      </View>
      <Text numberOfLines={2} style={{ marginTop: 8, fontSize: 14, fontWeight: '500', color: t.onSurface }}>
        {item.prompt}
      </Text>
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>
          {`Coverage: ${item.securityCoverage}%  â€¢  ${item.detectedResources.length} Resources`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>View</Text>
          <View style={{ width: 4 }} />
          <Icon name="ArrowForward" size={14} color={t.primary} />
        </View>
      </View>
    </Card>
  );
}

export default function HomeScreen({ metrics, recentAnalyses, onStartAnalysis, onReopenAnalysis, onNavigateToHistory, onNavigateToAbout }) {
  const t = useTheme();
  const hasData = metrics.totalAnalyses > 0;
  const avgRiskAccent = metrics.averageRiskScore >= 60 ? RISK.CRITICAL : t.mustard;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={{ backgroundColor: t.darkTeal, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(229,226,216,0.3)', padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ borderRadius: 8, backgroundColor: 'rgba(209,182,83,0.2)', borderWidth: 1, borderColor: 'rgba(209,182,83,0.45)', paddingHorizontal: 9, paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#D1B653', letterSpacing: 1 }}>AWS PRE-GENERATION SECURITY</Text>
          </View>
          <VectorLogo size={30} dark />
        </View>
        <View style={{ height: 14 }} />
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF' }}>Vector</Text>
        <View style={{ height: 4 }} />
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 21 }}>
          Identify security gaps in AWS infrastructure prompts before they become part of generated code.
        </Text>
        <View style={{ height: 18 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            testID="home_new_analysis_button"
            onPress={onStartAnalysis}
            style={({ pressed }) => ({ flex: 1.5, height: 48, borderRadius: 12, backgroundColor: '#D1B653', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1 })}
          >
            <Icon name="Analytics" size={18} color="#30494B" />
            <View style={{ width: 8 }} />
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: '#30494B' }}>Start New Analysis</Text>
          </Pressable>
          <Pressable
            testID="home_about_button"
            onPress={onNavigateToAbout}
            style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
          >
            <Icon name="Info" size={16} color="#FFFFFF" />
            <View style={{ width: 6 }} />
            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>About</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 16 }} />
      <RiskDistributionCard analyses={recentAnalyses} />

      <View style={{ height: 16 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.onBackground }}>Saved Analysis Activity</Text>
        {recentAnalyses.length > 0 ? (
          <Pressable onPress={onNavigateToHistory} style={{ paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>View History</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ height: 12 }} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard testID="metric_total_analyses" title="Saved Analyses" value={hasData ? String(metrics.totalAnalyses) : '0'} subtitle={hasData ? 'Evaluated prompts' : 'No saved analyses'} icon="Analytics" accent={t.primary} />
        <MetricCard testID="metric_avg_risk" title="Avg Risk Profile" value={hasData ? `${metrics.averageRiskScore}/100` : '—'} subtitle={hasData ? 'Aggregate score' : 'Awaiting runs'} icon="Shield" accent={avgRiskAccent} />
      </View>
      <View style={{ height: 10 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard testID="metric_avg_coverage" title="Avg Coverage" value={hasData ? `${metrics.averageCoverage}%` : '—'} subtitle={hasData ? 'Controls present' : 'Awaiting runs'} icon="VerifiedUser" accent={t.primary} />
        <MetricCard testID="metric_high_risk" title="Elevated Risks" value={hasData ? String(metrics.highRiskCount) : '0'} subtitle={hasData ? 'Critical / High' : 'Clean profile'} icon="Warning" accent={RISK.HIGH} />
      </View>

      <View style={{ height: 20 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.onBackground }}>Recent Analyses</Text>
      <View style={{ height: 12 }} />

      {recentAnalyses.length === 0 ? (
        <Card style={{ padding: 28, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Security" size={24} color={t.primary} />
          </View>
          <View style={{ height: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>No analyses recorded yet</Text>
          <View style={{ height: 4 }} />
          <Text style={{ fontSize: 12, color: t.onSurfaceVariant, textAlign: 'center' }}>
            Evaluate your first AWS infrastructure prompt to detect risky patterns and missing security controls.
          </Text>
          <View style={{ height: 16 }} />
          <Pressable
            onPress={onStartAnalysis}
            style={({ pressed }) => ({ borderRadius: 10, backgroundColor: t.primary, paddingHorizontal: 20, paddingVertical: 10, opacity: pressed ? 0.9 : 1 })}
          >
            <Text style={{ color: t.onPrimary, fontWeight: '700' }}>Run First Analysis</Text>
          </Pressable>
        </Card>
      ) : (
        recentAnalyses.slice(0, 5).map((item) => <RecentRow key={item.id} item={item} onPress={onReopenAnalysis} />)
      )}
    </ScrollView>
  );
}
