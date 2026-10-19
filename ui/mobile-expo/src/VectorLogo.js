// Vector brand mark: a dark-green rounded tile (#2D5D4F) with a bold gold V
// (#FACB43) - the project's official logo.
import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

export default function VectorLogo({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="0" y="0" width="100" height="100" rx="24" fill="#2D5D4F" />
      <Path
        d="M30 30 L50 72 L70 30"
        stroke="#FACB43"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
