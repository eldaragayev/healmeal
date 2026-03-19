import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/constants/theme';
import { StepLayout } from '../StepLayout';
import type { StepProps } from '@/hooks/useOnboarding';

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });
type GoalKind = 'lose' | 'muscle' | 'balanced';

// ─── Shared: SF Icon ───────────────────────────────────────────────────────────

function SFIcon({ name, size = 44, color }: { name: string; size?: number; color: string }) {
  if (Platform.OS !== 'ios') return <View style={{ width: size, height: size }} />;
  return <SymbolView name={name as any} style={{ width: size, height: size }} tintColor={color} />;
}

function getGoalKind(goal: StepProps['data']['goal']): GoalKind {
  if (goal === 'muscle') return 'muscle';
  if (goal === 'balanced') return 'balanced';
  return 'lose';
}

function getAnalyzingTexts(goal: GoalKind) {
  if (goal === 'muscle') {
    return [
      'Scanning restaurants near you...',
      'Checking 50,000+ menu items...',
      'Finding high-protein meals near you...',
      'Your results are ready \u2713',
    ];
  }
  if (goal === 'balanced') {
    return [
      'Scanning restaurants near you...',
      'Checking 50,000+ menu items...',
      "Finding balanced options you'll actually want...",
      'Your results are ready \u2713',
    ];
  }
  return [
    'Scanning restaurants near you...',
    'Checking 50,000+ menu items...',
    'Finding low-calorie meals that actually taste good...',
    'Your results are ready \u2713',
  ];
}

function getPainPoint2Content(goal: GoalKind) {
  if (goal === 'muscle') {
    return {
      line1: "That 'protein bowl'?",
      line2: '18g of protein. Mostly rice.',
      line3: 'The plain chicken breast next to it?',
      emoji: '',
      punch: '42g. And cheaper.',
    };
  }
  if (goal === 'balanced') {
    return {
      line1: 'That salad you felt good about?',
      line2: 'The dressing alone is 400 calories.',
      line3: 'The burger was actually lighter.',
      emoji: '',
      punch: '',
    };
  }
  return {
    line1: "That 'healthy' wrap?",
    line2: '680 calories.',
    line3: "The burger you didn't order?",
    emoji: '',
    punch: 'Only 480.',
  };
}

function getCalorieGapContent(goal: GoalKind) {
  if (goal === 'muscle') {
    return {
      title: 'The protein trap',
      firstLabel: 'What it looks like',
      firstValue: 35,
      secondLabel: 'What you actually get',
      secondValue: 18,
      maxValue: 40,
      suffix: 'g',
      stat: "Most 'high-protein' options aren't.",
      source: 'UK chain nutrition data',
    };
  }
  if (goal === 'balanced') {
    return {
      title: 'The portion trap',
      firstLabel: 'What feels right',
      firstValue: 600,
      secondLabel: 'What shows up',
      secondValue: 1200,
      maxValue: 1200,
      suffix: ' cal',
      stat: 'Sauces and sides double the calories.',
      source: 'UK restaurant nutrition data',
    };
  }
  return {
    title: 'The calorie trap',
    firstLabel: 'What you think',
    firstValue: 480,
    secondLabel: 'What it actually is',
    secondValue: 1200,
    maxValue: 1200,
    suffix: ' cal',
    stat: 'People underestimate restaurant calories by 30–50%',
    source: 'BMC Public Health',
  };
}

function getSmartSwapContent(goal: GoalKind) {
  if (goal === 'muscle') {
    return {
      insightLine1: 'Double the protein. Same restaurant.',
      insightStrong: null,
    };
  }
  if (goal === 'balanced') {
    return {
      insightLine1: 'A meal that actually matches your goals.',
      insightStrong: null,
    };
  }
  return {
    insightLine1: 'Half the calories. More protein. Same place.',
    insightStrong: null,
  };
}

