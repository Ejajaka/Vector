import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  /** Use the dark mark on light backgrounds. */
  inverted?: boolean;
}

/**
 * Vector mark — the dot-built V. The 48-unit grid is a direct scale of the
 * master artwork so the header, auth screen and favicon read as one brand.
 */
const DOTS: Array<[number, number]> = [
  [16.03, 18.58],
  [19.86, 18.58],
  [28.26, 18.58],
  [32.05, 18.58],
  [18.62, 22.37],
  [22.41, 22.37],
  [26.21, 22.37],
  [30.0, 22.37],
  [20.52, 26.17],
  [24.31, 26.17],
  [28.1, 26.17],
  [24.31, 29.96],
];

export const Logo: React.FC<LogoProps> = ({ size = 20, className = '', inverted = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className={className}
    role="img"
    aria-label="Vector"
    fill={inverted ? '#08090A' : '#FFFFFF'}
  >
    {DOTS.map(([cx, cy], index) => (
      <circle key={index} cx={cx} cy={cy} r={1.51} />
    ))}
  </svg>
);
