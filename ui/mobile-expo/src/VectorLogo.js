// Custom Vector brand mark: a geometric "V" with teal + mustard facets.
// Mirrors VectorLogo in ui/android VectorComponents.kt.
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from './theme';

export default function VectorLogo({ size = 28, dark = false }) {
  const t = useTheme();
  const teal = dark ? (t.mode === 'dark' ? '#6F999D' : '#49686C') : t.primary;
  const yellow = dark ? (t.mode === 'dark' ? '#E2C969' : '#D1B653') : t.mustard;
  const deep = dark ? (t.mode === 'dark' ? '#8AB4B8' : '#30494B') : t.darkTeal;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M12,16 L36,16 L50,78 L34,78 Z" fill={teal} />
      <Path d="M64,16 L88,16 L58,84 L44,84 Z" fill={yellow} />
      <Circle cx="50" cy="82" r="8" fill={deep} />
    </Svg>
  );
}
