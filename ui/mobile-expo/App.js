// Vector - React Native (Expo) client. UI ported to match the native Android
// client; every analysis comes from the shared rule engine (src/analyzer.js).
// No hardcoded/sample data.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';

import { ThemeProvider, useTheme } from './src/theme';
import { analyzePrompt, buildImprovedPrompt, eligibleClauseIds, metricsFrom, EXAMPLE_PROMPTS } from './src/vector';
import { loadHistory, addToHistory, deleteFromHistory, clearHistory } from './src/storage';
import { Icon, Snackbar, NetworkIndicator, NetworkDialog } from './src/components';

import HomeScreen from './src/screens/HomeScreen';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ImprovedPromptScreen from './src/screens/ImprovedPromptScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';

const TITLES = {
  HOME: { title: 'Vector', subtitle: 'AWS Cloud Security Diagnosis' },
  ANALYZE: { title: 'Analyze Prompt' },
  RESULTS: { title: 'Security Findings', subtitle: 'Pre-generation evaluation' },
  IMPROVED_PROMPT: { title: 'Improved Prompt', subtitle: 'Hardened requirements preview' },
  HISTORY: { title: 'Analysis History' },
  SETTINGS: { title: 'Settings' },
  ABOUT: { title: 'About Vector', subtitle: 'Architecture security diagnosis' },
  ONBOARDING: { title: 'Onboarding' },
};

const NAV = [
  { screen: 'HOME', label: 'Overview', icon: 'Home', testID: 'nav_home' },
  { screen: 'ANALYZE', label: 'Analyze', icon: 'Analytics', testID: 'nav_analyze' },
  { screen: 'HISTORY', label: 'History', icon: 'History', testID: 'nav_history' },
  { screen: 'SETTINGS', label: 'Settings', icon: 'Settings', testID: 'nav_settings' },
];

