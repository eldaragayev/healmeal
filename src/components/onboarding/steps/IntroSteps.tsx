import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useThemeColors } from '@/constants/theme';
import { StepLayout } from '../StepLayout';
import type { StepProps } from '@/hooks/useOnboarding';

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

// ─── Screen 1: Welcome ────────────────────────────────────────────────────────

export function WelcomeStep({ onNext }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout cta="Let's go" onNext={onNext}>
      <View style={styles.welcomeCenter}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Image
            source={require('@/../assets/animation/hello.webp')}
            style={styles.mascot}
            autoplay
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={[styles.brand, { color: colors.text }]}>HealMeal</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Eat out.{'\n'}Lose weight.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(500)}>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            We find the best meals for your goals at every restaurant near you
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 2: Name Input ──────────────────────────────────────────────────────

export function NameStep({ data, update, onNext }: StepProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <StepLayout
      cta="That's me"
      onNext={onNext}
      ctaDisabled={!data.name.trim()}
      keyboardAvoiding
    >
      <View style={styles.nameContent}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          First things first —
        </Text>
        <Text style={[styles.headline, { color: colors.text }]}>
          What should we call you?
        </Text>

        <TextInput
          style={[
            styles.nameInput,
            {
              color: colors.text,
              borderColor: focused ? '#22a654' : colors.surfaceBorder,
            },
          ]}
          value={data.name}
          onChangeText={(t) => update({ name: t })}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => data.name.trim() && onNext()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </StepLayout>
  );
}

// ─── Screen 3: Personalized Greeting ───────────────────────────────────────────

export function GreetingStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const [tapped, setTapped] = useState(false);

  // Haptic on name reveal
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  useEffect(() => {
    if (tapped) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(onNext, 1800);
      return () => clearTimeout(timer);
    }
  }, [tapped, onNext]);

  return (
    <StepLayout
      cta={tapped ? undefined : 'Yep'}
      onNext={tapped ? undefined : () => setTapped(true)}
    >
      <View style={styles.greetContent}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.greetName, { color: colors.text }]}>
            Hey {data.name}.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={[styles.greetQuestion, { color: colors.textSecondary }]}>
            Ready to eat out without the guilt?
          </Text>
        </Animated.View>

        {tapped && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.greetFollowUp}>
            <Text style={[styles.greetConfirm, { color: colors.text }]}>
              Let's do this.
            </Text>
          </Animated.View>
        )}
      </View>
    </StepLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Welcome
  welcomeCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mascot: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  brand: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
    fontFamily,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
    lineHeight: 44,
    fontFamily,
  },
  heroSub: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    fontFamily,
  },

  // Name
  nameContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: '30%',
    gap: 4,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    fontFamily,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 24,
    fontFamily,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '600',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    fontFamily,
  },

  // Greeting
  greetContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  greetName: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'left',
    fontFamily,
  },
  greetQuestion: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.6,
    textAlign: 'left',
    marginTop: 8,
    fontFamily,
  },
  greetFollowUp: {
    marginTop: 24,
  },
  greetConfirm: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'left',
    fontFamily,
  },
});
