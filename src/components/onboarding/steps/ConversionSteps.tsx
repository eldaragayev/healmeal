import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/constants/theme';
import { StepLayout } from '../StepLayout';
import { HardPaywall } from '@/components/HardPaywall';
import type { StepProps, OnboardingData } from '@/hooks/useOnboarding';

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

function SFIcon({ name, size = 24, color }: { name: string; size?: number; color: string }) {
  if (Platform.OS !== 'ios') return <View style={{ width: size, height: size }} />;
  return <SymbolView name={name as any} style={{ width: size, height: size }} tintColor={color} />;
}

// ─── Screen 22: Building Plan (Labor Illusion) ────────────────────────────────

const BUILDING_TEXTS = (data: OnboardingData) => {
  return [
    'Calculating your daily targets...',
    'Applying your preferences...',
    'Finding your best options...',
    'Done \u2713',
  ];
};

export function BuildingPlanStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const [textIdx, setTextIdx] = useState(0);
  const texts = BUILDING_TEXTS(data);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx((i) => {
        if (i >= texts.length - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, 1400);

    const timeout = setTimeout(onNext, 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onNext, texts.length]);

  return (
    <StepLayout centered>
      <Image
        source={require('@/../assets/animation/loading.webp')}
        style={styles.buildMascot}
        autoplay
      />
      <Animated.View entering={FadeIn.duration(300)} key={textIdx}>
        <Text style={[styles.buildText, { color: colors.textSecondary }]}>
          {texts[textIdx]}
        </Text>
      </Animated.View>
    </StepLayout>
  );
}

// ─── Screen 22: Plan Ready ─────────────────────────────────────────────────────

function computePlan(data: OnboardingData) {
  const isLb = data.weightUnit === 'lb';
  const weightKg = isLb ? data.currentWeight * 0.453592 : data.currentWeight;

  let cals: number;
  if (data.goal === 'lose') cals = Math.round(weightKg * 24);
  else if (data.goal === 'muscle') cals = Math.round(weightKg * 30);
  else cals = Math.round(weightKg * 27);

  const protein = data.goal === 'muscle' ? Math.round(weightKg * 2) : Math.round(weightKg * 1.6);
  const restCount = data.selectedRestaurants.length || 12;
  const mealCount = restCount * 4;

  const diff = Math.abs(data.currentWeight - data.goalWeight);
  const diffLbs = isLb ? diff : diff * 2.205;
  const weeks = data.goal === 'lose' ? Math.max(4, Math.round(diffLbs / 1.5)) : 4;

  return { cals, protein, restCount, mealCount, weeks };
}

function getPlanSummary(data: OnboardingData) {
  if (data.goal === 'muscle') {
    return 'High-protein options at your favourite spots. No meal prep required.';
  }
  if (data.goal === 'balanced') {
    return 'Balanced meals at the restaurants you love. No overthinking.';
  }
  return "We found lower-calorie meals you'll actually want to eat. At the places you already go.";
}

const COMMIT_SIZE = 120;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Diagonal of the screen — the circle needs to be this big to cover everything
const SCREEN_DIAGONAL = Math.sqrt(SCREEN_W * SCREEN_W + SCREEN_H * SCREEN_H);

