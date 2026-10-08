import React from 'react';

interface SanjeevaniIconProps {
  className?: string;
}

/**
 * Original Sanjeevani AI Copilot Icon
 * Communicates AI + Healthcare + Intelligence using Sanjeevani's visual language:
 * - Outer protective guardian pulse ring
 * - Central rounded medical cross / life-leaf core
 * - Intelligent neural-node accents at the cardinal tips
 * Completely original vector artwork; does not resemble ChatGPT, Gemini, or MS Copilot logos.
 */
export const SanjeevaniCopilotIcon: React.FC<SanjeevaniIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer protective guardian shield-circle */}
    <path
      d="M14 2.5C7.64873 2.5 2.5 7.64873 2.5 14C2.5 20.3513 7.64873 25.5 14 25.5C20.3513 25.5 25.5 20.3513 25.5 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Medical cross + ECG pulse fusion in center */}
    <path
      d="M14 8V20M8 14H10.8L12.4 11.2L15.2 16.8L16.8 14H20"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* AI Intelligence neural node accents */}
    <circle cx="21.5" cy="6.5" r="2.2" fill="currentColor" />
    <circle cx="24.5" cy="10.2" r="1.2" fill="currentColor" />
    <circle cx="17.8" cy="3.8" r="1.2" fill="currentColor" />
  </svg>
);

/**
 * 1. Blood Test Reports Original Icon
 */
export const BloodReportIcon: React.FC<SanjeevaniIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2.75C12 2.75 6 9.5 6 14.25C6 17.7 8.69 20.5 12 20.5C15.31 20.5 18 17.7 18 14.25C18 9.5 12 2.75 12 2.75Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 14.5H14.5M12 12V17"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 2. X-Ray Reports Original Icon
 */
export const XRayReportIcon: React.FC<SanjeevaniIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4"
      y="3"
      width="16"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 6.5V17.5M8.5 9C9.8 9.8 14.2 9.8 15.5 9M8 12C9.6 12.8 14.4 12.8 16 12M9 15C10.2 15.6 13.8 15.6 15 15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 3. Scanning Reports Original Icon
 */
export const ScanReportIcon: React.FC<SanjeevaniIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 8V6C4 4.89543 4.89543 4 6 4H8M16 4H18C19.1046 4 20 4.89543 20 6V8M20 16V18C20 19.1046 19.1046 20 18 20H16M8 20H6C4.89543 20 4 19.1046 4 18V16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.9" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * 4. Vaccination Reports Original Icon
 */
export const VaccineReportIcon: React.FC<SanjeevaniIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 3L4.5 6.2V11.8C4.5 16.5 7.7 20.7 12 22C16.3 20.7 19.5 16.5 19.5 11.8V6.2L12 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M9.2 12.3L11.1 14.2L15 10.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 5. Medical History Reports Original Icon
 */
export const MedicalHistoryReportIcon: React.FC<SanjeevaniIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M7 3.5H14.5L18.5 7.5V19C18.5 20.1046 17.6046 21 16.5 21H7C5.89543 21 5 20.1046 5 19V5.5C5 4.39543 5.89543 3.5 7 3.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 11H15M8.5 14.5H15M8.5 18H12.5M10.5 7.5H13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 6. Shock Identifier Original Icon (Round 2)
 */
export const ShockIdentifierIcon: React.FC<SanjeevaniIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 7. Global Health Alerts Original Icon (Round 2)
 */
export const GlobalHealthAlertsIcon: React.FC<SanjeevaniIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M3.6 9H20.4M3.6 15H20.4M12 3C14.5 5.5 15.8 8.7 15.8 12C15.8 15.3 14.5 18.5 12 21C9.5 18.5 8.2 15.3 8.2 12C8.2 8.7 9.5 5.5 12 3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 8. Health Survey & Reward Streaks Original Icon (Round 2)
 */
export const RewardStreaksIcon: React.FC<SanjeevaniIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 9. Prescription Document Original Icon
 */
export const PrescriptionReportIcon: React.FC<SanjeevaniIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4.5"
      y="3"
      width="15"
      height="18"
      rx="2.8"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M8.5 7.5H12.2C13.4 7.5 14.2 8.2 14.2 9.2C14.2 10.2 13.4 10.9 12.2 10.9H8.5V7.5ZM8.5 10.9V14.5M11.5 11.2L15.5 16.5M15.5 11.8L11.5 16.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 10. Discharge Summary Original Icon
 */
export const DischargeSummaryIcon: React.FC<SanjeevaniIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6 3.5H14.5L18.5 7.5V19C18.5 20.1 17.6 21 16.5 21H6C4.9 21 4 20.1 4 19V5.5C4 4.4 4.9 3.5 6 3.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M11.25 8V13M8.75 10.5H13.75M8 16.5H14.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);
