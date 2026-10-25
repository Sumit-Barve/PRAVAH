import React from 'react';

/**
 * Indian National Tricolor Flag Component
 */
export const IndiaFlag: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = '',
  width = 24,
  height = 16,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-[2px] shadow-sm border border-slate-300 ${className}`}
      aria-label="Flag of India"
    >
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="10.66" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.5" fill="none" />
      <circle cx="12" cy="8" r="0.4" fill="#000080" />
      {/* 24 spokes representation */}
      <line x1="12" y1="5.8" x2="12" y2="10.2" stroke="#000080" strokeWidth="0.25" />
      <line x1="9.8" y1="8" x2="14.2" y2="8" stroke="#000080" strokeWidth="0.25" />
      <line x1="10.44" y1="6.44" x2="13.56" y2="9.56" stroke="#000080" strokeWidth="0.25" />
      <line x1="10.44" y1="9.56" x2="13.56" y2="6.44" stroke="#000080" strokeWidth="0.25" />
    </svg>
  );
};

/**
 * SAKSHAM / Technical Education Golden Seal & Emblem
 * Represents statutory authority, technical education excellence, and automated scrutiny.
 */
export const CouncilEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="AICTE PRAVAH Seal"
    >
      {/* Outer Golden Gear / Sun Ring */}
      <circle cx="32" cy="32" r="30" fill="#0A1B38" stroke="#D97706" strokeWidth="2" />
      <circle cx="32" cy="32" r="27.5" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2" />

      {/* Hexagonal Shield */}
      <polygon
        points="32,8 52,19 52,45 32,56 12,45 12,19"
        fill="#0F294D"
        stroke="#FBBF24"
        strokeWidth="1.75"
      />

      {/* Stylized Torch of Knowledge & Digital Verification Pillars */}
      <path
        d="M32 14L37 23H27L32 14Z"
        fill="#F59E0B"
      />
      <circle cx="32" cy="13" r="2.5" fill="#EF4444" />

      {/* Classical Temple / Institutional Pillars */}
      <rect x="23" y="27" width="3" height="15" rx="0.5" fill="#E2E8F0" />
      <rect x="30.5" y="27" width="3" height="15" rx="0.5" fill="#F8FAFC" />
      <rect x="38" y="27" width="3" height="15" rx="0.5" fill="#E2E8F0" />

      {/* Pedestal and Architrave */}
      <rect x="20" y="24" width="24" height="2.5" rx="0.5" fill="#FBBF24" />
      <rect x="18" y="42" width="28" height="3" rx="0.5" fill="#FBBF24" />

      {/* Green Compliance Badge Center */}
      <circle cx="32" cy="34" r="3" fill="#10B981" stroke="#064E3B" strokeWidth="0.75" />
    </svg>
  );
};
