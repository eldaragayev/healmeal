import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColors } from '@/constants/theme';
import { ProgressBar } from './ProgressBar';
import { INITIAL_DATA, type OnboardingData, type StepProps } from '@/hooks/useOnboarding';
import { posthog, ONBOARDING_FLOW_VERSION } from '@/analytics';

// Steps
import { WelcomeStep, NameStep, GreetingStep } from './steps/IntroSteps';
import { AttributionStep } from './steps/AttributionStep';
import {
  GoalStep,
  GoalResponseStep,
  CurrentWeightStep,
  GoalWeightStep,
  WeightGoalEncouragementStep,
  HeightStep,
  AgeStep,
  SocialProofStep,
  ProjectionStep,
  DiningFrequencyStep,
  FrequencyResponseStep,
  RestaurantsStep,
  RestaurantsConfirmStep,
  DietaryRestrictionsStep,
} from './steps/QuizSteps';
import {
  AnalyzingStep,
  PainPoint1Step,
  PainPoint2Step,
  CalorieGapStep,
  SolutionRevealStep,
  SmartSwapsStep,
  BackedByScienceStep,
  ReviewsStep,
  RateUsStep,
} from './steps/EmotionalSteps';
import {
  BuildingPlanStep,
  PlanReadyStep,
  TryFreeStep,
  TrialReminderStep,
  PaywallStep,
} from './steps/ConversionSteps';

// ─── Step Registry ─────────────────────────────────────────────────────────────

interface StepDef {
  key: string;
  component: React.ComponentType<StepProps>;
  progress?: number; // 0–1, undefined = hide progress bar
  canGoBack?: boolean;
}

const STEPS: StepDef[] = [
  { key: 'welcome', component: WelcomeStep },                          // 0
  { key: 'name', component: NameStep, progress: 0.03 },              // 1
  { key: 'greeting', component: GreetingStep },                          // 2
  { key: 'attribution', component: AttributionStep, progress: 0.07, canGoBack: true }, // 3
  { key: 'goal', component: GoalStep, progress: 0.10, canGoBack: true }, // 4
  { key: 'goal_response', component: GoalResponseStep },                      // 5
  { key: 'weight', component: CurrentWeightStep, progress: 0.17, canGoBack: true }, // 6
  { key: 'goal_weight', component: GoalWeightStep, progress: 0.21, canGoBack: true }, // 7
  { key: 'weight_encouragement', component: WeightGoalEncouragementStep },            // 8
  { key: 'height', component: HeightStep, progress: 0.28, canGoBack: true }, // 9
  { key: 'age', component: AgeStep, progress: 0.34, canGoBack: true }, // 10
  { key: 'social_proof', component: SocialProofStep },                       // 11
  { key: 'projection', component: ProjectionStep },                        // 12
  { key: 'dining_frequency', component: DiningFrequencyStep, progress: 0.44, canGoBack: true }, // 13
  { key: 'frequency_response', component: FrequencyResponseStep },                 // 14
  { key: 'restaurants', component: RestaurantsStep, progress: 0.52, canGoBack: true }, // 15
  { key: 'restaurants_confirm', component: RestaurantsConfirmStep },                 // 16
  { key: 'dietary_restrictions', component: DietaryRestrictionsStep, progress: 0.59, canGoBack: true }, // 17
  { key: 'analyzing', component: AnalyzingStep, progress: 0.65 },         // 18
  { key: 'pain_point_1', component: PainPoint1Step },                        // 19
  { key: 'pain_point_2', component: PainPoint2Step },                        // 20
  { key: 'calorie_gap', component: CalorieGapStep },                        // 21
  { key: 'solution_reveal', component: SolutionRevealStep },                    // 22
  { key: 'smart_swaps', component: SmartSwapsStep, progress: 0.78 },        // 23
  { key: 'backed_by_science', component: BackedByScienceStep },                   // 24
  { key: 'reviews', component: ReviewsStep, progress: 0.85 },           // 25
  { key: 'building_plan', component: BuildingPlanStep, progress: 0.89 },      // 26
  { key: 'rate_us', component: RateUsStep },                            // 27
  { key: 'plan_ready', component: PlanReadyStep, progress: 0.96 },         // 28
  { key: 'try_free', component: TryFreeStep },                           // 29
  { key: 'trial_reminder', component: TrialReminderStep },                     // 30
  { key: 'paywall', component: PaywallStep },                           // 31
];

const PAYWALL_STEP_KEY = 'paywall';
const FUNNEL_STEP_TOTAL = STEPS.filter((step) => step.key !== PAYWALL_STEP_KEY).length;

