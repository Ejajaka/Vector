// Shared Vector UI components (React Native). Mirrors the Android design system.
// NOTE: named components.js (not ui.js) because tools/sync-engine.ps1 deletes
// ui.js from this folder (it is the DOM renderer in engine/src).
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Switch, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, RISK, RISK_SEGMENT, riskColor, riskLabel, alpha } from './theme';

export function Icon({ name, size = 20, color, style }) {
  const t = useTheme();
  const glyph = String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return <MaterialIcons name={glyph} size={size} color={color || t.onSurface} style={style} />;
}

export function Card({ children, style, onPress, borderColor, bg, testID }) {
  const t = useTheme();
  const content = (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: bg || t.surface,
          borderWidth: 1,
          borderColor: borderColor || t.outline,
          borderRadius: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {content}
    </Pressable>
  );
}

export function SectionTitle({ children, style }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 16, fontWeight: '700', color: t.onBackground }, style]}>{children}</Text>;
}

export function PrimaryButton({ label, icon, onPress, disabled, loading, height = 50, bg, fg, testID, style }) {
  const t = useTheme();
  const background = bg || t.primary;
  const color = fg || t.onPrimary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height,
          borderRadius: 12,
          backgroundColor: background,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.7 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : icon ? <Icon name={icon} size={18} color={color} /> : null}
      {loading || icon ? <View style={{ width: 8 }} /> : null}
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function OutlinedButton({ label, icon, onPress, disabled, height = 48, compact, testID, style }) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: compact ? 32 : height,
          borderRadius: compact ? 8 : 12,
          borderWidth: 1,
          borderColor: t.outline,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: compact ? 10 : 16,
          opacity: disabled ? 0.7 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={compact ? 14 : 18} color={t.primary} /> : null}
      {icon ? <View style={{ width: compact ? 4 : 8 }} /> : null}
      <Text style={{ color: t.primary, fontSize: compact ? 12 : 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function MetricCard({ title, value, subtitle, icon, accent, testID }) {
  const t = useTheme();
  const color = accent || t.primary;
  return (
    <View
      testID={testID}
      style={{ flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.outline, borderRadius: 16, padding: 14 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 12, fontWeight: '600', color: t.onSurfaceVariant }}>
          {title}
        </Text>
        {icon ? (
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: alpha(color, 0.12), alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={16} color={color} />
          </View>
        ) : null}
      </View>
      <View style={{ height: 10 }} />
      <Text style={{ fontSize: 24, fontWeight: '700', color: t.onSurface }}>{value}</Text>
      {subtitle ? <Text style={{ marginTop: 2, fontSize: 11, color: t.onSurfaceVariant }}>{subtitle}</Text> : null}
    </View>
  );
}

export function RiskScoreBadge({ score, level, style }) {
  const t = useTheme();
  const color = riskColor(level);
  const bg =
    level === 'CRITICAL' || level === 'HIGH'
      ? alpha(color, 0.15)
      : level === 'MEDIUM'
      ? alpha(t.mustard, 0.22)
      : t.softGreen;
  const textColor = level === 'LOW' || level === 'MINIMAL' ? RISK.LOW : color;
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', borderRadius: 10, backgroundColor: bg, borderWidth: 1, borderColor: alpha(textColor, 0.45), paddingHorizontal: 10, paddingVertical: 5 },
        style,
      ]}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: textColor }} />
      <View style={{ width: 6 }} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>
        {riskLabel(level)} ({score}/100)
      </Text>
    </View>
  );
}

export function AwsResourceChip({ name }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: t.surfaceVariant, borderWidth: 1, borderColor: t.outline, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Icon name="Cloud" size={15} color={t.primary} />
      <View style={{ width: 6 }} />
      <Text style={{ fontSize: 12, fontWeight: '500', color: t.onSurface }}>{name}</Text>
    </View>
  );
}

export function FilterChip({ label, selected, onPress, icon, selectedBg, selectedFg, testID }) {
  const t = useTheme();
  const bg = selected ? selectedBg || t.primaryContainer : 'transparent';
  const fg = selected ? selectedFg || t.onPrimaryContainer : t.onSurfaceVariant;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: selected ? alpha(fg, 0.5) : t.outline, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 6, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      {icon ? <View style={{ width: 4 }} /> : null}
      <Text style={{ fontSize: 12, fontWeight: selected ? '700' : '500', color: fg }}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color, track }) {
  const t = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: track || t.surfaceVariant, overflow: 'hidden' }}>
      <View style={{ height: 8, borderRadius: 4, width: clamped + '%', backgroundColor: color || t.primary }} />
    </View>
  );
}