const REVIEWS_BY_GOAL: Record<GoalKind, { name: string; text: string }[]> = {
  lose: [
    {
      name: '@sarah_fitness',
      text: "Lost 8 lbs in a month. Didn't stop eating out. Just started ordering differently.",
    },
    {
      name: '@mike.gains',
      text: "It doesn't tell you to stop eating at Chipotle. It tells you WHAT to order.",
    },
    {
      name: '@jenny_k',
      text: "I used to avoid restaurants when dieting. Now they're part of my plan.",
    },
  ],
  muscle: [
    {
      name: '@mike.gains',
      text: "It doesn't tell you to stop eating at Chipotle. It tells you WHAT to order.",
    },
    {
      name: '@sam.lifts',
      text: 'Same restaurants. Same budget. Way more protein.',
    },
    {
      name: '@jenny_k',
      text: 'The protein filter alone is worth it. I hit my macros without cooking every meal.',
    },
  ],
  balanced: [
    {
      name: '@nina.food',
      text: "I didn't want a diet app. I just wanted to stop accidentally overeating when I go out.",
    },
    {
      name: '@lee.weeknights',
      text: 'I eat out 4 times a week. Now every meal is a good one without the mental gymnastics.',
    },
    {
      name: '@sam.eats',
      text: 'No calorie obsession. No guilt. Just better picks.',
    },
  ],
};

// ─── Screen 15: Analyzing (Labor Illusion) ─────────────────────────────────────

export function AnalyzingStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const [textIdx, setTextIdx] = useState(0);
  const goalKind = getGoalKind(data.goal);
  const ANALYZING_TEXTS = getAnalyzingTexts(goalKind);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx((i) => {
        if (i >= ANALYZING_TEXTS.length - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, 1500);

    const timeout = setTimeout(onNext, 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onNext]);

  return (
    <StepLayout centered>
      <Image
        source={require('@/../assets/animation/loading.webp')}
        style={styles.analyzeMascot}
        autoplay
      />
      <Animated.View entering={FadeIn.duration(300)} key={textIdx}>
        <Text style={[styles.analyzeText, { color: colors.textSecondary }]}>
          {ANALYZING_TEXTS[textIdx]}
        </Text>
      </Animated.View>
    </StepLayout>
  );
}

// ─── Screen 16: Pain Point 1 — Decision Fatigue ─────────────────────────────

export function PainPoint1Step({ onNext }: StepProps) {
  const colors = useThemeColors();

  useEffect(() => {
    const timers = [
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 500),
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1200),
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 1700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <StepLayout cta="Yep" onNext={onNext}>
      <View style={styles.storyContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.storyLine, { color: colors.text }]}>
            You open the menu.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={[styles.storyLineLight, { color: colors.textSecondary }]}>
            You're hungry. You're tired.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1200).duration(400)}>
          <Text style={[styles.storyPunch, { color: colors.text }]}>
            You pick whatever sounds good.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1700).duration(400)}>
          <Text style={[styles.socialProof, { color: colors.textTertiary }]}>
            Sound familiar?
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 17: Pain Point 2 — Calorie Gap ──────────────────────────────────

