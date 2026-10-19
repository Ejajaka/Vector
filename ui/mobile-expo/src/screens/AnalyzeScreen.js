import React from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { Card, PrimaryButton, OutlinedButton, Icon } from '../components';

export default function AnalyzeScreen({
  promptInput,
  inputError,
  isAnalyzing,
  examplePrompts,
  onPromptChange,
  onClearPrompt,
  onSelectExample,
  onAnalyze,
}) {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 24, fontWeight: '700', color: t.onBackground }}>New Security Diagnosis</Text>
      <View style={{ height: 4 }} />
      <Text style={{ fontSize: 14, color: t.onSurfaceVariant }}>
        Enter an AWS architecture prompt to examine resource configurations, detect dangerous exposures, and discover missing security controls.
      </Text>

      <View style={{ height: 16 }} />
      {/* Example prompts */}
      <Card style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="Lightbulb" size={18} color="#D1B653" />
          <View style={{ width: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>Sample Infrastructure Prompts</Text>
        </View>
        <View style={{ height: 10 }} />
        {examplePrompts.map((ex, i) => (
          <Pressable
            key={ex.id}
            testID={'example_chip_' + i}
            onPress={() => onSelectExample(ex.text)}
            style={({ pressed }) => ({
              backgroundColor: t.surfaceVariant,
              borderWidth: 1,
              borderColor: t.outline,
              borderRadius: 10,
              padding: 10,
              marginBottom: i === examplePrompts.length - 1 ? 0 : 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>{ex.title}</Text>
            <View style={{ height: 2 }} />
            <Text numberOfLines={2} style={{ fontSize: 12, color: t.onSurfaceVariant }}>
              {ex.text}
            </Text>
          </Pressable>
        ))}
      </Card>

      <View style={{ height: 16 }} />
      {/* Prompt input */}
      <Card style={{ padding: 16, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>AWS Infrastructure Prompt</Text>
          {promptInput.length > 0 ? (
            <Pressable testID="clear_prompt_button" onPress={onClearPrompt} hitSlop={8}>
              <Icon name="Clear" size={18} color={t.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ height: 8 }} />
        <TextInput
          testID="analyze_prompt_input"
          value={promptInput}
          onChangeText={onPromptChange}
          multiline
          placeholder="Describe your architecture (e.g., Create an S3 bucket for documents and deploy an EC2 instance behind an ALB with RDS database)..."
          placeholderTextColor={t.onSurfaceVariant + '99'}
          style={{
            minHeight: 180,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.outline,
            backgroundColor: t.surfaceVariant,
            color: t.onSurface,
            padding: 12,
            fontSize: 14,
            textAlignVertical: 'top',
          }}
        />
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>{promptInput.length} characters</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="CloudDone" size={14} color="#49686C" />
            <View style={{ width: 4 }} />
            <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>{"Deterministic NLP \u2022 Private & offline"}</Text>
          </View>
        </View>
        {inputError ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Icon name="Warning" size={16} color="#B94D42" />
            <View style={{ width: 6 }} />
            <Text style={{ flexShrink: 1, fontSize: 12, fontWeight: '500', color: '#B94D42' }}>{inputError}</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ height: 16 }} />
      <PrimaryButton
        testID="analyze_button"
        label={isAnalyzing ? 'Analyzing Security Requirements...' : 'Analyze Prompt'}
        icon={isAnalyzing ? null : 'Analytics'}
        loading={isAnalyzing}
        disabled={isAnalyzing}
        onPress={() => onAnalyze(false)}
      />
      <View style={{ height: 10 }} />
      <Pressable
        testID="deep_scan_button"
        onPress={() => onAnalyze(true)}
        disabled={isAnalyzing}
        style={({ pressed }) => ({
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#49686C',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isAnalyzing ? 0.6 : pressed ? 0.85 : 1,
        })}
      >
        <Icon name="Radar" size={18} color="#49686C" />
        <View style={{ width: 8 }} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#49686C' }}>Deep Scan (Simulated Policy Check)</Text>
      </Pressable>
    </ScrollView>
  );
}
