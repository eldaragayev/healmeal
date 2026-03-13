import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#f2f5f0',
    surface: 'rgba(255,255,255,0.65)',
    surfaceBorder: 'rgba(255,255,255,0.8)',
    text: '#1a1a1a',
    textSecondary: '#888',
    textTertiary: '#999',
    brandGreen: '#16a34a',
    protein: '#16a34a',
    carbs: '#3b82f6',
    fat: '#f59e0b',
    proteinBg: '#f0fdf4',
    carbsBg: '#eff6ff',
    fatBg: '#fefce8',
    chipActive: 'rgba(22,163,74,0.12)',
    chipActiveBorder: 'rgba(22,163,74,0.3)',
    chipInactive: 'rgba(255,255,255,0.7)',
    chipInactiveBorder: 'rgba(0,0,0,0.06)',
    chipInactiveText: '#555',
  },
  dark: {
    background: '#0a0a0a',
    surface: 'rgba(255,255,255,0.06)',
    surfaceBorder: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textSecondary: '#888',
    textTertiary: '#666',
    brandGreen: '#4ade80',
    protein: '#4ade80',
    carbs: '#60a5fa',
    fat: '#fbbf24',
    proteinBg: 'rgba(74,222,128,0.1)',
    carbsBg: 'rgba(96,165,250,0.1)',
    fatBg: 'rgba(251,191,36,0.1)',
    chipActive: 'rgba(74,222,128,0.15)',
    chipActiveBorder: 'rgba(74,222,128,0.3)',
    chipInactive: 'rgba(255,255,255,0.06)',
    chipInactiveBorder: 'rgba(255,255,255,0.08)',
    chipInactiveText: '#999',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
} as const;

export const Typography = {
  title: {
    fontSize: 34,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  macro: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
} as const;

export function useThemeColors() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