function CalorieGapBar({ label, calories, maxCal, color, delay, suffix = '' }: {
  label: string; calories: number; maxCal: number; color: string; delay: number; suffix?: string;
}) {
  const colors = useThemeColors();
  const widthPct = useSharedValue(0);

  useEffect(() => {
    widthPct.value = withDelay(
      delay,
      withTiming(calories / maxCal, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value * 100}%` as any,
    height: 28,
    borderRadius: 8,
    backgroundColor: color,
  }));

  return (
    <View style={styles.calorieBarRow}>
      <Text style={[styles.calorieBarLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.calorieBarTrack}>
        <Animated.View style={barStyle} />
      </View>
      <Text style={[styles.calorieBarCal, { color }]}>~{calories}{suffix}</Text>
      </View>
  );
}

export function PainPoint2Step({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const content = getPainPoint2Content(getGoalKind(data.goal));

  useEffect(() => {
    const timers = [
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 600),
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 1200),
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1800),  // emoji
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 2300),   // punch
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <StepLayout cta="Ugh" onNext={onNext}>
      <View style={styles.storyContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.storyLine, { color: colors.text }]}>
            {content.line1}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Text style={[styles.storyLineLight, { color: colors.textSecondary }]}>
            {content.line2}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1200).duration(400)}>
          <Text style={[styles.storyLine, { color: colors.text }]}>
            {content.line3}
          </Text>
        </Animated.View>

        {content.emoji ? (
          <Animated.View entering={FadeIn.delay(1800).duration(400)}>
            <Text style={styles.storyEmoji}>{content.emoji}</Text>
          </Animated.View>
        ) : null}

        {content.punch ? (
          <Animated.View entering={FadeInDown.delay(2300).duration(400)}>
            <Text style={[styles.storyPunch, { color: colors.textSecondary }]}>
              {content.punch}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </StepLayout>
  );
}

// ─── Screen: Calorie Gap Visualization ──────────────────────────────────────

export function CalorieGapStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const content = getCalorieGapContent(getGoalKind(data.goal));

  return (
    <StepLayout cta="Fix this for me" onNext={onNext}>
      <View style={styles.storyContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.storyLine, { color: colors.text }]}>
            {content.title}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.calorieGapContainer}>
          <CalorieGapBar label={content.firstLabel} calories={content.firstValue} maxCal={content.maxValue} color="#22a654" delay={600} suffix={content.suffix} />
          <CalorieGapBar label={content.secondLabel} calories={content.secondValue} maxCal={content.maxValue} color="#c94444" delay={900} suffix={content.suffix} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1400).duration(400)}>
          <Text style={[styles.calorieGapStat, { color: colors.textTertiary }]}>
            {content.stat}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1800).duration(400)}>
          <Text style={[styles.calorieGapSource, { color: colors.textTertiary }]}>
            {content.source}
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Screen: Solution Reveal — Storytelling ─────────────────────────────────

export function SolutionRevealStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  useEffect(() => {
    const timers = [
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 600),
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1300),   // mascot
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 1800), // "That's HealMeal"
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <StepLayout cta="Show me" onNext={onNext}>
      <View style={styles.storyContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.storyLineLight, { color: colors.textSecondary }]}>
            What if you knew...
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Text style={[styles.storyLine, { color: colors.text }]}>
            exactly what to order{'\n'}at every restaurant near you?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1300).duration(500)}>
          <Image
            source={require('@/../assets/animation/loading.webp')}
            style={styles.storyMascot}
            autoplay
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1800).duration(400)}>
          <Text style={[styles.storyPunchBig, { color: colors.text }]}>
            That's HealMeal.
          </Text>
        </Animated.View>

      </View>
    </StepLayout>
  );
}

// ─── Screen 19: Smart Swaps (Slam Animation) ────────────────────────────────

export function SmartSwapsStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const [slammed, setSlammed] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const content = getSmartSwapContent(getGoalKind(data.goal));

  // Animation values
  const shakeX = useSharedValue(0);
  const badCardScale = useSharedValue(1);
  const badCardOpacity = useSharedValue(1);
  const badCardRotate = useSharedValue(0);
  const crackOpacity = useSharedValue(0);
  const goodCardScale = useSharedValue(0);
  const goodCardTranslateY = useSharedValue(-400);

  const replay = useCallback(() => {
    setSlammed(false);
    shakeX.value = 0;
    badCardScale.value = 1;
    badCardOpacity.value = 1;
    badCardRotate.value = 0;
    crackOpacity.value = 0;
    goodCardScale.value = 0;
    goodCardTranslateY.value = -400;
    setPlayCount((c) => c + 1);
  }, []);

  useEffect(() => {
    // Phase 1 (0.8s): Card starts shaking — something's wrong
    const shakeTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Shake loop
      const shake = () => {
        shakeX.value = withTiming(6, { duration: 50 }, () => {
          shakeX.value = withTiming(-6, { duration: 50 }, () => {
            shakeX.value = withTiming(4, { duration: 50 }, () => {
              shakeX.value = withTiming(-4, { duration: 50 }, () => {
                shakeX.value = withTiming(3, { duration: 40 }, () => {
                  shakeX.value = withTiming(-3, { duration: 40 }, () => {
                    shakeX.value = withTiming(0, { duration: 30 });
                  });
                });
              });
            });
          });
        });
      };
      shake();
      // Second shake burst
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        shake();
      }, 400);
    }, 800);

    // Phase 2 (1.8s): Card "breaks" — cracks appear, card shatters
    const breakTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      crackOpacity.value = withTiming(1, { duration: 150 });
      badCardRotate.value = withTiming(4, { duration: 200 });
      badCardScale.value = withTiming(0.9, { duration: 200 }, () => {
        // Shatter out
        badCardScale.value = withTiming(0.3, { duration: 300, easing: Easing.in(Easing.cubic) });
        badCardOpacity.value = withTiming(0, { duration: 300 });
        badCardRotate.value = withTiming(12, { duration: 300 });
      });
    }, 1800);

    // Phase 3 (2.3s): Good card slams in
    const slamTimer = setTimeout(() => {
      setSlammed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goodCardScale.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.2)) });
      goodCardTranslateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
    }, 2300);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(breakTimer);
      clearTimeout(slamTimer);
    };
  }, [playCount]);

  const badCardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { scale: badCardScale.value },
      { rotate: `${badCardRotate.value}deg` },
    ],
    opacity: badCardOpacity.value,
  }));

  const crackStyle = useAnimatedStyle(() => ({
    opacity: crackOpacity.value,
  }));

  const goodCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: goodCardScale.value },
      { translateY: goodCardTranslateY.value },
    ],
    opacity: goodCardScale.value > 0.01 ? 1 : 0,
  }));

  return (
    <StepLayout cta="I need this" onNext={onNext}>
      <View style={styles.slamContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.slamTitle, { color: colors.text }]}>
            Same restaurant.{'\n'}Different choice.
          </Text>
        </Animated.View>

        {/* Card stack — tap to replay */}
        <Pressable onPress={slammed ? replay : undefined} style={styles.slamCardStack}>
          {/* Bad card (steak + fries) — shakes, cracks, shatters */}
          <Animated.View style={[styles.slamCard, { backgroundColor: colors.surfaceElevated }, badCardAnimStyle]}>
            <Image
              source={require('@/../assets/images/onboarding-steak-fries.jpg')}
              style={styles.slamCardImage}
              contentFit="cover"
            />
            <View style={styles.slamCardInfo}>
              <Text style={[styles.slamCardName, { color: colors.text }]}>Steak & Fries</Text>
              <Text style={[styles.slamCardCal, { color: '#c94444' }]}>1,200 cal · 28g protein</Text>
            </View>
            {/* Crack overlay */}
            <Animated.View style={[styles.crackOverlay, crackStyle]}>
              <View style={styles.crackLine1} />
              <View style={styles.crackLine2} />
              <View style={styles.crackLine3} />
            </Animated.View>
          </Animated.View>

          {/* Good card (chicken burger) — slams down on top */}
          <Animated.View style={[styles.slamCard, styles.slamCardGood, { backgroundColor: colors.surfaceElevated }, goodCardStyle]}>
            <Image
              source={require('@/../assets/images/onboarding-chicken-burger.jpg')}
              style={styles.slamCardImage}
              contentFit="cover"
            />
            <View style={styles.slamCardInfo}>
              <Text style={[styles.slamCardName, { color: colors.text }]}>Chicken Burger</Text>
              <View style={styles.slamCardStats}>
                <Text style={[styles.slamCardCal, { color: '#22a654' }]}>480 cal · 38g protein</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* Bottom text — appears after slam */}
        {slammed && (
          <>
            <Animated.View entering={FadeInDown.duration(400)}>
              <Text style={[styles.slamInsight, { color: colors.textSecondary }]}>
                {content.insightLine1}
                {content.insightStrong ? (
                  <>
                    {'\n'}
                    <Text style={{ fontWeight: '800', color: '#22a654' }}>{content.insightStrong}</Text>
                  </>
                ) : null}
              </Text>
            </Animated.View>
          </>
        )}
      </View>
    </StepLayout>
  );
}

// ─── Screen 20: Backed By Science ─────────────────────────────────────────────

const WILLPOWER_BARS = [
  { label: 'Morning', pct: 1.0, color: '#22a654' },
  { label: 'Lunch', pct: 0.75, color: '#8bc34a' },
  { label: 'Afternoon', pct: 0.50, color: '#FF9500' },
  { label: 'Dinner', pct: 0.25, color: '#c94444' },
];

function WillpowerBar({ label, pct, color, delay }: {
  label: string; pct: number; color: string; delay: number;
}) {
  const colors = useThemeColors();
  const widthPct = useSharedValue(0);

  useEffect(() => {
    widthPct.value = withDelay(
      delay,
      withTiming(pct, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value * 100}%` as any,
    height: 24,
    borderRadius: 6,
    backgroundColor: color,
  }));

  return (
    <View style={styles.willpowerRow}>
      <Text style={[styles.willpowerLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.willpowerTrack}>
        <Animated.View style={barStyle} />
      </View>
    </View>
  );
}

export function BackedByScienceStep({ onNext }: StepProps) {
  const colors = useThemeColors();

  useEffect(() => {
    const t = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <StepLayout cta="That explains it" onNext={onNext}>
      <View style={styles.storyContent}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.storyLine, { color: colors.text }]}>
            Why you always pick wrong at dinner
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.willpowerChart}>
          {WILLPOWER_BARS.map((bar, idx) => (
            <View key={bar.label}>
              <WillpowerBar
                label={bar.label}
                pct={bar.pct}
                color={bar.color}
                delay={700 + idx * 150}
              />
              {bar.label === 'Dinner' && (
                <Text style={[styles.willpowerArrow, { color: colors.textTertiary }]}>
                  {'\u2190'} This is when you're ordering food
                </Text>
              )}
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1800).duration(400)}>
          <Text style={[styles.scienceFootnote, { color: colors.textTertiary }]}>
            Decision fatigue — Journal of Personality {'\u0026'} Social Psychology
          </Text>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Screen 21: Reviews ────────────────────────────────────────────────────────

export function ReviewsStep({ data, onNext }: StepProps) {
  const colors = useThemeColors();
  const reviews = REVIEWS_BY_GOAL[getGoalKind(data.goal)];

  return (
    <StepLayout cta="I want this" onNext={onNext}>
      <View style={styles.reviewContent}>
        <Text style={[styles.reviewTitle, { color: colors.text }]}>
          People like you
        </Text>

        {/* Stars */}
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SFIcon key={i} name="star.fill" size={24} color="#FFB800" />
          ))}
          <Text style={[styles.starLabel, { color: colors.textSecondary }]}>4.9 ★</Text>
        </View>

        {/* Review cards */}
        {reviews.map((review, idx) => (
          <Animated.View
            key={review.name}
            entering={FadeInDown.delay(200 + idx * 150).duration(400)}
            style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SFIcon key={i} name="star.fill" size={12} color="#FFB800" />
                ))}
              </View>
              <Text style={[styles.reviewName, { color: colors.textTertiary }]}>{review.name}</Text>
            </View>
            <Text style={[styles.reviewText, { color: colors.text }]}>{review.text}</Text>
          </Animated.View>
        ))}
      </View>
    </StepLayout>
  );
}

