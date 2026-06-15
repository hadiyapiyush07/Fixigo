// src/theme/typography.js
// All theme exports in ONE file — no import confusion

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

export const BOOKING_STATUS_COLORS = {
  pending:             { bg: '#FEF3D7', text: '#B7770D', border: '#FDCB6E' },
  confirmed:           { bg: '#E8F0FD', text: '#1455C0', border: '#1D6AE5' },
  provider_on_the_way: { bg: '#F3E8FD', text: '#6C3483', border: '#9B59B6' },
  in_progress:         { bg: '#FEF0E0', text: '#9A4E0A', border: '#E67E22' },
  completed:           { bg: '#E0F7F3', text: '#007A63', border: '#00B894' },
  cancelled:           { bg: '#FDECEA', text: '#C0392B', border: '#E74C3C' },
  rejected:            { bg: '#F5F6FA', text: '#636E72', border: '#95A5A6' },
};

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

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

export const BORDER_RADIUS = {
  sm:    6,
  md:    10,
  lg:    14,
  xl:    20,
  round: 50,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};