export function PlanReadyStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const plan = computePlan(data);
  const planSummary = getPlanSummary(data);
  const [committed, setCommitted] = useState(false);
  const [holding, setHolding] = useState(false);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gentle pulse to hint "touch me"
  useEffect(() => {
    if (committed) return;
    const loop = setInterval(() => {
      pulse.value = withTiming(1.06, { duration: 600 }, () => {
        pulse.value = withTiming(1, { duration: 600 });
      });
    }, 1800);
    return () => clearInterval(loop);
  }, [committed, pulse]);

  // The green circle scales from the button center to cover the whole screen
  // Extra 1.5x multiplier ensures full coverage including corners
  const screenFillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value * (SCREEN_DIAGONAL / COMMIT_SIZE) * 1.5 }],
    opacity: progress.value > 0 ? 1 : 0,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.5,
  }));

  // Content fades out as the green fills the screen
  const contentFade = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.8,
  }));

  const onCommit = useCallback(() => {
    setCommitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(onNext, 800);
  }, [onNext]);

  const startHold = useCallback(() => {
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    progress.value = withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) });

    let count = 0;
    tickTimer.current = setInterval(() => {
      count++;
      Haptics.impactAsync(
        count < 6
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium
      );
    }, 250);

    holdTimer.current = setTimeout(() => {
      if (tickTimer.current) clearInterval(tickTimer.current);
      runOnJS(onCommit)();
    }, 1800);
  }, [progress, onCommit]);

  const cancelHold = useCallback(() => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    progress.value = withTiming(0, { duration: 300 });
  }, [progress]);

  return (
    <StepLayout>
      <View style={styles.planContent}>
        <Animated.View entering={FadeInDown.duration(400)} style={contentFade}>
          <Text style={[styles.planTitle, { color: colors.text }]}>
            {data.name}, you're set.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={contentFade}>
          <Text style={[styles.planProjection, { color: colors.textSecondary }]}>
            {planSummary}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, contentFade]}
        >
          <PlanRow icon="flame.fill" color="#FF9500" label="Daily calories" value={`${plan.cals} kcal`} />
          <PlanRow icon="bolt.fill" color="#c94444" label="Protein target" value={`${plan.protein}g`} />
          <PlanRow icon="mappin.and.ellipse" color="#22a654" label="Restaurants nearby" value="20+" />
          <PlanRow icon="fork.knife" color="#5b7fb5" label="Meals for you" value="50,000+" />
        </Animated.View>

        {/* Hold-to-commit */}
        <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.commitArea}>
          <Pressable
            onPressIn={committed ? undefined : startHold}
            onPressOut={committed ? undefined : cancelHold}
          >
            <Animated.View style={[styles.commitOuter, buttonStyle]}>
              {/* Green circle that expands to fill the entire screen */}
              <Animated.View style={[styles.commitFillCircle, screenFillStyle]} />

              {/* Keep holding text — above the green fill */}
              {holding && !committed && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.keepHoldingWrap}>
                  <Text style={styles.keepHoldingLabel}>
                    Almost there...
                  </Text>
                </Animated.View>
              )}

              {/* Icon on top */}
              <Animated.View style={[{ zIndex: 2 }, iconStyle]}>
                {Platform.OS === 'ios' ? (
                  <SymbolView
                    name={committed ? 'checkmark.circle.fill' as any : 'touchid' as any}
                    style={{ width: 52, height: 52 }}
                    tintColor={committed ? '#fff' : '#22a654'}
                  />
                ) : (
                  <Text style={{ fontSize: 44 }}>{committed ? '✓' : '👆'}</Text>
                )}
              </Animated.View>
            </Animated.View>
          </Pressable>

          <Animated.View entering={FadeIn.delay(1200).duration(500)} style={contentFade}>
            <Text style={[styles.commitLabel, { color: colors.textSecondary }]}>
              {committed ? '' : 'Hold to commit'}
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(900).duration(500)} style={contentFade}>
          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            These are suggested targets, not strict rules. You can adjust your goals anytime in Settings.
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

function PlanRow({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.planRow}>
      <SFIcon name={icon} size={22} color={color} />
      <Text style={[styles.planLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.planValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Screen: Try For Free (pre-paywall trust builder) ─────────────────────────

export function TryFreeStep({ onNext }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout
      cta="Continue For Free"
      onNext={onNext}
      footerNote={
        <View style={styles.tryFreeCheck}>
          {Platform.OS === 'ios' ? (
            <SymbolView name={'checkmark.circle.fill' as any} style={{ width: 18, height: 18 }} tintColor="#22a654" />
          ) : (
            <Text style={{ color: '#22a654' }}>✓</Text>
          )}
          <Text style={[styles.tryFreeNoPayment, { color: colors.textSecondary }]}>No Payment Due Now</Text>
        </View>
      }
    >
      <View style={styles.tryFreeContent}>
        <Animated.View entering={FadeIn.delay(200).duration(500)}>
          <Image
            source={require('@/../assets/animation/paywall.webp')}
            style={styles.tryFreeMascot}
            autoplay
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={[styles.tryFreeTitle, { color: colors.text }]}>
            Try HealMeal{'\n'}for free.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <View style={styles.tryFreeFeatures}>
            <TryFreeRow icon="fork.knife" text="Find healthy meals near you" color={colors.textSecondary} />
            <TryFreeRow icon="flame.fill" text="Track your macros effortlessly" color={colors.textSecondary} />
            <TryFreeRow icon="arrow.triangle.2.circlepath" text="Cancel anytime, no commitment" color={colors.textSecondary} />
          </View>
        </Animated.View>

      </View>
    </StepLayout>
  );
}

function TryFreeRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={styles.tryFreeRow}>
      {Platform.OS === 'ios' ? (
        <SymbolView name={icon as any} style={{ width: 20, height: 20 }} tintColor={color} />
      ) : null}
      <Text style={[styles.tryFreeRowText, { color }]}>{text}</Text>
    </View>
  );
}

