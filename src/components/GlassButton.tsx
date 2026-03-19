import { Text, Pressable, StyleSheet, Platform } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/constants/theme';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary';
  size?: 'regular' | 'compact';
  style?: any;
}

export function GlassButton({ label, onPress, variant = 'default', size = 'regular', style }: GlassButtonProps) {
  const colors = useThemeColors();
  const isPrimary = variant === 'primary';
  const isCompact = size === 'compact';
  const buttonStyle = isCompact ? styles.compactButton : styles.button;
  const textStyle = isCompact ? styles.compactLabel : styles.label;

  if (hasGlass) {
    return (
      <Pressable onPress={onPress} style={style}>
        <GlassView
          style={buttonStyle}
          glassEffectStyle="regular"
          isInteractive
        >
          <Text style={[textStyle, { color: isPrimary ? colors.brandGreen : colors.text }]}>
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
        buttonStyle,
        isPrimary
          ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder, borderWidth: 1 }
          : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
        { opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[textStyle, { color: isPrimary ? colors.brandGreen : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
