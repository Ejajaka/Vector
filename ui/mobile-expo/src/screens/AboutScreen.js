import React, { useEffect, useRef } from 'react';
import { ScrollView, View, Text, Pressable, Animated } from 'react-native';
import { useTheme, alpha } from '../theme';
import { Icon, PrimaryButton } from '../components';
import VectorLogo from '../VectorLogo';

const PROBLEM_BODY =
  'When developers or operators prompt AI or code generators for cloud infrastructure, requests typically focus on functional requirements (e.g. "create a public S3 bucket", "open SSH access", "connect EC2 to RDS").\n\n' +
  'Crucial non-functional security controls are routinely omitted: at-rest encryption, restrictive security groups, IMDSv2 tokens, least-privilege IAM roles, access logging, and secure defaults. Once code is generated, fixing misconfigurations requires expensive audits and refactoring.';

const STEPS = [
  { n: 1, title: 'Describe', desc: 'Provide a natural-language AWS infrastructure prompt.' },
  { n: 2, title: 'Analyze', desc: 'Examine it using the implemented NLP analysis and security rules.' },
  { n: 3, title: 'Identify', desc: 'Review detected risks and potentially missing controls.' },
  { n: 4, title: 'Improve', desc: 'Review recommendations and use the improved prompt where supported.' },
];

const VALUES = [
  { icon: 'Visibility', title: 'Understandable Findings', desc: 'Risk ratings, clear explanations, and plain-language summaries why each omitted control matters.' },
  { icon: 'CheckCircle', title: 'Practical Recommendations', desc: 'Actionable security clauses ready to insert into Terraform, CloudFormation, or CDK prompt templates.' },
  { icon: 'CloudDone', title: 'Transparent Analysis', desc: 'On-device deterministic pattern matching. No obscure black-box hallucinations or simulated metrics.' },
  { icon: 'Shield', title: 'Improved Security-Oriented Prompts', desc: 'One-click prompt augmentation that embeds concrete security constraints directly into your generative instructions.' },
];

const APPROACH_BODY =
  'Vector uses deterministic NLP and rule-based analysis to examine infrastructure prompts and identify supported AWS resources and security-related patterns.\n\n' +
  'All core pattern extraction, resource detection (EC2, S3, RDS, ALB, VPC, IAM), and severity classifications run 100% on-device. Prompts remain completely confidential and never leave your mobile device. Deep scanning is an optional simulated policy check that can operate when external simulation infrastructure is connected.';

const RESPONSIBLE_BODY =
  'Findings depend on the prompt text, supported AWS resources, implemented security rules, and available context. Prompt analysis cannot fully validate deployed infrastructure, runtime behaviour, network boundaries, or an entire AWS environment.\n\n' +
  'Always review recommendations, perform automated infrastructure-as-code linting (e.g., checkov, tfsec), and validate generated infrastructure prior to production deployment.';

function HeaderRow({ icon, tint, bg, title }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <View style={{ width: 10 }} />
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: t.onSurface }}>{title}</Text>
    </View>
  );
}

