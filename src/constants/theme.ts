import { Platform, useColorScheme } from 'react-native';

// iOS rounded system font for warmth — falls back to normal on Android
const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

export const Colors = {
  light: {
    background: '#fafaf7',
    surface: 'rgba(255,255,255,0.8)',
    surfaceBorder: 'rgba(0,0,0,0.04)',
    surfaceElevated: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#6b6b6b',
    textTertiary: '#a0a0a0',
    brandGreen: '#22a654',
    brandGreenSoft: 'rgba(34,166,84,0.08)',
    brandGreenBorder: 'rgba(34,166,84,0.2)',
    protein: '#c94444',
    carbs: '#5b7fb5',
    fat: '#c4923a',
    proteinBg: 'rgba(201,68,68,0.08)',
    carbsBg: 'rgba(91,127,181,0.06)',
    fatBg: 'rgba(196,146,58,0.06)',
    chipActive: 'rgba(34,166,84,0.1)',
    chipActiveBorder: 'rgba(34,166,84,0.25)',
    chipInactive: 'rgba(0,0,0,0.03)',
    chipInactiveBorder: 'rgba(0,0,0,0.06)',
    chipInactiveText: '#555',
    accent: '#e8e4df',
  },
  dark: {
    background: '#0c0c0c',
    surface: 'rgba(255,255,255,0.05)',
    surfaceBorder: 'rgba(255,255,255,0.06)',
    surfaceElevated: '#1a1a1a',
    text: '#f0efe8',
    textSecondary: '#8a8a8a',
    textTertiary: '#555',
    brandGreen: '#5ae87a',
    brandGreenSoft: 'rgba(90,232,122,0.08)',
    brandGreenBorder: 'rgba(90,232,122,0.2)',
    protein: '#f07070',
    carbs: '#7da8d9',
    fat: '#dbb060',
    proteinBg: 'rgba(240,112,112,0.10)',
    carbsBg: 'rgba(125,168,217,0.08)',
    fatBg: 'rgba(219,176,96,0.08)',
    chipActive: 'rgba(90,232,122,0.12)',
    chipActiveBorder: 'rgba(90,232,122,0.25)',
    chipInactive: 'rgba(255,255,255,0.04)',
    chipInactiveBorder: 'rgba(255,255,255,0.06)',
    chipInactiveText: '#8a8a8a',
    accent: '#1e1e1c',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const Typography = {
  largeTitle: {
    fontSize: 38,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
    fontFamily,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
    fontFamily,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    fontFamily,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    fontFamily,
  },
  macro: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    fontFamily,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    fontFamily,
  },
  macroSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily,
  },
} as const;

export function useThemeColors() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
