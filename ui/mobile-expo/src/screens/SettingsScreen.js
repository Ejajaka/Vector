import React from 'react';
import { ScrollView, View, Text, Switch, Pressable } from 'react-native';
import { useTheme, alpha } from '../theme';
import { Card, Icon, FilterChip } from '../components';

function CardHeader({ icon, title }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Icon name={icon} size={20} color={t.primary} />
      <View style={{ width: 8 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>{title}</Text>
    </View>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: alpha(t.outline, 0.5), marginVertical: 14 }} />;
}

export default function SettingsScreen({ themeMode, isOnline, isSimulated, onThemeModeChange, onToggleOffline, onOpenOnboarding, onOpenAbout }) {
  const t = useTheme();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: t.onBackground }}>Settings</Text>

      {/* About Vector */}
      <View style={{ height: 16 }} />
      <Card testID="settings_open_about_card" onPress={onOpenAbout} borderColor={t.primary} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Security" size={22} color={t.onPrimaryContainer} />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>About Vector</Text>
            <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>Product overview, analysis approach & responsible use guidelines.</Text>
          </View>
          <Icon name="ArrowForward" size={20} color={t.primary} />
        </View>
      </Card>

      {/* Appearance */}
      <View style={{ height: 16 }} />
      <Card style={{ padding: 16 }}>
        <CardHeader icon="BrightnessMedium" title="Appearance" />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FilterChip testID="theme_chip_system" label="System" selected={themeMode === 'SYSTEM'} onPress={() => onThemeModeChange('SYSTEM')} />
          <FilterChip testID="theme_chip_light" label="Light" icon="LightMode" selected={themeMode === 'LIGHT'} onPress={() => onThemeModeChange('LIGHT')} />
          <FilterChip testID="theme_chip_dark" label="Dark" icon="DarkMode" selected={themeMode === 'DARK'} onPress={() => onThemeModeChange('DARK')} />
        </View>
      </Card>

      {/* User Guide & Onboarding */}
      <View style={{ height: 16 }} />
      <Card testID="settings_open_onboarding_card" onPress={onOpenOnboarding} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="AutoStories" size={24} color={t.primary} />
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>User Guide & Onboarding</Text>
            <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>Revisit the 3-step workflow (Analyze, Review, and Improve Prompt).</Text>
          </View>
          <Icon name="ArrowForward" size={18} color={t.primary} />
        </View>
      </Card>

      {/* Analysis Engine */}
      <View style={{ height: 16 }} />
      <Card style={{ padding: 16 }}>
        <CardHeader icon="Tune" title="Analysis Engine" />
        <View style={{ height: 12 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurface }}>Core Rule-Based Engine</Text>
            <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>Runs on-device NLP pattern matching entirely offline.</Text>
          </View>
          <View style={{ borderRadius: 8, backgroundColor: t.primaryContainer, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.onPrimaryContainer }}>Active</Text>
          </View>
        </View>

        <Divider />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurface }}>Deep Scan Status</Text>
              <View style={{ width: 6 }} />
              <Icon name="Radar" size={16} color={t.onSurfaceVariant} />
            </View>
            <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>External IAM/CloudFormation policy verification is not configured. Local rule-based scanning is active.</Text>
          </View>
          <View style={{ borderRadius: 8, backgroundColor: t.surfaceVariant, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>Offline Only</Text>
          </View>
        </View>

        <Divider />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurface }}>Network Connection</Text>
              <View style={{ width: 6 }} />
              <Icon name={isOnline ? 'CloudDone' : 'CloudOff'} size={16} color={isOnline ? t.primary : t.error} />
            </View>
            <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>
              {isOnline ? 'Connected â€¢ Rule-based analysis and online checks ready.' : 'Offline â€¢ Rule-based analysis works offline. Deep scan is unavailable.'}
            </Text>
          </View>
          <View style={{ borderRadius: 8, backgroundColor: isOnline ? t.primaryContainer : t.errorContainer, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isOnline ? t.onPrimaryContainer : t.onErrorContainer }}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <Divider />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurface }}>Simulate Offline Mode</Text>
            <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>Simulate disconnected state to test offline indicator & deep scan restrictions.</Text>
          </View>
          <Switch testID="settings_simulate_offline_switch" value={!isOnline} onValueChange={(v) => onToggleOffline(v ? true : null)} trackColor={{ true: t.primary }} thumbColor="#FFFFFF" />
        </View>
      </Card>

      {/* JS Engine Integration */}
      <View style={{ height: 16 }} />
      <Card style={{ padding: 16 }}>
        <CardHeader icon="Code" title="JS Engine Integration Boundary" />
        <Text style={{ marginTop: 8, fontSize: 12, color: t.onSurfaceVariant, lineHeight: 18 }}>
          The screens are decoupled from the analysis runtime: the shared JavaScript engine functions are invoked directly, so identical results are produced across every Vector client.
        </Text>
        <View style={{ marginTop: 8, borderRadius: 8, backgroundColor: t.surfaceVariant, padding: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.onSurface }}>Upstream Core Methods Mapped:</Text>
          {['VectorAnalyzer.analyze(prompt, options)', 'VectorAnalyzer.mergeFindings(base, delta)', 'VectorAnalyzer.project(riskScore, clauses)', 'VectorAnalyzer.harden(prompt)'].map((m) => (
            <Text key={m} style={{ marginTop: 4, fontSize: 11, color: t.primary, fontFamily: 'monospace' }}>
              {'â€¢ ' + m}
            </Text>
          ))}
        </View>
      </Card>

      {/* About */}
      <View style={{ height: 16 }} />
      <Card style={{ padding: 16 }}>
        <CardHeader icon="Info" title="About Vector" />
        <Text style={{ marginTop: 8, fontSize: 14, color: t.onSurfaceVariant }}>
          Vector is an NLP-based pre-generation security diagnosis tool for AWS cloud infrastructure prompts. It identifies missing security controls and risky patterns before infrastructure code is generated.
        </Text>
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>Mobile App Version</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurface }}>0.8.0 (Expo / React Native)</Text>
        </View>
        <View style={{ height: 6 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>Analyzer Core</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.onSurface }}>Vector rule engine (engine/src)</Text>
        </View>
      </Card>
    </ScrollView>
  );
}
