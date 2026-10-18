import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme';
import { Card, PrimaryButton, Icon } from '../ui';

const STEPS = [
  {
    badge: 'WELCOME TO VECTOR',
    title: 'Secure Cloud Infrastructure Prompts',
    subtitle:
      'Vector analyses natural-language AWS prompts before infrastructure code is generated, finding missing security controls and critical misconfigurations.',
    icon: 'Security',
    features: [
      { icon: 'Analytics', title: 'Pre-Generation Diagnosis', description: 'Intercept security gaps before Terraform, CDK, or CloudFormation templates are generated.' },
      { icon: 'Shield', title: 'Zero Deployment Risk', description: 'Analyzes your architectural prompt intent safely without connecting to live AWS credentials.' },
      { icon: 'CloudDone', title: 'Offline By Design', description: 'Core rule-based NLP security scanner runs 100% on-device with no external API dependency.' },
    ],
  },
  {
    badge: 'THE 3-STEP WORKFLOW',
    title: 'Analyze • Review • Improve',
    subtitle: 'Hardening your cloud infrastructure prompts takes just three seamless steps.',
    icon: 'Tune',
    features: [
      { icon: 'Analytics', title: '1. Enter AWS Prompt', description: 'Describe your architecture (EC2, S3, RDS, ALB, VPC) or choose from ready-to-test examples.' },
      { icon: 'Security', title: '2. Review Findings', description: 'Inspect your Risk Score, Security Coverage, and categorized Missing Controls vs Risky Statements.' },
      { icon: 'ContentCopy', title: '3. Add Security Clauses', description: 'Select recommended fixes to automatically append hardened security requirement clauses.' },
    ],
  },
  {
    badge: 'INTELLIGENT DIAGNOSIS',
    title: 'History, Metrics & Re-Analysis',
    subtitle: 'Track your security improvements over time and verify prompt hardening with instantaneous re-scanning.',
    icon: 'History',
    features: [
      { icon: 'History', title: 'Audit History & Search', description: 'Browse past analyses, filter by risk severity (Critical, High, Medium, Low), or reopen results.' },
      { icon: 'CheckCircle', title: 'Re-analyze Hardened Prompts', description: 'Submit your improved prompt with security clauses and watch your risk score drop from 90+ down to low risk.' },
      { icon: 'Lock', title: 'One-Click Clipboard Export', description: 'Copy your fully hardened prompt directly into your AI generator or infrastructure tooling.' },
    ],
  },
  {
    badge: 'READY TO START',
    title: 'Safeguard Your Cloud Today',
    subtitle: 'You are all set to evaluate your AWS prompts and prevent costly cloud data exposures.',
    icon: 'RocketLaunch',
    features: [
      { icon: 'VerifiedUser', title: 'Offline Rule Engine Active', description: 'Your local rule-based analysis engine is primed and ready to evaluate prompts anytime.' },
      { icon: 'Tune', title: 'Revisit Anytime', description: 'You can access this guide, explore sample data, or toggle dark mode anytime in Settings.' },
    ],
  },
];

export default function OnboardingScreen({ onFinish }) {
  const t = useTheme();
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: t.background, paddingHorizontal: 20, paddingVertical: 16, justifyContent: 'space-between' }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderWidth: 1, borderColor: t.outline, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} />
          <View style={{ width: 6 }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, letterSpacing: 1 }}>VECTOR</Text>
        </View>
        {!isLast ? (
          <Pressable testID="onboarding_skip_button" onPress={onFinish} hitSlop={8} style={{ padding: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurfaceVariant }}>Skip</Text>
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderRadius: 8, backgroundColor: t.darkTeal, borderWidth: 1, borderColor: 'rgba(209,182,83,0.4)', paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D1B653', letterSpacing: 1 }}>{step.badge}</Text>
        </View>
        <View style={{ height: 16 }} />
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: t.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={step.icon} size={42} color={t.primary} />
        </View>
        <View style={{ height: 16 }} />
        <Text style={{ fontSize: 24, fontWeight: '700', color: t.onBackground, textAlign: 'center' }}>{step.title}</Text>
        <View style={{ height: 8 }} />
        <Text style={{ fontSize: 14, color: t.onSurfaceVariant, lineHeight: 22, textAlign: 'center', paddingHorizontal: 12 }}>{step.subtitle}</Text>
        <View style={{ height: 20 }} />
        <View style={{ width: '100%', gap: 10 }}>
          {step.features.map((f) => (
            <Card key={f.title} style={{ padding: 14, borderRadius: 14 }} borderColor={t.outline}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={f.icon} size={20} color={t.onPrimaryContainer} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>{f.title}</Text>
                  <View style={{ height: 3 }} />
                  <Text style={{ fontSize: 12, color: t.onSurfaceVariant, lineHeight: 18 }}>{f.description}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Bottom controls */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{ width: i === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? t.primary : 'rgba(229,226,216,0.5)' }}
            />
          ))}
        </View>
        <View style={{ height: 18 }} />
        {isLast ? (
          <PrimaryButton
            testID="onboarding_get_started_button"
            label="Get Started & Go to Home"
            icon="RocketLaunch"
            bg="#D1B653"
            fg="#30494B"
            height={52}
            style={{ width: '100%' }}
            onPress={onFinish}
          />
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            {index > 0 ? (
              <Pressable
                testID="onboarding_previous_button"
                onPress={() => setIndex((i) => Math.max(0, i - 1))}
                style={({ pressed }) => ({ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: t.outline, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.primary }}>Previous</Text>
              </Pressable>
            ) : null}
            <Pressable
              testID="onboarding_next_button"
              onPress={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              style={({ pressed }) => ({ flex: index > 0 ? 1.5 : 1, height: 50, borderRadius: 12, backgroundColor: t.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1 })}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Next</Text>
              <View style={{ width: 6 }} />
              <Icon name="ArrowForward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
        <View style={{ height: 10 }} />
      </View>
    </View>
  );
}
