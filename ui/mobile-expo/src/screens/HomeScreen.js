import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTheme, riskColor, riskLabel } from '../theme';
import { Card, MetricCard, RiskScoreBadge, Icon } from '../ui';

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
          {`Coverage: ${item.securityCoverage}%  •  ${item.detectedResources.length} Resources`}
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

export default function HomeScreen({ metrics, recentAnalyses, onStartAnalysis, onReopenAnalysis }) {
  const t = useTheme();
  const hasData = metrics.totalAnalyses > 0;
  const avgRiskAccent = metrics.averageRiskScore >= 60 ? '#B94D42' : '#D1B653';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={{ backgroundColor: t.darkTeal, borderRadius: 20, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ borderRadius: 12, backgroundColor: 'rgba(209,182,83,0.2)', borderWidth: 1, borderColor: 'rgba(209,182,83,0.4)', paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#D1B653', letterSpacing: 1 }}>AWS PRE-GENERATION DIAGNOSIS</Text>
          </View>
          <Icon name="Security" size={24} color="#D1B653" />
        </View>
        <View style={{ height: 14 }} />
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF' }}>Vector</Text>
        <View style={{ height: 4 }} />
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 }}>
          Secure your infrastructure prompts before code generation.
        </Text>
        <View style={{ height: 18 }} />
        <Pressable
          testID="home_new_analysis_button"
          onPress={onStartAnalysis}
          style={({ pressed }) => ({ height: 48, borderRadius: 12, backgroundColor: '#D1B653', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1 })}
        >
          <Icon name="Analytics" size={18} color="#30494B" />
          <View style={{ width: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#30494B' }}>New Security Analysis</Text>
        </Pressable>
      </View>

      <View style={{ height: 16 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.onBackground }}>Security Diagnosis Metrics</Text>
      <View style={{ height: 12 }} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard testID="metric_total_analyses" title="Total Analyses" value={hasData ? String(metrics.totalAnalyses) : '—'} subtitle={hasData ? 'Evaluated prompts' : 'No analyses yet'} icon="Analytics" accent="#49686C" />
        <MetricCard testID="metric_avg_risk" title="Avg Risk Score" value={hasData ? `${metrics.averageRiskScore}/100` : '—'} subtitle={hasData ? 'Risk profile' : 'No data'} icon="Shield" accent={avgRiskAccent} />
      </View>
      <View style={{ height: 10 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard testID="metric_avg_coverage" title="Avg Security Coverage" value={hasData ? `${metrics.averageCoverage}%` : '—'} subtitle={hasData ? 'Controls present' : 'No data'} icon="VerifiedUser" accent="#49686C" />
        <MetricCard testID="metric_high_risk" title="High-Risk Analyses" value={hasData ? String(metrics.highRiskCount) : '—'} subtitle={hasData ? 'Critical / High' : 'No data'} icon="Warning" accent="#B94D42" />
      </View>

      <View style={{ height: 20 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.onBackground }}>Recent Analyses</Text>
      <View style={{ height: 12 }} />

      {recentAnalyses.length === 0 ? (
        <Card style={{ padding: 28, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Info" size={24} color={t.onSurfaceVariant} />
          </View>
          <View style={{ height: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>No analyses recorded</Text>
          <View style={{ height: 4 }} />
          <Text style={{ fontSize: 12, color: t.onSurfaceVariant, textAlign: 'center' }}>
            Run your first AWS prompt analysis to evaluate security findings and coverage.
          </Text>
          <View style={{ height: 16 }} />
          <Pressable
            onPress={onStartAnalysis}
            style={({ pressed }) => ({ borderRadius: 10, backgroundColor: t.primary, paddingHorizontal: 20, paddingVertical: 10, opacity: pressed ? 0.9 : 1 })}
          >
            <Text style={{ color: t.onPrimary, fontWeight: '700' }}>Run Analysis</Text>
          </Pressable>
        </Card>
      ) : (
        recentAnalyses.slice(0, 5).map((item) => <RecentRow key={item.id} item={item} onPress={onReopenAnalysis} />)
      )}
    </ScrollView>
  );
}
