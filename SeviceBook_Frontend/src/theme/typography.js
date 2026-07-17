// src/theme/typography.js
// Premium SaaS Design System (Colors, Typography, Spacing, Shadows, etc.)

export const COLORS = {
  primary:        '#0F766E',
  secondary:      '#14B8A6',
  accent:         '#5EEAD4',
  background:     '#F8FAFC',
  surface:        '#FFFFFF',
  success:        '#22C55E',
  warning:        '#F59E0B',
  danger:         '#EF4444',
  error:          '#EF4444', // Alias for compatibility
  textPrimary:    '#111827',
  textSecondary:  '#6B7280',
  textTertiary:   '#9CA3AF',
  textDisabled:   '#D1D5DB',
  border:         '#E5E7EB',
  divider:        '#F1F5F9',
  white:          '#FFFFFF',
  black:          '#000000',
  star:           '#F59E0B',
  overlay:        'rgba(17, 24, 39, 0.4)', // Slightly darker soft overlay
  // Keep some light variants for backwards compatibility if needed
  primaryLight:   '#CCFBF1',
  secondaryLight: '#E0F7F3',
  successLight:   '#DCFCE7',
  warningLight:   '#FEF3C7',
  errorLight:     '#FEE2E2',
};

// Premium Pill status colors
export const STATUS_COLORS = {
  pending:             { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  confirmed:           { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  provider_on_the_way: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  arrived:             { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  otp_verification:    { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  in_progress:         { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  completed:           { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }, // Blue pill
  cancelled:           { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  rejected:            { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
};

export const BOOKING_STATUS_COLORS = STATUS_COLORS;

// Updated Modern Typography Hierarchy
export const FONT_SIZES = {
  xs:   10,
  sm:   12, // Small Label
  md:   14, // Caption
  lg:   16, // Body
  xl:   18, // Card Title
  xxl:  20, // Section Title
  xxxl: 28, // Screen Heading
  huge: 34,
};

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  40,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   18, // Buttons
  xxl:  24, // Cards
  round: 9999, // Pills
};

export const SHADOWS = {
  sm: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
};