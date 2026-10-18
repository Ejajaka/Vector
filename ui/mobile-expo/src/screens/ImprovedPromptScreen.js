import React from 'react';
import { ScrollView, View, Text, TextInput } from 'react-native';
import { useTheme } from '../theme';
import { Card, PrimaryButton, OutlinedButton, Icon, Tag } from '../ui';

export default function ImprovedPromptScreen({ improvedPromptText, selectedClauseCount, onTextChanged, onResetToOriginal, onReanalyze, onCopy }) {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 24, fontWeight: '700', color: t.onBackground }}>Improved Prompt</Text>
      <View style={{ height: 4 }} />
      <Text style={{ fontSize: 14, color: t.onSurfaceVariant }}>
        {`Original prompt hardened with ${selectedClauseCount} selected security requirement clauses.`}
      </Text>

      <View style={{ height: 16 }} />
      <Card style={{ padding: 16, borderRadius: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.onSurface }}>Hardened Prompt Preview</Text>
          <Tag label="Editable" />
        </View>
        <View style={{ height: 10 }} />
        <TextInput
          testID="improved_prompt_editor"
          value={improvedPromptText}
          onChangeText={onTextChanged}
          multiline
          style={{
            minHeight: 240,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.outline,
            backgroundColor: t.surfaceVariant,
            color: t.onSurface,
            padding: 12,
            fontSize: 13,
            lineHeight: 18,
            fontFamily: 'monospace',
            textAlignVertical: 'top',
          }}
        />
        <View style={{ height: 12 }} />
        <Text style={{ fontSize: 11, color: t.onSurfaceVariant }}>
          Tip: You can customize or edit clauses directly before copying or re-analyzing.
        </Text>
      </Card>

      <View style={{ height: 16 }} />
      <PrimaryButton testID="copy_improved_prompt_button" label="Copy Improved Prompt" icon="ContentCopy" bg="#49686C" fg="#FFFFFF" onPress={onCopy} />
      <View style={{ height: 10 }} />
      <PrimaryButton testID="reanalyze_button" label="Re-analyze Improved Prompt" icon="Replay" bg="#D1B653" fg="#30494B" height={48} onPress={onReanalyze} />
      <View style={{ height: 10 }} />
      <OutlinedButton testID="reset_prompt_button" label="Reset to Original Prompt" icon="RestartAlt" onPress={onResetToOriginal} />
    </ScrollView>
  );
}
