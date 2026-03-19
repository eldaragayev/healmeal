import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Path, Skia, Group, Text as SkiaText, useFont, Circle } from '@shopify/react-native-skia';
import { useThemeColors } from '@/constants/theme';
import { StepLayout } from '../StepLayout';
import type { StepProps } from '@/hooks/useOnboarding';
import { showPrompt } from '@/utils/prompt';

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

function formatWeightValue(value: number, unit: 'lb' | 'kg') {
  if (unit === 'kg') return value.toFixed(1).replace(/\.0$/, '');
  return Math.round(value).toString();
}

// ─── Shared: Value Stepper ─────────────────────────────────────────────────────

function ValueStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatValue,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  formatValue?: (v: number) => string;
}) {
  const colors = useThemeColors();
  const display = formatValue ? formatValue(value) : `${value}`;

  const inc = () => { Haptics.selectionAsync(); onChange(Math.min(max, +(value + step).toFixed(1))); };
  const dec = () => { Haptics.selectionAsync(); onChange(Math.max(min, +(value - step).toFixed(1))); };

  const tapToEdit = () => {
    showPrompt({
      title: label === 'ft' || label === 'in' ? `Enter ${label}` : 'Enter value',
      defaultValue: `${value}`,
      keyboardType: 'decimal-pad',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            const num = parseFloat(text);
            if (!isNaN(num) && num >= min && num <= max) {
              onChange(+num.toFixed(1));
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.stepper}>
      <Pressable onPress={inc} style={styles.chevronBtn} hitSlop={16}>
        {Platform.OS === 'ios' ? (
          <SymbolView name="chevron.up" style={styles.chevronIcon} tintColor={colors.textTertiary} />
        ) : (
          <Text style={[styles.chevronText, { color: colors.textTertiary }]}>▲</Text>
        )}
      </Pressable>
      <Pressable onPress={tapToEdit} style={styles.stepperValueWrap}>
        <Text style={[styles.stepperValue, { color: colors.text }]}>{display}</Text>
        {Platform.OS === 'ios' ? (
          <SymbolView name="pencil.circle.fill" style={styles.editIcon} tintColor={colors.textTertiary} />
        ) : (
          <Text style={[styles.editIconFallback, { color: colors.textTertiary }]}>✎</Text>
        )}
      </Pressable>
      <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable onPress={dec} style={styles.chevronBtn} hitSlop={16}>
        {Platform.OS === 'ios' ? (
          <SymbolView name="chevron.down" style={styles.chevronIcon} tintColor={colors.textTertiary} />
        ) : (
          <Text style={[styles.chevronText, { color: colors.textTertiary }]}>▼</Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Shared: Option Card ───────────────────────────────────────────────────────

function OptionCard({
  selected,
  onPress,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  icon: string;
  title: string;
  subtitle?: string;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[
        styles.optionCard,
        {
          backgroundColor: selected ? 'rgba(34,166,84,0.08)' : colors.surface,
          borderColor: selected ? '#22a654' : colors.surfaceBorder,
        },
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: selected ? 'rgba(34,166,84,0.12)' : 'rgba(0,0,0,0.04)' }]}>
        {Platform.OS === 'ios' ? (
          <SymbolView name={icon as any} style={{ width: 26, height: 26 }} tintColor={selected ? '#22a654' : colors.textSecondary} />
        ) : (
          <Text style={{ fontSize: 22 }}>{icon === 'flame.fill' ? '🔥' : icon === 'dumbbell.fill' ? '💪' : '⚖️'}</Text>
        )}
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.optionSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {selected && (
        <View style={styles.checkCircle}>
          {Platform.OS === 'ios' ? (
            <SymbolView name="checkmark.circle.fill" style={{ width: 24, height: 24 }} tintColor="#22a654" />
          ) : (
            <Text style={{ color: '#22a654', fontSize: 20 }}>✓</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ─── Shared: Unit Toggle ───────────────────────────────────────────────────────

function UnitToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.unitRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[
            styles.unitPill,
            {
              backgroundColor: value === opt.value ? '#22a654' : colors.surface,
              borderColor: value === opt.value ? '#22a654' : colors.surfaceBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.unitLabel,
              { color: value === opt.value ? '#fff' : colors.textSecondary },
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Screen 4: Goal Selection ──────────────────────────────────────────────────

export function GoalStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout cta="That's me" onNext={onNext} onBack={onBack} ctaDisabled={!data.goal}>
      <View style={styles.topContent}>
        <Text style={[styles.headline, { color: colors.text }]}>
          What's your{'\n'}main goal?
        </Text>
        <View style={styles.cardGap}>
          <OptionCard
            selected={data.goal === 'lose'}
            onPress={() => update({ goal: 'lose', goalWeightManuallyEdited: false })}
            icon="flame.fill"
            title="Lose weight"
            subtitle="Eat out without the extra calories"
          />
          <OptionCard
            selected={data.goal === 'muscle'}
            onPress={() => update({ goal: 'muscle', goalWeightManuallyEdited: false })}
            icon="dumbbell.fill"
            title="Build muscle"
            subtitle="Find the high-protein meals everywhere"
          />
          <OptionCard
            selected={data.goal === 'balanced'}
            onPress={() => update({ goal: 'balanced', goalWeightManuallyEdited: false })}
            icon="equal.circle.fill"
            title="Stay balanced"
            subtitle="Just eat better without overthinking it"
          />
        </View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 5: Goal Response ───────────────────────────────────────────────────

export function GoalResponseStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();

  const content = useMemo(() => {
    switch (data.goal) {
      case 'lose':
        return {
          line1: `Got it, ${data.name}.`,
          line2: 'The average restaurant meal has 300+ hidden calories.',
          line3: "You just don't see them on the menu.",
          line4: 'We do.',
        };
      case 'muscle':
        return {
          line1: `On it, ${data.name}.`,
          line2: "Most restaurant 'protein' options? Mostly carbs and sauce.",
          line3: 'We find the meals that actually deliver.',
          line4: null,
        };
      default:
        return {
          line1: `Love that, ${data.name}.`,
          line2: "No diet. No rules. Just knowing what's actually in your food.",
          line3: "We'll show you.",
          line4: null,
        };
    }
  }, [data.goal, data.name]);

  return (
    <StepLayout cta="Show me" onNext={onNext} centered>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[styles.responseMain, { color: colors.text }]}>{content.line1}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={[styles.responseSub, { color: colors.textSecondary }]}>{content.line2}</Text>
      </Animated.View>
      {content.line4 ? (
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <Text style={[styles.responseSub, { color: colors.textSecondary }]}>{content.line3}</Text>
        </Animated.View>
      ) : null}
      {content.line4 ? (
        <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
          <Text style={[styles.responseBold, { color: colors.text }]}>{content.line4}</Text>
        </Animated.View>
      ) : null}
      {!content.line4 ? (
        <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
          <Text style={[styles.responseBold, { color: colors.text }]}>{content.line3}</Text>
        </Animated.View>
      ) : null}
    </StepLayout>
  );
}

// ─── Screen 6: Current Weight ──────────────────────────────────────────────────

export function CurrentWeightStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout cta="Next" onNext={onNext} onBack={onBack}>
      <View style={styles.pickerContent}>
        <Text style={[styles.headline, { color: colors.text }]}>
          What do you{'\n'}weigh right now?
        </Text>

        <UnitToggle
          options={[
            { value: 'lb' as const, label: 'lb' },
            { value: 'kg' as const, label: 'kg' },
          ]}
          value={data.weightUnit}
          onChange={(v) => {
            if (v === 'kg' && data.weightUnit === 'lb') {
              update({
                weightUnit: v,
                currentWeight: Math.round(data.currentWeight * 0.453592),
                goalWeight: Math.round(data.goalWeight * 0.453592),
              });
            } else if (v === 'lb' && data.weightUnit === 'kg') {
              update({
                weightUnit: v,
                currentWeight: Math.round(data.currentWeight * 2.20462),
                goalWeight: Math.round(data.goalWeight * 2.20462),
              });
            }
          }}
        />

        <ValueStepper
          value={data.currentWeight}
          onChange={(v) => update({ currentWeight: v })}
          min={data.weightUnit === 'lb' ? 80 : 35}
          max={data.weightUnit === 'lb' ? 500 : 230}
          step={data.weightUnit === 'lb' ? 1 : 0.5}
          label={data.weightUnit}
          formatValue={(v) => data.weightUnit === 'kg' ? v.toFixed(1) : `${v}`}
        />
      </View>
    </StepLayout>
  );
}

// ─── Screen 7: Goal Weight ─────────────────────────────────────────────────────

export function GoalWeightStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();
  const nudgeText = useMemo(() => {
    if (data.goal === 'balanced') {
      return 'Happy here? That\'s fine. Only change it if you want to.';
    }
    if (data.goal === 'muscle') {
      return 'Aim high. You can always adjust later.';
    }
    return 'Pick something that feels right. Not extreme.';
  }, [data.goal]);

  useEffect(() => {
    if (data.goalWeightManuallyEdited) return;
    const offset = data.weightUnit === 'lb' ? 15 : 7;
    let startGoal = data.currentWeight;
    if (data.goal === 'muscle') startGoal = data.currentWeight + offset;
    else if (data.goal === 'lose') startGoal = data.currentWeight - offset;
    if (Math.abs(data.goalWeight - startGoal) >= 0.01) {
      update({ goalWeight: Math.max(1, startGoal) });
    }
  }, [data.goalWeightManuallyEdited, data.weightUnit, data.goal, data.currentWeight, data.goalWeight, update]);

  return (
    <StepLayout cta="Set" onNext={onNext} onBack={onBack}>
      <View style={styles.pickerContent}>
        <Text style={[styles.headline, { color: colors.text }]}>
          Where do you{'\n'}want to be?
        </Text>

        <UnitToggle
          options={[
            { value: 'lb' as const, label: 'lb' },
            { value: 'kg' as const, label: 'kg' },
          ]}
          value={data.weightUnit}
          onChange={(v) => {
            if (v === 'kg' && data.weightUnit === 'lb') {
              update({
                weightUnit: v,
                currentWeight: Math.round(data.currentWeight * 0.453592),
                goalWeight: Math.round(data.goalWeight * 0.453592),
              });
            } else if (v === 'lb' && data.weightUnit === 'kg') {
              update({
                weightUnit: v,
                currentWeight: Math.round(data.currentWeight * 2.20462),
                goalWeight: Math.round(data.goalWeight * 2.20462),
              });
            }
          }}
        />

        <ValueStepper
          value={data.goalWeight}
          onChange={(v) => update({ goalWeight: v, goalWeightManuallyEdited: true })}
          min={data.weightUnit === 'lb' ? 80 : 35}
          max={data.weightUnit === 'lb' ? 500 : 230}
          step={data.weightUnit === 'lb' ? 1 : 0.5}
          label={data.weightUnit}
          formatValue={(v) => data.weightUnit === 'kg' ? v.toFixed(1) : `${v}`}
        />

        <Text style={[styles.nudge, { color: colors.textTertiary }]}>
          {nudgeText}
        </Text>
      </View>
    </StepLayout>
  );
}

// ─── Interstitial: Weight Goal Encouragement ────────────────────────────────

export function WeightGoalEncouragementStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const diff = Math.abs(data.currentWeight - data.goalWeight);
  const unit = data.weightUnit;
  const isMaintaining = diff < 0.01;
  const isGainTarget = data.goalWeight > data.currentWeight;
  const headline = isMaintaining
    ? `Maintain ${formatWeightValue(data.currentWeight, unit)} ${unit}`
    : `${isGainTarget ? '+' : '-'}${formatWeightValue(diff, unit)} ${unit}`;
  const subline = isMaintaining
    ? "Smart. Let's keep you there."
    : isGainTarget
      ? 'One meal at a time.'
      : 'You got this.';

  return (
    <StepLayout cta="Let's go" onNext={onNext} centered>
      <Animated.View entering={FadeIn.duration(500)}>
        <Text style={[styles.interstitialBig, { color: colors.text }]}>
          {headline}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <Text style={[styles.interstitialSub, { color: colors.textSecondary }]}>
          {subline}
        </Text>
      </Animated.View>
    </StepLayout>
  );
}

// ─── Screen 8: Height ──────────────────────────────────────────────────────────

export function HeightStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout cta="Next" onNext={onNext} onBack={onBack}>
      <View style={styles.pickerContent}>
        <Text style={[styles.headline, { color: colors.text }]}>
          How tall are you?
        </Text>

        <UnitToggle
          options={[
            { value: 'ft' as const, label: 'ft / in' },
            { value: 'cm' as const, label: 'cm' },
          ]}
          value={data.heightUnit}
          onChange={(v) => update({ heightUnit: v })}
        />

        {data.heightUnit === 'ft' ? (
          <View style={styles.dualStepper}>
            <ValueStepper
              value={data.heightFeet}
              onChange={(v) => update({ heightFeet: v })}
              min={3}
              max={7}
              step={1}
              label="ft"
            />
            <ValueStepper
              value={data.heightInches}
              onChange={(v) => update({ heightInches: v })}
              min={0}
              max={11}
              step={1}
              label="in"
            />
          </View>
        ) : (
          <ValueStepper
            value={data.heightCm}
            onChange={(v) => update({ heightCm: v })}
            min={120}
            max={230}
            step={1}
            label="cm"
          />
        )}
      </View>
    </StepLayout>
  );
}

// ─── Screen 9: Age Range ───────────────────────────────────────────────────────

const AGE_RANGES = ['18–24', '25–34', '35–44', '45–54', '55+'];

export function AgeStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();

  return (
    <StepLayout cta="Next" onNext={onNext} onBack={onBack} ctaDisabled={!data.ageRange}>
      <View style={styles.topContent}>
        <Text style={[styles.headline, { color: colors.text }]}>
          How old are you?
        </Text>
        <View style={styles.cardGap}>
          {AGE_RANGES.map((range) => (
            <Pressable
              key={range}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ ageRange: range }); }}
              style={[
                styles.ageCard,
                {
                  backgroundColor: data.ageRange === range ? 'rgba(34,166,84,0.08)' : colors.surface,
                  borderColor: data.ageRange === range ? '#22a654' : colors.surfaceBorder,
                },
              ]}
            >
              {Platform.OS === 'ios' && (
                <SymbolView name="calendar" style={{ width: 22, height: 22 }} tintColor={data.ageRange === range ? '#22a654' : colors.textTertiary} />
              )}
              <Text
                style={[
                  styles.ageLabel,
                  { color: data.ageRange === range ? '#22a654' : colors.text },
                ]}
              >
                {range}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 10: Projection (Graph) ─────────────────────────────────────────────

const GRAPH_H = 140;
const GRAPH_PAD = { top: 10, bottom: 10, left: 8, right: 10 };

function buildCurvePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

// Deterministic jitter so it doesn't change on re-renders
const JITTER = [0, -6, 9, -4, 11, -8, 5, -10, 7, -3, 8, -6];

function ProjectionGraph({
  current,
  goal,
  withWeeks,
  withoutWeeks,
  width,
  unit,
}: {
  current: number;
  goal: number;
  withWeeks: number;
  withoutWeeks: number;
  width: number;
  unit: 'lb' | 'kg';
}) {
  const colors = useThemeColors();
  const plotW = width - GRAPH_PAD.left - GRAPH_PAD.right;
  const plotH = GRAPH_H - GRAPH_PAD.top - GRAPH_PAD.bottom;
  const maxWeeks = withoutWeeks;
  const numPoints = 10;
  const isMaintaining = Math.abs(current - goal) < 0.01;

  const maintenanceBand = unit === 'lb' ? 4 : 2;
  const minW = isMaintaining ? current - maintenanceBand : Math.min(current, goal);
  const maxW = isMaintaining ? current + maintenanceBand : Math.max(current, goal);
  const range = maxW - minW || 1;

  const mapY = (w: number) =>
    GRAPH_PAD.top + ((maxW - w) / range) * plotH;

  const slowPoints: { x: number; y: number }[] = [];
  const fastPoints: { x: number; y: number }[] = [];

  if (isMaintaining) {
    const slowDrift = [0, 0.45, -0.25, 0.7, -0.55, 0.85, -0.4, 0.55, -0.8, 0.25, 0.65];
    const fastDrift = [0, 0.08, -0.05, 0.06, -0.04, 0.04, -0.03, 0.03, -0.02, 0.02, 0];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = GRAPH_PAD.left + t * plotW;
      slowPoints.push({ x, y: mapY(current + slowDrift[i] * maintenanceBand) });
      fastPoints.push({ x, y: mapY(current + fastDrift[i] * maintenanceBand) });
    }
  } else {
    // Gray line: full x-axis, wobbly, only reaches ~55% of goal
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const slowProgress = t * 0.55;
      const slowWeight = current + (goal - current) * slowProgress;
      const x = GRAPH_PAD.left + t * plotW;
      const jitter = i === 0 ? 0 : JITTER[i % JITTER.length];
      slowPoints.push({ x, y: mapY(slowWeight) + jitter });
    }

    // Green line: ends at a visually prominent position (at least 55% of width)
    const rawRatio = withWeeks / maxWeeks;
    const fastRatio = Math.max(0.55, Math.min(0.75, rawRatio + 0.3));
    const fastNumPoints = 7;
    for (let i = 0; i <= fastNumPoints; i++) {
      const t = i / fastNumPoints;
      // easeOutCubic so the curve decelerates naturally
      const eased = 1 - Math.pow(1 - t, 3);
      const fastWeight = current + (goal - current) * eased;
      const x = GRAPH_PAD.left + t * fastRatio * plotW;
      fastPoints.push({ x, y: mapY(fastWeight) });
    }
  }

  const slowPath = buildCurvePath(slowPoints);
  const fastPath = buildCurvePath(fastPoints);

  const slowEnd = slowPoints[slowPoints.length - 1];
  const fastEnd = fastPoints[fastPoints.length - 1];

  return (
    <View style={[styles.graphContainer, { overflow: 'hidden', borderRadius: 12 }]}>
      <Canvas style={{ width, height: GRAPH_H }}>
        {/* Slow line (gray, wobbly, doesn't reach goal) */}
        <Path
          path={slowPath}
          style="stroke"
          strokeWidth={2.5}
          color={colors.textTertiary}
          opacity={0.35}
          strokeCap="round"
          strokeJoin="round"
        />
        <Circle cx={slowEnd.x} cy={slowEnd.y} r={4} color={colors.textTertiary} opacity={0.35} />

        {/* Fast line (green, bold, smooth) */}
        <Path
          path={fastPath}
          style="stroke"
          strokeWidth={3.5}
          color="#22a654"
          strokeCap="round"
          strokeJoin="round"
        />
        <Circle cx={fastEnd.x} cy={fastEnd.y} r={5} color="#22a654" />
      </Canvas>

    </View>
  );
}

// ─── Interstitial: Social Proof ──────────────────────────────────────────────

export function SocialProofStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <StepLayout cta="I'm in" onNext={onNext} centered>
      <Animated.View entering={FadeIn.duration(600)}>
        <Text style={[styles.interstitialBig, { color: colors.text }]}>
          Join 10,000+ people
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={[styles.interstitialSub, { color: colors.textSecondary }]}>
          who eat out and still hit their goals
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(800).duration(400)}>
        <Text style={[styles.interstitialSub, { color: colors.text }]}>
          {data.name}, you're next.
        </Text>
      </Animated.View>
    </StepLayout>
  );
}

