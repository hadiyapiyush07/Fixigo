// src/theme/typography.js
// Centralized Design System (Colors, Typography, Spacing, Shadows, etc.)

export const COLORS = {
  primary:        '#1D6AE5',
  primaryDark:    '#1455C0',
  primaryLight:   '#E8F0FD',
  secondary:      '#00B894',
  secondaryLight: '#E0F7F3',
  success:        '#00B894',
  successLight:   '#E0F7F3',
  warning:        '#FDCB6E',
  warningLight:   '#FEF3D7',
  error:          '#E74C3C',
  errorLight:     '#FDECEA',
  white:          '#FFFFFF',
  black:          '#000000',
  background:     '#F8F9FA',
  surface:        '#FFFFFF',
  border:         '#E9ECEF',
  divider:        '#F1F3F5',
  textPrimary:    '#1A1A2E',
  textSecondary:  '#6C757D',
  textTertiary:   '#ADB5BD',
  textDisabled:   '#CED4DA',
  textOnPrimary:  '#FFFFFF',
  star:           '#F39C12',
  shadow:         'rgba(0,0,0,0.08)',
  overlay:        'rgba(0,0,0,0.5)',
};

export const STATUS_COLORS = {
  pending:             { bg: '#FEF3D7', text: '#B7770D', border: '#FDCB6E' },
  confirmed:           { bg: '#E8F0FD', text: '#1455C0', border: '#1D6AE5' },
  provider_on_the_way: { bg: '#F3E8FD', text: '#6C3483', border: '#9B59B6' },
  arrived:             { bg: '#E0F7F3', text: '#007A63', border: '#00B894' },
  otp_verification:    { bg: '#FEF0E0', text: '#9A4E0A', border: '#E67E22' },
  in_progress:         { bg: '#FEF0E0', text: '#9A4E0A', border: '#E67E22' },
  completed:           { bg: '#E0F7F3', text: '#007A63', border: '#00B894' },
  cancelled:           { bg: '#FDECEA', text: '#C0392B', border: '#E74C3C' },
  rejected:            { bg: '#F5F6FA', text: '#636E72', border: '#95A5A6' },
};

// Aliased for backwards compatibility
export const BOOKING_STATUS_COLORS = STATUS_COLORS;

export const FONT_SIZES = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 28,
  huge: 34,
};

// Strict 8px grid
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
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  24,
  round: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: 'rgba(29, 38, 59, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(29, 38, 59, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(29, 38, 59, 0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
};