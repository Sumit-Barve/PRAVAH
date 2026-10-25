import React from 'react';

interface GeometricMarkProps {
  className?: string;
  size?: number;
}

/**
 * Custom neutral geometric identity mark for SAKSHAM.
 * Represents precision scrutiny, institutional stability, and structural compliance.
 * Original design that avoids copying any state emblem or copyrighted logo.
 */
export const GeometricMark: React.FC<GeometricMarkProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PRAVAH Identity Mark"
    >
      {/* Outer structural hexagon */}
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="#0A1B38"
        stroke="#1E3A8A"
        strokeWidth="1.5"
      />
      
      {/* Inner verification chevron & compass geometry */}
      <path
        d="M20 7L31 13.5V26.5L20 33L9 26.5V13.5L20 7Z"
        stroke="#F59E0B"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Center compliance precision dot / pillar */}
      <circle cx="20" cy="20" r="3.5" fill="#10B981" />
      <line x1="20" y1="11" x2="20" y2="15" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="25" x2="20" y2="29" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="20" x2="15.5" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24.5" y1="20" x2="28" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
