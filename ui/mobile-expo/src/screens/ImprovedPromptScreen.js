import React from 'react';
import { ScrollView, View, Text, TextInput } from 'react-native';
import { useTheme } from '../theme';
import { Card, PrimaryButton, OutlinedButton, Icon, Tag } from '../components';

export default function ImprovedPromptScreen({ improvedPromptText, selectedClauseCount, onTextChanged, onResetToOriginal, onReanalyze, onCopy }) {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 24, fontWeight: '700', color: t.onBackground }}>Hardened Prompt Preview</Text>
      <View style={{ height: 4 }} />
      <Text style={{ fontSize: 14, color: t.onSurfaceVariant, lineHeight: 20 }}>
        {`Your prompt augmented with ${selectedClauseCount} selected security requirement clauses to enforce secure defaults prior to generation.`}
      </Text>

      <View style={{ height: 16 }} />
      <Card style={{ padding: 16, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E57368' }} />
            <View style={{ width: 5 }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.mustard }} />
            <View style={{ width: 5 }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} />
            <View style={{ width: 10 }} />
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: t.onSurfaceVariant }}>hardened-prompt.txt</Text>
          </View>
          <Tag label="Editable" />
        </View>
        <View style={{ height: 12 }} />
        <TextInput
          testID="improved_prompt_editor"
          value={improvedPromptText}
          onChangeText={onTextChanged}
          multiline
          style={{
            minHeight: 260,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.outline,
            backgroundColor: t.surfaceVariant,
            color: t.onSurface,
            padding: 12,
            fontSize: 13,
            lineHeight: 19,
            fontFamily: 'monospace',
            textAlignVertical: 'top',
          }}
        />
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: t.onSurfaceVariant }}>{improvedPromptText.length} characters</Text>
          <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>Edit freely before copying</Text>
        </View>
      </Card>

      <View style={{ height: 16 }} />
      <PrimaryButton testID="copy_improved_prompt_button" label="Copy Improved Prompt" icon="ContentCopy" bg={t.primary} fg={t.onPrimary} onPress={onCopy} />
      <View style={{ height: 10 }} />
      <PrimaryButton testID="reanalyze_button" label="Re-analyze Improved Prompt" icon="Replay" bg={t.mustard} fg={t.darkTeal} height={48} onPress={onReanalyze} />
      <View style={{ height: 10 }} />
      <OutlinedButton testID="reset_prompt_button" label="Reset to Original Prompt" icon="RestartAlt" onPress={onResetToOriginal} />
    </ScrollView>
  );
}
