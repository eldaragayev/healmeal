import { Text, Pressable, StyleSheet, Platform } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/constants/theme';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary';
  style?: any;
}

export function GlassButton({ label, onPress, variant = 'default', style }: GlassButtonProps) {
  const colors = useThemeColors();
  const isPrimary = variant === 'primary';

  if (hasGlass) {
    return (
      <Pressable onPress={onPress} style={style}>
        <GlassView
          style={styles.button}
          glassEffectStyle="regular"
          isInteractive
        >
          <Text style={[styles.label, { color: isPrimary ? colors.brandGreen : colors.text }]}>
            {label}
          </Text>
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder, borderWidth: 1 }
          : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? colors.brandGreen : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
