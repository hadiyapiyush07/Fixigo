/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: src/theme/colors.js
PURPOSE: All colors used across the entire app.
Change colors here → updates everywhere.
Urban Company uses purple. We use a clean blue-green.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

export const COLORS = {
  // ── Primary brand color ──────────────────────
  primary:        '#1D6AE5',   // main blue
  primaryDark:    '#1455C0',
  primaryLight:   '#E8F0FD',

  // ── Secondary accent ─────────────────────────
  secondary:      '#00B894',   // green
  secondaryLight: '#E0F7F3',

  // ── Status colors ────────────────────────────
  success:        '#00B894',
  successLight:   '#E0F7F3',
  warning:        '#FDCB6E',
  warningLight:   '#FEF3D7',
  error:          '#E74C3C',
  errorLight:     '#FDECEA',
  info:           '#3498DB',
  infoLight:      '#EBF5FB',

  // ── Booking status colors ────────────────────
  statusPending:          '#FDCB6E',
  statusConfirmed:        '#1D6AE5',
  statusOnTheWay:         '#9B59B6',
  statusInProgress:       '#E67E22',
  statusCompleted:        '#00B894',
  statusCancelled:        '#E74C3C',
  statusRejected:         '#95A5A6',

  // ── Neutral / grays ──────────────────────────
  white:          '#FFFFFF',
  black:          '#000000',
  background:     '#F8F9FA',   // app background
  surface:        '#FFFFFF',   // card background
  border:         '#E9ECEF',
  divider:        '#F1F3F5',

  // ── Text colors ──────────────────────────────
  textPrimary:    '#1A1A2E',
  textSecondary:  '#6C757D',
  textTertiary:   '#ADB5BD',
  textDisabled:   '#CED4DA',
  textOnPrimary:  '#FFFFFF',   // text on primary color button

  // ── Star rating ──────────────────────────────
  star:           '#F39C12',

  // ── Shadows ──────────────────────────────────
  shadow:         'rgba(0,0,0,0.08)',
  shadowDark:     'rgba(0,0,0,0.15)',

  // ── Transparent overlays ─────────────────────
  overlay:        'rgba(0,0,0,0.5)',
  overlayLight:   'rgba(0,0,0,0.2)',
};

export const BOOKING_STATUS_COLORS = {
  pending:            { bg: '#FEF3D7', text: '#B7770D', border: '#FDCB6E' },
  confirmed:          { bg: '#E8F0FD', text: '#1455C0', border: '#1D6AE5' },
  provider_on_the_way:{ bg: '#F3E8FD', text: '#6C3483', border: '#9B59B6' },
  in_progress:        { bg: '#FEF0E0', text: '#9A4E0A', border: '#E67E22' },
  completed:          { bg: '#E0F7F3', text: '#007A63', border: '#00B894' },
  cancelled:          { bg: '#FDECEA', text: '#C0392B', border: '#E74C3C' },
  rejected:           { bg: '#F5F6FA', text: '#636E72', border: '#95A5A6' },
};
