import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Modal } from 'react-native';
import { useTheme, riskColor, alpha } from '../theme';
import { Card, RiskScoreBadge, Icon, FilterChip, PrimaryButton, OutlinedButton } from '../components';

const FILTERS = [
  { key: null, label: 'All' },
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'HIGH', label: 'High' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
];

function HistoryItem({ item, onReopen, onDelete }) {
  const t = useTheme();
  const date = new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <Card onPress={() => onReopen(item)} style={{ padding: 14, borderRadius: 14, marginBottom: 10 }} testID={'history_card_' + item.id}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RiskScoreBadge score={item.riskScore} level={item.riskLevel} />
        <Pressable onPress={() => onDelete(item.id)} hitSlop={8} style={{ padding: 4 }}>
          <Icon name="Delete" size={16} color={t.onSurfaceVariant} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={{ marginTop: 8, fontSize: 14, fontWeight: '500', color: t.onSurface }}>
        {item.prompt}
      </Text>
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ flexShrink: 1, fontSize: 11, color: t.onSurfaceVariant }}>
          {`${date}  â€¢  ${item.securityCoverage}% coverage`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>Reopen</Text>
          <View style={{ width: 4 }} />
          <Icon name="ArrowForward" size={14} color={t.primary} />
        </View>
      </View>
    </Card>
  );
}

export default function HistoryScreen({
  analyses,
  searchQuery,
  filterRisk,
  sortOrder,
  onSearchChange,
  onFilterRiskChange,
  onSortChange,
  onReopen,
  onDelete,
  onClear,
  onNavigateToAnalyze,
}) {
  const t = useTheme();
  const [confirmClear, setConfirmClear] = useState(false);
  const searching = searchQuery.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: t.onBackground }}>Analysis History</Text>
          <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>{analyses.length} saved record(s)</Text>
        </View>
        {analyses.length > 0 ? (
          <Pressable testID="clear_history_icon_button" onPress={() => setConfirmClear(true)} hitSlop={8} style={{ padding: 6 }}>
            <Icon name="Delete" size={20} color={t.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ height: 12 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.outline, borderRadius: 12, backgroundColor: t.surface, paddingHorizontal: 10 }}>
        <Icon name="Search" size={18} color={t.onSurfaceVariant} />
        <TextInput
          testID="history_search_input"
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Filter past analyses by prompt keyword..."
          placeholderTextColor={t.onSurfaceVariant + '99'}
          style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: t.onSurface, fontSize: 14 }}
        />
        {searching ? (
          <Pressable onPress={() => onSearchChange('')} hitSlop={8} style={{ padding: 4 }}>
            <Icon name="Clear" size={18} color={t.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ height: 10 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
        {FILTERS.map((f) => (
          <FilterChip
            key={String(f.key)}
            label={f.key === null ? `All (${analyses.length})` : f.label}
            selected={filterRisk === f.key}
            selectedBg={f.key ? alpha(riskColor(f.key), 0.18) : undefined}
            selectedFg={f.key ? riskColor(f.key) : undefined}
            onPress={() => onFilterRiskChange(filterRisk === f.key ? null : f.key)}
          />
        ))}
        <View style={{ width: 4 }} />
        <OutlinedButton compact label={sortOrder === 'NEWEST' ? 'Newest' : 'Highest Risk'} icon="Sort" onPress={() => onSortChange(sortOrder === 'NEWEST' ? 'HIGHEST_RISK' : 'NEWEST')} />
      </ScrollView>

      <View style={{ height: 12 }} />
      {analyses.length === 0 ? (
        <Card style={{ padding: 28, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="History" size={24} color={t.onSurfaceVariant} />
          </View>
          <View style={{ height: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>{searching ? 'No matching analyses found' : 'No saved analysis history'}</Text>
          <View style={{ height: 4 }} />
          <Text style={{ fontSize: 12, color: t.onSurfaceVariant, textAlign: 'center' }}>
            {searching ? 'Try adjusting your search keywords or risk severity filter.' : 'Your past AWS infrastructure prompt evaluations will appear here for auditing and re-analysis.'}
          </Text>
          <View style={{ height: 16 }} />
          <Pressable onPress={onNavigateToAnalyze} style={({ pressed }) => ({ borderRadius: 10, backgroundColor: t.primary, paddingHorizontal: 20, paddingVertical: 10, opacity: pressed ? 0.9 : 1 })}>
            <Text style={{ color: t.onPrimary, fontWeight: '700' }}>Start New Analysis</Text>
          </Pressable>
        </Card>
      ) : (
        analyses.map((item) => <HistoryItem key={item.id} item={item} onReopen={onReopen} onDelete={onDelete} />)
      )}

      <Modal visible={confirmClear} transparent animationType="fade" onRequestClose={() => setConfirmClear(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(40,54,56,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: t.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: t.outline }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.onSurface }}>Clear All History?</Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: t.onSurfaceVariant }}>
              This will permanently remove all saved analysis records from local storage. This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <Pressable onPress={() => setConfirmClear(false)} style={{ paddingHorizontal: 14, paddingVertical: 9 }}>
                <Text style={{ color: t.onSurfaceVariant, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirmClear(false);
                  onClear();
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, backgroundColor: '#B94D42' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Clear All</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
