import { Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: any;
}

export function OnboardingButton({ label, onPress, disabled, variant = 'primary', style }: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        animStyle,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'outline' && styles.outlineLabel,
          variant === 'ghost' && styles.ghostLabel,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#22a654',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22a654',
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontFamily,
  },
  primaryLabel: {
    color: '#fff',
  },
  outlineLabel: {
    color: '#22a654',
  },
  ghostLabel: {
    color: '#22a654',
    fontSize: 16,
    fontWeight: '600',
  },
});
