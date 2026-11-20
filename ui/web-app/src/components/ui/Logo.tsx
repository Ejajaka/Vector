import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  /** Use the light mark on dark backgrounds. */
  inverted?: boolean;
}

/**
 * Vector mark — a restrained indigo squircle with a geometric V. The palette
 * follows the Linear-style accent so the brand reads as part of the product.
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
        <stop offset="0" stopColor="#5E6AD2" />
        <stop offset="1" stopColor="#828FFF" />
      </linearGradient>
    </defs>
    {inverted ? (
      <rect width="48" height="48" rx="11" fill="#FFFFFF" fillOpacity="0.10" />
    ) : (
      <rect width="48" height="48" rx="11" fill="url(#vector-mark)" />
    )}
    <path
      d="M13 13.5 L24 34.5 L35 13.5"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="5.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="24"
      cy="30"
      r="3.1"
      fill={inverted ? '#D0D6E0' : '#FFFFFF'}
      stroke={inverted ? '#08090A' : '#5E6AD2'}
      strokeWidth="1.4"
    />
  </svg>
);
