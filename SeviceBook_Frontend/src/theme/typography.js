import { lightColors } from './colors';
import { lightShadows } from './shadows';
export const COLORS = lightColors;
export const SHADOWS = lightShadows;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 28,
  huge: 34,
};

// Fallback exports for components that might not be transformed yet
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40, xxxl: 48,
};
export const BORDER_RADIUS = {
  sm: 6, md: 12, lg: 16, xl: 18, xxl: 24, round: 9999,
};