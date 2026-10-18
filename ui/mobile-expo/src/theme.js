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
  surfaceVariant: '#F0EEE5',
  onSurfaceVariant: '#737A72',
  outline: '#E5E2D8',
  primary: '#49686C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E4EBDD',
  onPrimaryContainer: '#30494B',
  secondary: '#D1B653',
  secondaryContainer: '#F9F5E6',
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
  background: '#161E20',
  onBackground: '#F0F4F2',
  surface: '#202B2D',
  onSurface: '#F0F4F2',
  surfaceVariant: '#263336',
  onSurfaceVariant: '#A2ABA5',
  outline: '#2C3B3E',
  primary: '#6B9397',
  onPrimary: '#161E20',
  primaryContainer: '#30494B',
  onPrimaryContainer: '#E4EBDD',
  secondary: '#D1B653',
  secondaryContainer: '#3B3928',
  onSecondaryContainer: '#F7ECC2',
  error: '#E26D62',
  onError: '#FFFFFF',
  errorContainer: '#4A2320',
  onErrorContainer: '#F7D6D2',
  darkTeal: '#3B575A',
  mustard: '#E2C768',
  softGreen: '#1F2D21',
  logoBg: '#2D5D4F',
  logoFg: '#FACB43',
};

// Static risk palette (same in both themes, as in the Android client).
export const RISK = {
  CRITICAL: '#B94D42',
  HIGH: '#D35400',
  MEDIUM: '#D1B653',
  LOW: '#4A7C59',
  MINIMAL: '#4A7C59',
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