// ─── Screen 10: Projection ──────────────────────────────────────────────────

export function ProjectionStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const [graphW, setGraphW] = React.useState(0);

  useEffect(() => {
    const t = setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 600);
    return () => clearTimeout(t);
  }, []);

  const diff = Math.abs(data.currentWeight - data.goalWeight);
  const isLb = data.weightUnit === 'lb';
  const diffLbs = isLb ? diff : diff * 2.205;
  const isMaintaining = diff < 0.01;

  const withApp = Math.max(4, Math.round(diffLbs / 1.5));
  const withoutApp = Math.max(8, Math.round(diffLbs / 0.5));
  const multiplier = (withoutApp / withApp).toFixed(1).replace(/\.0$/, '');
  const maintenanceBand = isLb ? 4 : 2;

  // Heavier weight always at top of graph
  const topWeight = isMaintaining
    ? data.currentWeight + maintenanceBand
    : Math.max(data.currentWeight, data.goalWeight);
  const bottomWeight = isMaintaining
    ? data.currentWeight - maintenanceBand
    : Math.min(data.currentWeight, data.goalWeight);
  const topIsGoal = !isMaintaining && data.goalWeight >= data.currentWeight;
  const title = isMaintaining
    ? `${data.name}, here's how\nyou stay on track`
    : `${data.name}, look at this`;
  const badgeText = isMaintaining
    ? 'Stay closer to your goal with HealMeal'
    : `${multiplier}x faster with HealMeal`;
  const footnote = isMaintaining
    ? 'Eating out without knowing the macros drifts your weight. With HealMeal, you stay where you want to be.'
    : 'Based on users with a similar starting point';
  const legend = {
    without: 'Without HealMeal',
    with: 'With HealMeal',
  };

  return (
    <StepLayout cta="Show me my plan" onNext={onNext}>
      <View style={styles.projectionContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.headline, { color: colors.text }]}>
            {title}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={[styles.graphCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            {/* Y-axis labels: heavier on top, lighter on bottom */}
            <View style={styles.graphYAxis}>
              <Text style={[styles.graphYLabel, { color: isMaintaining ? colors.text : topIsGoal ? '#22a654' : colors.text }]}>
                {formatWeightValue(topWeight, data.weightUnit)} {data.weightUnit}
              </Text>
              <Text style={[styles.graphYLabel, { color: isMaintaining ? colors.text : topIsGoal ? colors.text : '#22a654' }]}>
                {formatWeightValue(bottomWeight, data.weightUnit)} {data.weightUnit}
              </Text>
            </View>

            <View
              style={{ flex: 1 }}
              onLayout={(e) => setGraphW(Math.floor(e.nativeEvent.layout.width))}
            >
              {graphW > 0 && (
                <ProjectionGraph
                  current={data.currentWeight}
                  goal={data.goalWeight}
                  withWeeks={withApp}
                  withoutWeeks={withoutApp}
                  width={graphW}
                  unit={data.weightUnit}
                />
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.savedBadgeLarge}>
            <Text style={styles.savedTextLarge}>
              {badgeText}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.graphLegend}>
          <View style={styles.graphLegendItem}>
            <View style={[styles.graphLegendDot, styles.graphLegendDotMuted]} />
            <Text style={[styles.graphLegendText, { color: colors.textTertiary }]}>
              {legend.without}
            </Text>
          </View>
          <View style={styles.graphLegendItem}>
            <View style={[styles.graphLegendDot, styles.graphLegendDotActive]} />
            <Text style={[styles.graphLegendText, { color: colors.text }]}>
              {legend.with}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <Text style={[styles.projFootnote, { color: colors.textTertiary }]}>
            {footnote}
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 11: Dining Frequency ───────────────────────────────────────────────

export function DiningFrequencyStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();
  const calSaved = data.diningFrequency * 300;
  const insightText = useMemo(() => {
    if (data.goal === 'muscle') {
      return `That's ${data.diningFrequency} meals a week where you could be getting way more protein.`;
    }
    if (data.goal === 'balanced') {
      return `${data.diningFrequency} meals a week. Every one is a chance to eat smarter.`;
    }
    return `That's ~${calSaved} hidden calories every week. Gone.`;
  }, [data.goal, data.diningFrequency, calSaved]);

  return (
    <StepLayout cta="Wow" onNext={onNext} onBack={onBack}>
      <View style={styles.pickerContent}>
        <Text style={[styles.headline, { color: colors.text }]}>
          How often do you{'\n'}eat out or order in?
        </Text>

        <ValueStepper
          value={data.diningFrequency}
          onChange={(v) => update({ diningFrequency: v })}
          min={1}
          max={14}
          step={1}
          label="times / week"
        />

        <View style={[styles.insightBox, { backgroundColor: 'rgba(34,166,84,0.06)' }]}>
          <Text style={[styles.insightText, { color: colors.text }]}>
            {data.goal === 'lose' ? (
              <>
                That's <Text style={{ fontWeight: '800', color: '#22a654' }}>~{calSaved} hidden calories</Text> every week. Gone.
              </>
            ) : (
              insightText
            )}
          </Text>
        </View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 12: Frequency Response ─────────────────────────────────────────────

export function FrequencyResponseStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const freq = data.diningFrequency;
  const yearly = freq * 52;

  const content = useMemo(() => {
    if (data.goal === 'muscle') {
      if (freq <= 2) {
        return {
          line1: `Even ${freq} meals out add up.`,
          line2: `More protein every time, ${data.name}.`,
        };
      }
      if (freq <= 5) {
        return {
          line1: `${freq} times a week?`,
          line2: `${yearly} chances a year to hit your protein. No meal prep needed.`,
        };
      }
      return {
        line1: 'Almost every day?',
        line2: `We'll make sure every meal works for you, ${data.name}.`,
      };
    }
    if (data.goal === 'balanced') {
      if (freq <= 2) {
        return {
          line1: 'Every meal counts.',
          line2: `We'll keep them balanced, ${data.name}.`,
        };
      }
      if (freq <= 5) {
        return {
          line1: `${freq} times a week?`,
          line2: `${yearly} meals a year. All of them balanced.`,
        };
      }
      return {
        line1: 'Almost every day?',
        line2: "Perfect. That's exactly when HealMeal helps most.",
      };
    }
    if (freq <= 2) {
      return {
        line1: `Even ${freq} meals out matter.`,
        line2: `We'll make every one count, ${data.name}.`,
      };
    }
    if (freq <= 5) {
      return {
        line1: `${freq} times a week?`,
        line2: `That's ${yearly} meals a year. Imagine all of them working for you.`,
      };
    }
    return {
      line1: 'Almost every day?',
      line2: `This is exactly what we built HealMeal for, ${data.name}.`,
    };
  }, [data.goal, freq, data.name, yearly]);

  return (
    <StepLayout cta="Let's go" onNext={onNext} centered>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[styles.responseMain, { color: colors.text }]}>{content.line1}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={[styles.responseSub, { color: colors.textSecondary }]}>{content.line2}</Text>
      </Animated.View>
    </StepLayout>
  );
}

// ─── Screen 13: Restaurant Picker ──────────────────────────────────────────────

const RESTAURANTS = [
  "McDonald's", 'Chipotle', "Chick-fil-A", 'Subway',
  'Starbucks', 'Taco Bell', "Wendy's", 'Burger King',
  'Panera Bread', 'Five Guys', 'Sweetgreen', 'Panda Express',
  'Shake Shack', 'Wingstop', "Popeyes", 'KFC',
  "Nando's", 'Pizza Express', 'Wagamama', 'LEON',
];

export function RestaurantsStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();
  const selected = data.selectedRestaurants;

  const toggle = (name: string) => {
    update({
      selectedRestaurants: selected.includes(name)
        ? selected.filter((r) => r !== name)
        : [...selected, name],
    });
  };

  return (
    <StepLayout cta="Those are my spots" onNext={onNext} onBack={onBack} ctaDisabled={selected.length === 0}>
      <Text style={[styles.headline, { color: colors.text, marginBottom: 4, marginTop: 20 }]}>
        Where do you{'\n'}usually eat?
      </Text>
      <Text style={[styles.subHeadline, { color: colors.textSecondary }]}>
        Pick a few
      </Text>

      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {RESTAURANTS.map((name) => {
          const isSelected = selected.includes(name);
          return (
            <Pressable
              key={name}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(name); }}
              style={[
                styles.restaurantCard,
                {
                  backgroundColor: isSelected ? 'rgba(34,166,84,0.08)' : colors.surface,
                  borderColor: isSelected ? '#22a654' : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.restaurantName,
                  { color: isSelected ? '#22a654' : colors.text },
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
              {isSelected && Platform.OS === 'ios' && (
                <SymbolView name="checkmark.circle.fill" style={{ width: 18, height: 18 }} tintColor="#22a654" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </StepLayout>
  );
}

// ─── Screen 14: Dietary Restrictions ───────────────────────────────────────────

const DIETARY_OPTIONS: { label: string; icon: string }[] = [
  { label: 'Vegetarian', icon: 'leaf.fill' },
  { label: 'Vegan', icon: 'leaf.fill' },
  { label: 'Gluten-free', icon: 'xmark.circle.fill' },
  { label: 'Dairy-free', icon: 'drop.fill' },
  { label: 'Keto', icon: 'flame.fill' },
  { label: 'No pork', icon: 'xmark.circle.fill' },
  { label: 'No shellfish', icon: 'xmark.circle.fill' },
  { label: 'Nut-free', icon: 'xmark.circle.fill' },
  { label: 'None of these', icon: 'checkmark.circle.fill' },
];

// ─── Interstitial: Restaurants Confirmation ──────────────────────────────────

export function RestaurantsConfirmStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const count = data.selectedRestaurants.length;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <StepLayout cta="Nice" onNext={onNext} centered>
      <Animated.View entering={FadeIn.duration(500)}>
        <Text style={[styles.interstitialBig, { color: colors.text }]}>
          {count >= 5 ? `Great taste, ${data.name}` : 'We cover 10,000+ restaurants.'}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={[styles.interstitialSub, { color: colors.textSecondary }]}>
          {count >= 5
            ? "We've got all of these —\nand thousands more."
            : count > 0
              ? "You'll always find something."
              : "You'll always find something."}
        </Text>
      </Animated.View>
    </StepLayout>
  );
}

// ─── Screen 14: Dietary Restrictions ─────────────────────────────────────────

export function DietaryRestrictionsStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();
  const selected = data.dietaryRestrictions;

  const toggle = (label: string) => {
    if (label === 'None of these') {
      update({ dietaryRestrictions: selected.includes(label) ? [] : [label] });
      return;
    }
    const without = selected.filter((s) => s !== 'None of these');
    update({
      dietaryRestrictions: without.includes(label)
        ? without.filter((s) => s !== label)
        : [...without, label],
    });
  };

  return (
    <StepLayout cta="Done" onNext={onNext} onBack={onBack}>
      <Text style={[styles.headline, { color: colors.text, marginTop: 20 }]}>
        Any dietary needs?
      </Text>
      <Text style={[styles.subHeadline, { color: colors.textSecondary, marginBottom: 16 }]}>
        We'll filter these out everywhere
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.cardGap}>
          {DIETARY_OPTIONS.map(({ label, icon }) => {
            const isSelected = selected.includes(label);
            return (
              <Pressable
                key={label}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(label); }}
                style={[
                  styles.dietaryCard,
                  {
                    backgroundColor: isSelected ? 'rgba(34,166,84,0.08)' : colors.surface,
                    borderColor: isSelected ? '#22a654' : colors.surfaceBorder,
                  },
                ]}
              >
                {Platform.OS === 'ios' && (
                  <SymbolView
                    name={icon as any}
                    style={{ width: 20, height: 20 }}
                    tintColor={isSelected ? '#22a654' : colors.textTertiary}
                  />
                )}
                <Text style={[styles.dietaryLabel, { color: isSelected ? '#22a654' : colors.text }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </StepLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout
  topContent: { paddingTop: 24, gap: 20, flex: 1 },
  pickerContent: { flex: 1, justifyContent: 'center', gap: 24 },

  // Typography
  headline: { fontSize: 34, fontWeight: '800', letterSpacing: -1, fontFamily },
  subHeadline: { fontSize: 16, fontWeight: '500', fontFamily },
  nudge: { fontSize: 15, fontWeight: '500', textAlign: 'center', fontFamily },

  // Response screens
  responseMain: { fontSize: 34, fontWeight: '800', letterSpacing: -1, textAlign: 'center', fontFamily },
  responseSub: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginTop: 12, lineHeight: 26, fontFamily },
  responseBold: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 8, fontFamily },

  // Option cards
  cardGap: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 18, fontWeight: '700', fontFamily },
  optionSub: { fontSize: 14, fontWeight: '500', fontFamily },
  checkCircle: { marginLeft: 'auto' },

  // Value stepper
  stepper: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  chevronBtn: { padding: 12 },
  chevronIcon: { width: 28, height: 28 },
  chevronText: { fontSize: 28 },
  stepperValueWrap: { position: 'relative' },
  stepperValue: { fontSize: 56, fontWeight: '800', letterSpacing: -2, fontFamily },
  editIcon: { width: 18, height: 18, position: 'absolute', bottom: 2, right: -22 },
  editIconFallback: { fontSize: 16, position: 'absolute', bottom: 2, right: -20 },
  stepperLabel: { fontSize: 18, fontWeight: '600', fontFamily },

  // Unit toggle
  unitRow: { flexDirection: 'row', alignSelf: 'center', gap: 4, borderRadius: 100, overflow: 'hidden' },
  unitPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, borderWidth: 1 },
  unitLabel: { fontSize: 15, fontWeight: '700', fontFamily },

  // Age
  ageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  ageLabel: { fontSize: 20, fontWeight: '700', fontFamily },

  // Projection
  projectionContent: { flex: 1, justifyContent: 'center', gap: 20 },
  graphCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 8,
  },
  graphYAxis: {
    justifyContent: 'space-between',
    height: GRAPH_H,
    paddingVertical: 10,
  },
  graphYLabel: { fontSize: 13, fontWeight: '700', fontFamily },
  graphLegend: {
    gap: 8,
    alignItems: 'center',
  },
  graphLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  graphLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  graphLegendDotMuted: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  graphLegendDotActive: {
    backgroundColor: '#22a654',
  },
  graphLegendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily,
  },
  graphContainer: { flex: 1, gap: 12 },
  graphLabels: { gap: 6, paddingLeft: 4 },
  savedBadgeLarge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(34,166,84,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  savedTextLarge: { color: '#22a654', fontSize: 15, fontWeight: '800', fontFamily },
  projFootnote: { fontSize: 13, fontWeight: '500', textAlign: 'center', fontFamily },

  // Frequency
  insightBox: {
    padding: 16,
    borderRadius: 14,
  },
  insightText: { fontSize: 16, fontWeight: '500', textAlign: 'center', lineHeight: 24, fontFamily },

  // Restaurant grid
  gridScroll: { flex: 1, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  restaurantCard: {
    width: '48.5%' as any,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  restaurantName: { fontSize: 15, fontWeight: '600', fontFamily },

  // Dietary
  dietaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  dietaryLabel: { fontSize: 17, fontWeight: '600', fontFamily },

  // Dual stepper
  dualStepper: { flexDirection: 'row', justifyContent: 'center', gap: 40 },

  // Goal social proof
  // Interstitials
  interstitialBig: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
    fontFamily,
  },
  interstitialSub: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    fontFamily,
  },
});