function getStepGroup(stepKey: string): 'intro' | 'quiz' | 'emotional' | 'conversion' {
  if (['welcome', 'name', 'greeting', 'attribution'].includes(stepKey)) return 'intro';
  if (
    [
      'goal',
      'goal_response',
      'weight',
      'goal_weight',
      'weight_encouragement',
      'height',
      'age',
      'social_proof',
      'projection',
      'dining_frequency',
      'frequency_response',
      'restaurants',
      'restaurants_confirm',
      'dietary_restrictions',
    ].includes(stepKey)
  ) {
    return 'quiz';
  }
  if (
    [
      'analyzing',
      'pain_point_1',
      'pain_point_2',
      'calorie_gap',
      'solution_reveal',
      'smart_swaps',
      'backed_by_science',
      'reviews',
      'rate_us',
    ].includes(stepKey)
  ) {
    return 'emotional';
  }
  return 'conversion';
}

// ─── Flow Container ────────────────────────────────────────────────────────────

interface Props {
  onComplete: (data: OnboardingData) => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const stepEnteredAtRef = useRef(Date.now());
  const startedRef = useRef(false);

  // Animation
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const currentDef = STEPS[step];
  const CurrentStep = currentDef.component;

  const getStepEventProps = useCallback(
    (stepIndex: number, stepDef: StepDef) => ({
      step_index: Number(stepIndex),
      step_position: Number(stepIndex) + 1,
      step_key: stepDef.key,
      step_name: stepDef.key,
      step_group: getStepGroup(stepDef.key),
      step_total: stepDef.key === PAYWALL_STEP_KEY ? STEPS.length : FUNNEL_STEP_TOTAL,
      progress: stepDef.progress ?? null,
      flow_version: ONBOARDING_FLOW_VERSION,
      goal: data.goal ?? null,
    }),
    [data.goal]
  );

  // Track onboarding step views
  useEffect(() => {
    if (!currentDef) return;
    if (!startedRef.current) {
      startedRef.current = true;
      posthog.capture('onboarding_started', {
        flow_version: ONBOARDING_FLOW_VERSION,
        entry_step_key: currentDef.key,
        step_total: FUNNEL_STEP_TOTAL,
      });
    }

    posthog.capture('onboarding_step_viewed', {
      ...getStepEventProps(step, currentDef),
    });
    stepEnteredAtRef.current = Date.now();
  }, [step, currentDef, getStepEventProps]);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const goBackStep = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    posthog.capture('onboarding_back_tapped', {
      ...getStepEventProps(step, currentDef),
      time_on_step_ms: Math.max(0, Date.now() - stepEnteredAtRef.current),
    });
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(16, { duration: 150 }, () => {
      runOnJS(goBackStep)();
      translateY.value = -16;
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    });
  }, [step, currentDef, opacity, translateY, goBackStep, getStepEventProps]);

  const advanceStep = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const goToNext = useCallback(() => {
    const nextStep = step + 1;
    const isLastStep = step >= STEPS.length - 1;
    const timeOnStepMs = Math.max(0, Date.now() - stepEnteredAtRef.current);

    posthog.capture('onboarding_step_completed', {
      ...getStepEventProps(step, currentDef),
      time_on_step_ms: timeOnStepMs,
    });

    // If we're about to land on the paywall (last step), save onboarding first
    // so a force-quit during paywall won't restart the whole flow
    const isEnteringPaywall = nextStep === STEPS.length - 1;
    if (isEnteringPaywall) {
      posthog.capture('onboarding_exited_to_paywall', {
        ...getStepEventProps(step, currentDef),
        next_step_key: PAYWALL_STEP_KEY,
        time_on_step_ms: timeOnStepMs,
      });
      onComplete(data);
    }

    if (isLastStep) {
      // Already on the last step (paywall) — onComplete was called when we entered
      // Call it again to ensure state propagates (idempotent)
      onComplete(data);
      return;
    }

    // Animate out
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(-16, { duration: 150 }, () => {
      runOnJS(advanceStep)();
      translateY.value = 16;
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    });
  }, [step, currentDef, data, onComplete, opacity, translateY, advanceStep, getStepEventProps]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Safe area top */}
      <View style={{ height: insets.top }} />

      {/* Progress bar — only show when step has progress */}
      {currentDef.progress !== undefined ? (
        <ProgressBar progress={currentDef.progress} />
      ) : (
        <View style={styles.progressPlaceholder} />
      )}

      {/* Step content */}
      <Animated.View style={[styles.stepWrap, animatedStyle]}>
        <CurrentStep data={data} update={update} onNext={goToNext} onBack={currentDef.canGoBack ? goBack : undefined} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressPlaceholder: {
    height: 12, // same space as progress bar for consistent layout
  },
  stepWrap: {
    flex: 1,
  },
});