// ─── Screen: Trial Reminder Promise ──────────────────────────────────────────

export function TrialReminderStep({ onNext }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout
      cta="Start my trial"
      onNext={onNext}
      footerNote={
        <View style={styles.tryFreeCheck}>
          {Platform.OS === 'ios' ? (
            <SymbolView name={'checkmark.circle.fill' as any} style={{ width: 18, height: 18 }} tintColor="#22a654" />
          ) : (
            <Text style={{ color: '#22a654' }}>✓</Text>
          )}
          <Text style={[styles.tryFreeNoPayment, { color: colors.textSecondary }]}>You won't be charged today</Text>
        </View>
      }
    >
      <View style={styles.reminderContent}>
        <Animated.View entering={FadeIn.delay(200).duration(600)}>
          <Image
            source={require('@/../assets/animation/bell.webp')}
            style={styles.reminderMascot}
            autoplay
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={[styles.reminderTitle, { color: colors.text }]}>
            We'll send a reminder{'\n'}before it ends
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
          <Text style={[styles.reminderSub, { color: colors.textSecondary }]}>
            Day 3. You decide. No surprises.
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Screen: Hard Paywall ──────────────────────────────────────────────────────

export function PaywallStep({ onNext }: StepProps) {
  return <HardPaywall onPurchased={onNext} />;
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Building
  buildMascot: { width: 100, height: 100, marginBottom: 24 },
  buildText: { fontSize: 18, fontWeight: '600', textAlign: 'center', fontFamily },

  // Plan ready
  planContent: { flex: 1, justifyContent: 'center', gap: 24 },
  planTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1, fontFamily },
  planCard: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 16 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planLabel: { flex: 1, fontSize: 15, fontWeight: '500', fontFamily },
  planValue: { fontSize: 18, fontWeight: '700', fontFamily },
  planProjection: { fontSize: 16, fontWeight: '500', textAlign: 'center', lineHeight: 24, fontFamily },

  // Commit button
  commitArea: {
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  commitOuter: {
    width: COMMIT_SIZE,
    height: COMMIT_SIZE,
    borderRadius: COMMIT_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(34,166,84,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,166,84,0.04)',
  },
  commitFillCircle: {
    position: 'absolute',
    width: COMMIT_SIZE,
    height: COMMIT_SIZE,
    borderRadius: COMMIT_SIZE / 2,
    backgroundColor: '#22a654',
  },
  commitLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily,
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 32,
    marginTop: 8,
    fontFamily,
  },
  keepHoldingWrap: {
    position: 'absolute',
    top: -50,
    zIndex: 10,
    alignSelf: 'center',
    width: 250,
  },
  keepHoldingLabel: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    color: '#fff',
    fontFamily,
  },

  // Try Free
  tryFreeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  tryFreeTitle: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
    lineHeight: 48,
    fontFamily,
  },
  tryFreeMascot: {
    width: 220,
    height: 220,
    marginVertical: -30,
  },
  tryFreeFeatures: {
    gap: 16,
    alignItems: 'center',
  },
  tryFreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tryFreeRowText: {
    fontSize: 17,
    fontWeight: '500',
    fontFamily,
  },
  tryFreeCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tryFreeNoPayment: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily,
  },

  // Trial reminder
  reminderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  reminderMascot: {
    width: 150,
    height: 150,
  },
  reminderTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 40,
    fontFamily,
  },
  reminderSub: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily,
  },

});