export default function AboutScreen({ onAnalyzePrompt }) {
  const t = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const steps = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.stagger(
      120,
      steps.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true })
      )
    ).start();
  }, []);

  const card = { backgroundColor: t.surface, borderWidth: 1, borderColor: t.outline, borderRadius: 18, padding: 18 };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ height: 4 }} />

      {/* HERO */}
      <View style={{ backgroundColor: t.darkTeal, borderRadius: 22, borderWidth: 1, borderColor: alpha(t.outline, 0.3), padding: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ borderRadius: 8, backgroundColor: alpha('#D1B653', 0.2), borderWidth: 1, borderColor: alpha('#D1B653', 0.45), paddingHorizontal: 9, paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#D1B653', letterSpacing: 1 }}>SECURITY DIAGNOSIS</Text>
          </View>
          <VectorLogo size={32} dark />
        </View>

        <View style={{ height: 18 }} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', lineHeight: 28 }}>
          Better infrastructure starts before the first line of code.
        </Text>
        <View style={{ height: 8 }} />
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 21 }}>
          Vector helps identify security gaps in AWS infrastructure prompts before they become part of generated infrastructure.
        </Text>

        <View style={{ height: 18 }} />
        <View style={{ borderRadius: 14, backgroundColor: '#1E2E30', borderWidth: 1, borderColor: alpha('#D1B653', 0.35), padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="EditNote" size={20} color="#FFFFFF" />
              </View>
              <View style={{ height: 4 }} />
              <Text style={{ fontSize: 10, color: '#FFFFFF', letterSpacing: 0.6 }}>Prompt</Text>
            </View>

            <Animated.View style={{ opacity: pulse }}>
              <Icon name="ArrowForward" size={16} color="#D1B653" />
            </Animated.View>

            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: alpha('#D1B653', 0.25), alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="Analytics" size={20} color="#D1B653" />
              </View>
              <View style={{ height: 4 }} />
              <Text style={{ fontSize: 10, color: '#D1B653', letterSpacing: 0.6 }}>NLP Rules</Text>
            </View>

            <Animated.View style={{ opacity: pulse }}>
              <Icon name="ArrowForward" size={16} color="#D1B653" />
            </Animated.View>

            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: alpha('#49686C', 0.4), alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="Shield" size={20} color="#FFFFFF" />
              </View>
              <View style={{ height: 4 }} />
              <Text style={{ fontSize: 10, color: '#FFFFFF', letterSpacing: 0.6 }}>Clauses</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
        <PrimaryButton testID="about_analyze_prompt_button" label="Analyze a Prompt" icon="Analytics" bg="#D1B653" fg="#30494B" onPress={onAnalyzePrompt} />
      </View>

      {/* PROBLEM */}
      <View style={{ height: 18 }} />
      <View style={card}>
        <HeaderRow icon="ReportProblem" tint="#B94D42" bg={alpha('#B94D42', 0.12)} title="Good prompts don't always mean secure infrastructure." />
        <View style={{ height: 12 }} />
        <Text style={{ fontSize: 14, color: t.onSurfaceVariant, lineHeight: 22 }}>{PROBLEM_BODY}</Text>
      </View>

      {/* HOW IT WORKS */}
      <View style={{ height: 18 }} />
      <View style={card}>
        <HeaderRow icon="Tune" tint={t.primary} bg={alpha(t.primary, 0.12)} title="How Vector Works" />
        <View style={{ height: 14 }} />
        {STEPS.map((s, i) => (
          <View key={s.n}>
            <Animated.View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                opacity: steps[i],
                transform: [{ translateY: steps[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: t.onPrimaryContainer }}>{s.n}</Text>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>{`${s.n}. ${s.title}`}</Text>
                <View style={{ height: 2 }} />
                <Text style={{ fontSize: 12, color: t.onSurfaceVariant, lineHeight: 17 }}>{s.desc}</Text>
              </View>
            </Animated.View>
            {i < STEPS.length - 1 ? (
              <View style={{ width: 2, height: 18, marginLeft: 15, marginVertical: 4, backgroundColor: alpha(t.outline, 0.5) }} />
            ) : null}
          </View>
        ))}
      </View>

      {/* WHAT MAKES IT USEFUL */}
      <View style={{ height: 18 }} />
      <View style={card}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>What Makes Vector Useful?</Text>
        <View style={{ height: 14 }} />
        {VALUES.map((v, i) => (
          <View key={v.title} style={{ marginTop: i === 0 ? 0 : 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={v.icon} size={18} color={t.onPrimaryContainer} />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>{v.title}</Text>
                <View style={{ height: 2 }} />
                <Text style={{ fontSize: 12, color: t.onSurfaceVariant, lineHeight: 18 }}>{v.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ANALYSIS APPROACH */}
      <View style={{ height: 18 }} />
      <View style={card}>
        <HeaderRow icon="PrivacyTip" tint={t.onPrimaryContainer} bg={t.primaryContainer} title="Analysis Approach" />
        <View style={{ height: 12 }} />
        <Text style={{ fontSize: 12, color: t.onSurfaceVariant, lineHeight: 19 }}>{APPROACH_BODY}</Text>
      </View>

      {/* RESPONSIBLE USE */}
      <View style={{ height: 18 }} />
      <View style={card}>
        <HeaderRow icon="Security" tint="#30494B" bg={alpha('#D1B653', 0.2)} title="A useful checkpoint, not a security guarantee." />
        <View style={{ height: 12 }} />
        <Text style={{ fontSize: 12, color: t.onSurfaceVariant, lineHeight: 19 }}>{RESPONSIBLE_BODY}</Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