// Aggregated finding severity distribution across all saved analyses.
export function riskDistribution(analyses) {
  const d = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  (analyses || []).forEach((a) => {
    (a.findings || []).forEach((f) => {
      if (d[f.severity] !== undefined) d[f.severity] += 1;
    });
  });
  const total = d.CRITICAL + d.HIGH + d.MEDIUM + d.LOW;
  return { ...d, total, totalAnalyses: (analyses || []).length };
}

export function RiskDistributionCard({ analyses }) {
  const t = useTheme();
  const dist = riskDistribution(analyses);
  const pct = (n) => (dist.total > 0 ? Math.round((n / dist.total) * 100) : 0);
  const rows = [
    { key: 'CRITICAL', label: 'Critical', color: RISK_SEGMENT.CRITICAL },
    { key: 'HIGH', label: 'High', color: RISK_SEGMENT.HIGH },
    { key: 'MEDIUM', label: 'Medium', color: RISK_SEGMENT.MEDIUM },
    { key: 'LOW', label: 'Low', color: RISK_SEGMENT.LOW },
  ];

  return (
    <View testID="risk_distribution_card" style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.outline, borderRadius: 16, padding: 16 }}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="PieChart" size={20} color={t.primary} />
          <View style={{ width: 8 }} />
          <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 16, fontWeight: '700', color: t.onSurface }}>
            Risk Findings Distribution
          </Text>
        </View>
        <View style={{ height: 6 }} />
        <View style={{ alignSelf: 'flex-start', borderRadius: 6, backgroundColor: t.surfaceVariant, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: t.onSurfaceVariant }}>{dist.total} findings</Text>
        </View>
      </View>

      <View style={{ height: 14 }} />
      {dist.total === 0 ? (
        <Text style={{ fontSize: 12, color: t.onSurfaceVariant, textAlign: 'center', paddingVertical: 12 }}>
          No findings recorded yet. Run an analysis to visualize your security risk profile.
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: t.surfaceVariant }}>
            {rows.map((r) =>
              dist[r.key] > 0 ? (
                <View key={r.key} style={{ flex: dist[r.key], height: 14, backgroundColor: r.color }} />
              ) : null
            )}
          </View>
          <View style={{ height: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {rows.map((r) => (
              <View key={r.key} style={{ flex: 1, paddingHorizontal: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color }} />
                  <View style={{ width: 4 }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: t.onSurfaceVariant }}>{r.label}</Text>
                </View>
                <Text style={{ marginTop: 2, fontSize: 16, fontWeight: '700', color: t.onSurface }}>{dist[r.key]}</Text>
                <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>{pct(dist[r.key])}%</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export function Tag({ label, bg, fg }) {
  const t = useTheme();
  return (
    <View style={{ borderRadius: 6, backgroundColor: bg || t.primaryContainer, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: fg || t.onPrimaryContainer }}>{label}</Text>
    </View>
  );
}

export function FindingCard({ finding, selected, onToggleSelect }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const color = riskColor(finding.severity);
  return (
    <Pressable onPress={() => setExpanded((s) => !s)}>
      <View
        testID={'finding_card_' + finding.id}
        style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: selected ? t.primary : t.outline, borderRadius: 16, padding: 16, marginBottom: 10 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <View style={{ borderRadius: 6, backgroundColor: alpha(color, 0.15), borderWidth: 1, borderColor: alpha(color, 0.45), paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color }}>{riskLabel(finding.severity)}</Text>
            </View>
            {finding.isAi ? (
              <>
                <View style={{ width: 6 }} />
                <View style={{ borderRadius: 6, backgroundColor: t.primaryContainer, borderWidth: 1, borderColor: alpha(t.primary, 0.45), paddingHorizontal: 6, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: t.onPrimaryContainer }}>AI</Text>
                </View>
              </>
            ) : null}
            {finding.affectedResource ? (
              <>
                <View style={{ width: 8 }} />
                <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 10, fontWeight: '600', color: t.onSurfaceVariant }}>
                  {finding.affectedResource}
                </Text>
              </>
            ) : null}
          </View>
          <Pressable onPress={() => setExpanded((s) => !s)} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="ExpandMore" size={22} color={t.onSurfaceVariant} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
          </Pressable>
        </View>

        <View style={{ height: 10 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>{finding.title}</Text>
        {finding.explanation ? (
          <Text style={{ marginTop: 4, fontSize: 14, color: t.onSurfaceVariant }}>{finding.explanation}</Text>
        ) : null}

        {finding.isSelectable ? (
          <Pressable onPress={onToggleSelect} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: selected ? t.primary : t.onSurfaceVariant,
                backgroundColor: selected ? t.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected ? <Icon name="Check" size={16} color="#FFFFFF" /> : null}
            </View>
            <View style={{ width: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: selected ? t.primary : t.onSurface }}>
              Add security clause to improved prompt
            </Text>
          </Pressable>
        ) : null}

        {expanded ? (
          <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: alpha(t.outline, 0.5), paddingTop: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurface }}>Why this matters:</Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: t.onSurfaceVariant, lineHeight: 18 }}>{finding.whyItMatters || '-'}</Text>
            <View style={{ height: 10 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>Recommended fix:</Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: t.onSurfaceVariant, lineHeight: 18 }}>{finding.recommendedFix || '-'}</Text>
            <View style={{ height: 10 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurface }}>Recommended security clause:</Text>
            <View style={{ marginTop: 4, borderRadius: 8, backgroundColor: t.surfaceVariant, borderWidth: 1, borderColor: t.outline, padding: 10 }}>
              <Text style={{ fontSize: 12, color: t.onSurface, fontFamily: 'monospace', lineHeight: 17 }}>{finding.securityClause || '-'}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Snackbar({ message }) {
  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.snackbar}>
      <Text style={styles.snackbarText}>{message}</Text>
    </View>
  );
}

export function NetworkIndicator({ online, simulated, onPress }) {
  const t = useTheme();
  const bg = online ? t.surface : alpha(t.mustard, 0.18);
  const borderColor = online ? t.outline : t.mustard;
  const dot = online ? RISK.LOW : t.error;
  return (
    <Pressable testID="network_status_indicator" onPress={onPress} style={({ pressed }) => ({ marginHorizontal: 16, marginTop: 8, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ borderRadius: 12, backgroundColor: bg, borderWidth: 1, borderColor, paddingHorizontal: 12, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} />
            <View style={{ width: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: online ? t.onSurface : t.darkTeal }}>
              {online ? 'Online' : 'Offline Mode Active'}
            </Text>
            {simulated ? (
              <>
                <View style={{ width: 8 }} />
                <View style={{ borderRadius: 6, backgroundColor: t.surfaceVariant, paddingHorizontal: 4, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: t.onSurfaceVariant }}>SIMULATED</Text>
                </View>
              </>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name={online ? 'CloudDone' : 'CloudOff'} size={16} color={online ? t.primary : t.darkTeal} />
            <View style={{ width: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: t.primary }}>Info</Text>
          </View>
        </View>
        <View style={{ height: 3 }} />
        <Text style={{ fontSize: 11, color: online ? t.onSurfaceVariant : t.darkTeal }}>
          {online
            ? 'Rule-based analysis ready • Deep Scan standby'
            : 'Rule-based analysis is available offline • Deep scan is unavailable'}
        </Text>
      </View>
    </Pressable>
  );
}

export function NetworkDialog({ visible, online, simulated, onClose, onToggleOffline }) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBackdrop}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: t.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: t.outline }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name={online ? 'CloudDone' : 'CloudOff'} size={24} color={online ? RISK.LOW : t.error} />
            <View style={{ width: 10 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.onSurface }}>{online ? 'Network: Online' : 'Network: Offline'}</Text>
          </View>
          <View style={{ height: 14 }} />

          <View style={{ borderRadius: 12, backgroundColor: t.surfaceVariant, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="CheckCircle" size={18} color={RISK.LOW} />
              <View style={{ width: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>Rule-Based Analysis: Active</Text>
            </View>
            <Text style={{ marginTop: 4, fontSize: 12, color: t.onSurfaceVariant, lineHeight: 16 }}>
              Vector's pre-generation pattern matcher and security rules run directly on-device using local NLP. Your prompts remain private without external transmission.
            </Text>
          </View>

          <View style={{ height: 12 }} />
          <View style={{ borderRadius: 12, backgroundColor: t.surfaceVariant, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="Radar" size={18} color={online ? t.primary : t.error} />
              <View style={{ width: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>
                {online ? 'Deep Scan: Requires Config' : 'Deep Scan: Unavailable Offline'}
              </Text>
            </View>
            <Text style={{ marginTop: 4, fontSize: 12, color: t.onSurfaceVariant, lineHeight: 16 }}>
              {online
                ? 'External policy simulation requires remote analyzers. Core rule-based diagnosis operates without configuration.'
                : 'Deep scanning requires an active network connection. Switch to online mode to enable deep scan.'}
            </Text>
          </View>

          <View style={{ height: 12 }} />
          <View style={{ height: 1, backgroundColor: alpha(t.outline, 0.5) }} />
          <View style={{ height: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurface }}>Simulate Offline Mode</Text>
              <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>Test Vector's offline experience on demand.</Text>
            </View>
            <Switch
              value={!online}
              onValueChange={(v) => onToggleOffline(v ? true : null)}
              trackColor={{ true: t.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ height: 16 }} />
          <PrimaryButton label="Got It" onPress={onClose} height={46} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 96,
    backgroundColor: '#30494B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  snackbarText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(40,54,56,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
});