// ─── Screen: Help Us Grow (Rate Us) ────────────────────────────────────────────

export function RateUsStep({ onNext }: StepProps) {
  const colors = useThemeColors();
  const [tapped, setTapped] = useState(false);

  const handleContinue = useCallback(async () => {
    if (tapped) return;
    setTapped(true);
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      }
    } catch {}
    setTimeout(onNext, 3000);
  }, [tapped, onNext]);

  return (
    <StepLayout
      cta="Sure"
      onNext={handleContinue}
      ctaDisabled={tapped}
    >
      <View style={styles.rateContent}>
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.rateEmoji}>💚</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={[styles.rateTitle, { color: colors.text }]}>
            One quick favour?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={[styles.rateSub, { color: colors.textSecondary }]}>
            A rating helps people like you find us
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <View style={styles.rateStars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SFIcon key={i} name="star.fill" size={40} color="#FFB800" />
            ))}
          </View>
        </Animated.View>
      </View>
    </StepLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Analyzing
  analyzeMascot: { width: 100, height: 100, marginBottom: 24 },
  analyzeText: { fontSize: 18, fontWeight: '600', textAlign: 'center', fontFamily },

  // Rate us
  rateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  rateEmoji: { fontSize: 64, marginBottom: 8 },
  rateTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1, textAlign: 'center', fontFamily },
  rateSub: { fontSize: 17, fontWeight: '500', textAlign: 'center', lineHeight: 24, paddingHorizontal: 16, fontFamily },
  rateStars: { flexDirection: 'row', gap: 8, marginTop: 16 },

  // Storytelling
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  storyLine: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 38,
    fontFamily,
  },
  storyLineLight: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily,
  },
  storyEmoji: {
    fontSize: 56,
    marginVertical: 4,
  },
  storyPunch: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontFamily,
  },
  storyPunchBig: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontFamily,
  },
  storyMascot: {
    width: 100,
    height: 100,
    marginVertical: 4,
  },

  // Smart swaps (slam)
  slamContent: { flex: 1, justifyContent: 'center', gap: 24, alignItems: 'center' },
  slamTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1, textAlign: 'center', fontFamily },
  slamCardStack: { width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' },
  slamCard: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'absolute',
  },
  slamCardGood: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  slamCardImage: { width: '100%', height: 180, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  slamCardInfo: { padding: 14, gap: 4 },
  slamCardName: { fontSize: 18, fontWeight: '700', fontFamily },
  slamCardStats: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  slamCardCal: { fontSize: 22, fontWeight: '800', fontFamily },
  slamProteinBadge: { backgroundColor: '#22a654', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  slamProteinText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily },
  slamInsight: { fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 26, fontFamily },
  slamReplay: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 4, fontFamily },
  crackOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  crackLine1: {
    position: 'absolute',
    top: '20%',
    left: '30%',
    width: 120,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    transform: [{ rotate: '35deg' }],
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  } as any,
  crackLine2: {
    position: 'absolute',
    top: '45%',
    left: '15%',
    width: 160,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    transform: [{ rotate: '-20deg' }],
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  } as any,
  crackLine3: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    width: 80,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ rotate: '70deg' }],
    borderRadius: 2,
  } as any,

  // Legacy swap styles (unused but keeping for now)
  swapContent: { flex: 1, justifyContent: 'center', gap: 20 },
  swapTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1, fontFamily },
  swapCard: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 16 },
  swapLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily },
  swapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  swapItem: { alignItems: 'center', gap: 6, flex: 1 },
  swapItemHighlight: {
    backgroundColor: 'rgba(34,166,84,0.06)',
    borderRadius: 14,
    padding: 12,
  },
  swapItemName: { fontSize: 15, fontWeight: '600', fontFamily },
  swapCal: { fontSize: 18, fontWeight: '800', fontFamily },
  proteinBadge: {
    backgroundColor: '#22a654',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginTop: 2,
  },
  proteinText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily },
  swapInsight: { padding: 16, borderRadius: 14 },
  swapInsightText: { fontSize: 16, fontWeight: '500', textAlign: 'center', lineHeight: 24, fontFamily },

  // Social proof (PainPoint1)
  socialProof: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily,
  },

  // Calorie gap (PainPoint2)
  calorieGapContainer: {
    gap: 10,
    marginTop: 8,
  },
  calorieBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 110,
    fontFamily,
  },
  calorieBarTrack: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  calorieBarCal: {
    fontSize: 13,
    fontWeight: '700',
    width: 46,
    textAlign: 'right',
    fontFamily,
  },
  calorieGapStat: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily,
  },
  calorieGapSource: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily,
  },

  // Solution personalized line
  solutionPersonalized: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily,
  },

  // Backed by science / willpower chart
  willpowerChart: {
    gap: 10,
    marginTop: 8,
  },
  willpowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  willpowerLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 70,
    fontFamily,
  },
  willpowerTrack: {
    flex: 1,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  willpowerArrow: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 80,
    fontFamily,
  },
  scienceFootnote: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily,
  },

  // Reviews
  reviewContent: { paddingTop: 24, gap: 16, flex: 1 },
  reviewTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1, fontFamily },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starLabel: { fontSize: 15, fontWeight: '600', marginLeft: 8, fontFamily },
  reviewCard: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewName: { fontSize: 13, fontWeight: '600', fontFamily },
  reviewText: { fontSize: 15, fontWeight: '500', lineHeight: 22, fontFamily },
});
