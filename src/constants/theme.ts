/**
 * App Theme & Colors | Centralized color and style constants
 */

export const Colors = {
  // Primary Brand
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  primaryDark: '#1e40af',

  // Status Colors
  success: '#059669',
  successLight: '#d1fae5',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#0ea5e9',
  infoLight: '#cffafe',

  // Neutral
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',

  // Text
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',

  // Specific Usage
  brand: '#3b82f6',
  cardBg: '#ffffff',
  pageBg: '#f9fafb',
  divider: '#e5e7eb',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
