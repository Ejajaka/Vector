import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  /** Use the light mark on dark backgrounds. */
  inverted?: boolean;
}

/**
 * Vector 3.0 mark — a violet→cyan squircle with a geometric V and a coral
 * "prompt" node. Replaces the old flat teal tile.
 */
export const Logo: React.FC<LogoProps> = ({ size = 20, className = '', inverted = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className={className}
    role="img"
    aria-label="Vector"
  >
    <defs>
      <linearGradient id="vector-mark" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#7C5CFF" />
        <stop offset="0.55" stopColor="#4D7CFE" />
        <stop offset="1" stopColor="#22D3EE" />
      </linearGradient>
    </defs>
    {inverted ? (
      <rect width="48" height="48" rx="13" fill="#FFFFFF" fillOpacity="0.12" />
    ) : (
      <rect width="48" height="48" rx="13" fill="url(#vector-mark)" />
    )}
    <path
      d="M13 13.5 L24 34.5 L35 13.5"
      fill="none"
      stroke={inverted ? '#FFFFFF' : '#FFFFFF'}
      strokeWidth="5.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="30" r="3.1" fill={inverted ? '#22D3EE' : '#FFC53D'} stroke={inverted ? '#0B0E14' : '#FFFFFF'} strokeWidth="1.4" />
  </svg>
);
