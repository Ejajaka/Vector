// Vector brand theme for the Expo (React Native) app.
// Mirrors the palette in the native Android client (ui/android Color.kt).
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

export const light = {
  mode: 'light',
  background: '#F6F4EC',
  onBackground: '#283638',
  surface: '#FFFFFF',
  onSurface: '#283638',
  surfaceVariant: '#EFECE2',
  onSurfaceVariant: '#737A72',
  outline: '#E5E2D8',
  outlineVariant: '#ECE9DF',
  primary: '#49686C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E4EBDD',
  onPrimaryContainer: '#30494B',
  secondary: '#D1B653',
  secondaryContainer: '#FBF8EE',
  onSecondaryContainer: '#283638',
  error: '#B94D42',
  onError: '#FFFFFF',
  errorContainer: '#F3D6D2',
  onErrorContainer: '#7A241C',
  darkTeal: '#30494B',
  mustard: '#D1B653',
  softGreen: '#E4EBDD',
  logoBg: '#2D5D4F',
  logoFg: '#FACB43',
};

export const dark = {
  mode: 'dark',
  background: '#141C1E',
  onBackground: '#F4F6F4',
  surface: '#1D282A',
  onSurface: '#F4F6F4',
  surfaceVariant: '#263538',
  onSurfaceVariant: '#A6AEA8',
  outline: '#2E3E42',
  outlineVariant: '#3B4B4F',
  primary: '#6F999D',
  onPrimary: '#141C1E',
  primaryContainer: '#49686C',
  onPrimaryContainer: '#E6EFE6',
  secondary: '#E2C969',
  secondaryContainer: '#33301E',
  onSecondaryContainer: '#F9ECA8',
  error: '#E57368',
  onError: '#141C1E',
  errorContainer: '#4A2320',
  onErrorContainer: '#F7D6D2',
  darkTeal: '#49686C',
  mustard: '#E2C969',
  softGreen: '#33463E',
  logoBg: '#2D5D4F',
  logoFg: '#FACB43',
};

// Accessible risk palette (matches the updated Android Color.kt).
export const RISK = {
  CRITICAL: '#B94D42',
  HIGH: '#C05621',
  MEDIUM: '#9E7D1B',
  LOW: '#2E6F40',
  MINIMAL: '#2E6F40',
};

// Segment colours used by the distribution chart / badges.
export const RISK_SEGMENT = {
  CRITICAL: '#B94D42',
  HIGH: '#C05621',
  MEDIUM: '#D1B653',
  LOW: '#2E6F40',
  MINIMAL: '#49686C',
};

export const RISK_LABEL = {
  CRITICAL: 'Critical Risk',
  HIGH: 'High Risk',
  MEDIUM: 'Medium Risk',
  LOW: 'Low Risk',
  MINIMAL: 'Minimal Risk',
};

// Engine severities (high/medium/low) -> UI risk key.
export function severityKey(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical') return 'CRITICAL';
  if (s === 'high') return 'HIGH';
  if (s === 'medium') return 'MEDIUM';
  if (s === 'low') return 'LOW';
  return 'MEDIUM';
}

export function riskColor(level) {
  return RISK[level] || RISK.LOW;
}

export function riskLabel(level) {
  return RISK_LABEL[level] || RISK_LABEL.LOW;
}

// hex + alpha helper (0..1)
export function alpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const ThemeContext = createContext(light);

export function ThemeProvider({ themeMode, children }) {
  const system = useColorScheme();
  const resolved = themeMode === 'light' ? light : themeMode === 'dark' ? dark : system === 'dark' ? dark : light;
  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