function TopBar({ title, subtitle, canBack, onBack }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.background, borderBottomWidth: 1, borderBottomColor: t.outline, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
      {canBack ? (
        <Pressable testID="top_bar_back_button" onPress={onBack} hitSlop={8} style={{ padding: 6, marginRight: 4 }}>
          <Icon name="ArrowBack" size={22} color={t.onBackground} />
        </Pressable>
      ) : null}
      <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: t.logoBg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.logoFg, fontWeight: '800', fontSize: 13 }}>V</Text>
      </View>
      <View style={{ width: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.onBackground }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function BottomBar({ current, onNavigate }) {
  const t = useTheme();
  const activeTab = current === 'RESULTS' || current === 'IMPROVED_PROMPT' ? 'ANALYZE' : (current === 'ABOUT' ? 'SETTINGS' : current);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.outline, paddingVertical: 8 }}>
      {NAV.map((item) => {
        const active = activeTab === item.screen;
        return (
          <Pressable
            key={item.screen}
            testID={item.testID}
            onPress={() => onNavigate(item.screen)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, backgroundColor: active ? t.primary : 'transparent' }}>
              <Icon name={item.icon} size={22} color={active ? '#FFFFFF' : t.onSurfaceVariant} />
            </View>
            <Text style={{ marginTop: 2, fontSize: 11, fontWeight: '500', color: active ? t.primary : t.onSurfaceVariant }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Shell({ themeMode, setThemeMode }) {
  const t = useTheme();

  const [screen, setScreen] = useState('ONBOARDING');
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);

  const [promptInput, setPromptInput] = useState('');
  const [inputError, setInputError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [improvedText, setImprovedText] = useState('');

  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState(null);
  const [sort, setSort] = useState('NEWEST');
  const [snackbar, setSnackbar] = useState(null);

  const online = !simulated;

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const flash = useCallback((msg) => {
    setSnackbar(msg);
    setTimeout(() => setSnackbar((cur) => (cur === msg ? null : cur)), 1800);
  }, []);

  const metrics = useMemo(() => metricsFrom(history), [history]);

  const filteredHistory = useMemo(() => {
    let list = history.slice();
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((x) => x.prompt.toLowerCase().includes(q));
    }
    if (filterRisk) list = list.filter((x) => x.riskLevel === filterRisk);
    list.sort((a, b) => (sort === 'HIGHEST_RISK' ? b.riskScore - a.riskScore : b.timestamp - a.timestamp));
    return list;
  }, [history, search, filterRisk, sort]);

  const selectedClauses = useCallback(
    (ids) => {
      if (!analysis) return [];
      return analysis.findings.filter((f) => ids.has(f.id) && f.isSelectable).map((f) => f.securityClause).filter(Boolean);
    },
    [analysis]
  );

  const refreshImproved = useCallback(
    (ids) => {
      if (!analysis) return;
      setImprovedText(buildImprovedPrompt(analysis.prompt, selectedClauses(ids)));
    },
    [analysis, selectedClauses]
  );

  const navigateTo = useCallback((next) => setScreen(next), []);

  const handleBack = useCallback(() => {
    if (screen === 'RESULTS' || screen === 'IMPROVED_PROMPT') setScreen('ANALYZE');
    else if (screen === 'ABOUT') setScreen('HOME');
    else if (screen === 'ONBOARDING' && onboardingCompleted) setScreen('HOME');
  }, [screen, onboardingCompleted]);

  const finishOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    setScreen('HOME');
  }, []);

  const runAnalysis = useCallback(
    async (text) => {
      const value = (text !== undefined ? text : promptInput).trim();
      if (!value) {
        setInputError('Please enter an AWS infrastructure prompt or select an example.');
        return;
      }
      setIsAnalyzing(true);
      setInputError(null);
      try {
        const result = analyzePrompt(value);
        setAnalysis(result);
        const ids = new Set(eligibleClauseIds(result));
        setSelectedIds(ids);
        setImprovedText(buildImprovedPrompt(result.prompt, result.findings.filter((f) => ids.has(f.id)).map((f) => f.securityClause)));
        const updated = await addToHistory(result);
        setHistory(updated);
        setScreen('RESULTS');
      } catch (e) {
        if (e.code === 'empty') setInputError(e.message);
        else flash('Analysis failed: ' + e.message);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [promptInput, flash]
  );

  const handleAnalyze = useCallback(
    (isDeepScan) => {
      if (isDeepScan && !online) {
        flash('Deep Scan is unavailable while offline. Executing on-device Rule-Based Analysis.');
        runAnalysis(undefined);
        return;
      }
      runAnalysis(undefined);
    },
    [online, flash, runAnalysis]
  );

  const selectExample = useCallback((text) => {
    setPromptInput(text);
    setInputError(null);
  }, []);

  const toggleClause = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        refreshImproved(next);
        return next;
      });
    },
    [refreshImproved]
  );

  const selectAll = useCallback(() => {
    if (!analysis) return;
    const ids = new Set(eligibleClauseIds(analysis));
    setSelectedIds(ids);
    refreshImproved(ids);
  }, [analysis, refreshImproved]);

  const clearAll = useCallback(() => {
    const ids = new Set();
    setSelectedIds(ids);
    refreshImproved(ids);
  }, [refreshImproved]);

  const reopen = useCallback(
    (item) => {
      setAnalysis(item);
      setPromptInput(item.prompt);
      const ids = new Set(eligibleClauseIds(item));
      setSelectedIds(ids);
      setImprovedText(buildImprovedPrompt(item.prompt, item.findings.filter((f) => ids.has(f.id)).map((f) => f.securityClause)));
      setScreen('RESULTS');
    },
    []
  );

  const deleteItem = useCallback(
    async (id) => {
      const updated = await deleteFromHistory(id);
      setHistory(updated);
      flash('Analysis deleted from history.');
    },
    [flash]
  );

  const clearAllHistory = useCallback(async () => {
    const updated = await clearHistory();
    setHistory(updated);
    flash('All analysis history cleared.');
  }, [flash]);

  const resetToOriginal = useCallback(() => {
    if (!analysis) return;
    setImprovedText(analysis.prompt);
    setSelectedIds(new Set());
  }, [analysis]);

  const reanalyze = useCallback(() => {
    const text = improvedText.trim();
    if (!text) return;
    setPromptInput(text);
    runAnalysis(text);
  }, [improvedText, runAnalysis]);

  const copyImproved = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(improvedText);
      flash('Improved prompt copied to clipboard!');
    } catch (e) {
      flash('Failed to copy to clipboard: ' + (e.message || 'unknown error'));
    }
  }, [improvedText, flash]);

  const toggleOffline = useCallback(
    (value) => {
      setSimulated(value === true);
      flash(value === true ? 'Switched to Offline mode.' : 'Switched to Online mode.');
    },
    [flash]
  );

  if (screen === 'ONBOARDING') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
        <OnboardingScreen onFinish={finishOnboarding} />
        <Snackbar message={snackbar} />
      </SafeAreaView>
    );
  }

  const meta = TITLES[screen] || TITLES.HOME;
  const canBack = screen === 'RESULTS' || screen === 'IMPROVED_PROMPT' || screen === 'ABOUT';
  const showNetworkIndicator = screen === 'HOME' || screen === 'ANALYZE' || screen === 'HISTORY';
  const showBottomBar = screen !== 'IMPROVED_PROMPT';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      <TopBar title={meta.title} subtitle={meta.subtitle} canBack={canBack} onBack={handleBack} />

      {showNetworkIndicator ? (
        <NetworkIndicator online={online} simulated={simulated} onPress={() => setShowNetwork(true)} />
      ) : null}

      <View style={{ flex: 1 }}>
        {screen === 'HOME' ? (
          <HomeScreen
            metrics={metrics}
            recentAnalyses={history}
            onStartAnalysis={() => navigateTo('ANALYZE')}
            onReopenAnalysis={reopen}
            onNavigateToHistory={() => navigateTo('HISTORY')}
            onNavigateToAbout={() => navigateTo('ABOUT')}
          />
        ) : null}
        {screen === 'ANALYZE' ? (
          <AnalyzeScreen
            promptInput={promptInput}
            inputError={inputError}
            isAnalyzing={isAnalyzing}
            examplePrompts={EXAMPLE_PROMPTS}
            onPromptChange={(v) => {
              setPromptInput(v);
              if (inputError) setInputError(null);
            }}
            onClearPrompt={() => {
              setPromptInput('');
              setInputError(null);
            }}
            onSelectExample={selectExample}
            onAnalyze={handleAnalyze}
          />
        ) : null}
        {screen === 'RESULTS' && analysis ? (
          <ResultsScreen
            analysis={analysis}
            selectedIds={selectedIds}
            onToggle={toggleClause}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            onNavigateToImproved={() => navigateTo('IMPROVED_PROMPT')}
            improvedText={improvedText}
            onSnackbar={flash}
          />
        ) : null}
        {screen === 'IMPROVED_PROMPT' ? (
          <ImprovedPromptScreen
            improvedPromptText={improvedText}
            selectedClauseCount={selectedIds.size}
            onTextChanged={setImprovedText}
            onResetToOriginal={resetToOriginal}
            onReanalyze={reanalyze}
            onCopy={copyImproved}
          />
        ) : null}
        {screen === 'HISTORY' ? (
          <HistoryScreen
            analyses={filteredHistory}
            searchQuery={search}
            filterRisk={filterRisk}
            sortOrder={sort}
            onSearchChange={setSearch}
            onFilterRiskChange={setFilterRisk}
            onSortChange={setSort}
            onReopen={reopen}
            onDelete={deleteItem}
            onClear={clearAllHistory}
            onNavigateToAnalyze={() => navigateTo('ANALYZE')}
          />
        ) : null}
        {screen === 'SETTINGS' ? (
          <SettingsScreen
            themeMode={themeMode}
            isOnline={online}
            isSimulated={simulated}
            onThemeModeChange={setThemeMode}
            onToggleOffline={toggleOffline}
            onOpenOnboarding={() => navigateTo('ONBOARDING')}
            onOpenAbout={() => navigateTo('ABOUT')}
          />
        ) : null}
        {screen === 'ABOUT' ? (
          <AboutScreen onAnalyzePrompt={() => navigateTo('ANALYZE')} />
        ) : null}
      </View>

      {showBottomBar ? <BottomBar current={screen} onNavigate={navigateTo} /> : null}

      <Snackbar message={snackbar} />
      <NetworkDialog visible={showNetwork} online={online} simulated={simulated} onClose={() => setShowNetwork(false)} onToggleOffline={toggleOffline} />
    </SafeAreaView>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState('SYSTEM');
  return (
    <ThemeProvider themeMode={themeMode}>
      <SafeAreaProvider>
        <Shell themeMode={themeMode} setThemeMode={setThemeMode} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
