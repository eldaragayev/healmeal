import { Text, Pressable, StyleSheet, Platform, View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/constants/theme';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  tint?: string;
  textColor?: string;
  style?: any;
}

export function GlassButton({ label, onPress, tint, textColor, style }: GlassButtonProps) {
  const colors = useThemeColors();
  const resolvedTextColor = textColor || colors.text;

  if (hasGlass) {
    return (
      <Pressable onPress={onPress} style={style}>
        <GlassView
          style={styles.button}
          glassEffectStyle="regular"
          tintColor={tint}
          isInteractive
        >
          <Text style={[styles.label, { color: resolvedTextColor }]}>{label}</Text>
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.fallbackButton,
        {
          backgroundColor: tint || colors.surface,
          borderColor: colors.surfaceBorder,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: resolvedTextColor }]}>{label}</Text>
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
  fallbackButton: {
    borderWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
