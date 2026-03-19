import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Share,
  Platform,
  ActionSheetIOS,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import * as Device from 'expo-device';
import Purchases from 'react-native-purchases';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAlternateAppIcon, getAppIconName } from 'expo-alternate-app-icons';
import { useThemeColors, Spacing, Typography } from '@/constants/theme';
import { useSettings } from '@/hooks/useSettings';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useProfile, GOAL_LABELS, DIETARY_OPTIONS, type Goal } from '@/hooks/useProfile';
import { useLocation } from '@/hooks/useLocation';
import { posthog } from '@/analytics';
import { showPrompt } from '@/utils/prompt';
let MapkitSearch: any = null;
try { MapkitSearch = require('modules/mapkit-search').MapkitSearch; } catch {}
import { WeightEntry } from '@/api/types';

const APP_ICONS = [
  { name: null, label: 'Classic', source: require('@/../assets/images/icon2.png') },
  { name: 'FullBody', label: 'Full Body', source: require('@/../assets/images/icon.png') },
  { name: 'Sparkle', label: 'Sparkle', source: require('@/../assets/images/icon3.png') },
  { name: 'StarEyes', label: 'Star Eyes', source: require('@/../assets/images/icon4.png') },
] as const;

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { settings, isLoaded, updateSettings } = useSettings();
  const { reset: resetOnboarding } = useOnboarding();
  const { profile, updateGoal, updateDietaryRestrictions, updateName, updateHeight, updateDiningFrequency } = useProfile();
  const { coords } = useLocation();
  const [activeIcon, setActiveIcon] = useState<string | null>(null);
  const [dietaryModalVisible, setDietaryModalVisible] = useState(false);

  useEffect(() => {
    setActiveIcon(getAppIconName());
  }, []);

  const [switching, setSwitching] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleIconChange = (iconName: string | null) => {
    if (iconName === activeIcon || switching) return;
    posthog.capture('app_icon_changed', { icon: iconName ?? 'default' });
    setSwitching(true);
    setActiveIcon(iconName);
    // iOS throttles icon changes — delay to avoid "Resource temporarily unavailable"
    setTimeout(async () => {
      try {
        await setAlternateAppIcon(iconName);
      } catch (e) {
        setActiveIcon(getAppIconName());
      } finally {
        setSwitching(false);
      }
    }, 500);
  };

  const streak = useMemo(() => calcStreak(settings.weightHistory), [settings.weightHistory]);

  const sendFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    setSending(true);
    try {
      const rcInfo = await Purchases.getCustomerInfo();
      const phId = await posthog.getDistinctId();
      const emailLine = feedbackEmail.trim() ? `\nEmail: ${feedbackEmail.trim()}` : '';
      const deviceInfo = `${Device.modelName ?? 'Unknown'} · ${Platform.OS} ${Platform.Version} · v1.0.0`;
      const response = await fetch('https://room-ai-web.vercel.app/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: 'HealMeal',
          userID: rcInfo.originalAppUserId,
          feedback: `${feedbackMessage.trim()}${emailLine}\n\nDevice: ${deviceInfo}\nPostHog: ${phId}`,
        }),
      });
      if (!response.ok) throw new Error(`Feedback API error: ${response.status}`);
      posthog.capture('feedback_sent');
      setFeedbackMessage('');
      setFeedbackEmail('');
      setFeedbackVisible(false);
      Alert.alert('Thanks!', 'Your feedback has been sent.');
    } catch {
      Alert.alert('Error', 'Could not send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const shareApp = () => {
    Share.share({
      message: 'Check out HealMeal — find healthy meals at restaurants near you! https://apps.apple.com/app/healmeal/id6744708838',
    });
    posthog.capture('app_shared');
  };

  const rateApp = async () => {
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
        posthog.capture('rate_app_tapped', { source: 'settings' });
      }
    } catch {}
  };

  if (!isLoaded) return null;

  const editGoalWeight = () => {
    showPrompt({
      title: 'Goal Weight',
      message: 'Enter your goal weight in kg',
      defaultValue: settings.goalWeight > 0 ? String(settings.goalWeight) : '',
      keyboardType: 'decimal-pad',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            const num = parseFloat(text);
            if (!isNaN(num) && num > 0) {
              posthog.capture('goal_weight_updated', { goal_weight_kg: num, $set: { goal_weight: num } });
              void updateSettings({ goalWeight: num });
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[Typography.largeTitle, styles.title, { color: colors.text }]}>
          Settings
        </Text>

        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          WEIGHT
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Pressable style={styles.row} onPress={() => router.push('/(settings)/weight-history')}>
            <Text style={[styles.label, { color: colors.text }]}>Current Weight</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {settings.currentWeight > 0 ? `${settings.currentWeight} kg` : 'Not set'} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={editGoalWeight}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Weight</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {settings.goalWeight > 0 ? `${settings.goalWeight} kg` : 'Tap to set'} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.row}>
            <View style={styles.streakLabel}>
              <SymbolView name="flame.fill" size={18} tintColor="#FF9500" />
              <Text style={[styles.label, { color: colors.text }]}>Streak</Text>
            </View>
            <Text style={[styles.value, { color: streak > 0 ? '#FF9500' : colors.textTertiary }]}>
              {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          MY PROFILE
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Name */}
          <Pressable
            style={styles.row}
            onPress={() => {
              showPrompt({
                title: 'Name',
                message: 'Enter your name',
                defaultValue: profile.name,
                buttons: [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Save', onPress: (text) => { if (text.trim()) void updateName(text.trim()); } },
                ],
              });
            }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {profile.name || 'Not set'} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Height */}
          <Pressable
            style={styles.row}
            onPress={() => {
              if (profile.heightUnit === 'cm') {
                showPrompt({
                  title: 'Height',
                  message: 'Enter your height in cm',
                  defaultValue: profile.heightCm > 0 ? String(profile.heightCm) : '',
                  keyboardType: 'number-pad',
                  buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: (text) => {
                      const num = parseInt(text, 10);
                      if (!isNaN(num) && num > 0) void updateHeight({ cm: num });
                    }},
                  ],
                });
              } else {
                showPrompt({
                  title: 'Height (feet)',
                  message: 'Enter feet',
                  defaultValue: String(profile.heightFeet),
                  keyboardType: 'number-pad',
                  buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Next', onPress: (feetText) => {
                      const feet = parseInt(feetText, 10);
                      if (isNaN(feet)) return;
                      showPrompt({
                        title: 'Height (inches)',
                        message: 'Enter inches',
                        defaultValue: String(profile.heightInches),
                        keyboardType: 'number-pad',
                        buttons: [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Save', onPress: (inchText) => {
                            const inches = parseInt(inchText, 10);
                            if (!isNaN(inches)) void updateHeight({ feet, inches });
                          }},
                        ],
                      });
                    }},
                  ],
                });
              }
            }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Height</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {profile.heightUnit === 'ft'
                ? `${profile.heightFeet}'${profile.heightInches}"`
                : `${profile.heightCm} cm`} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Dining Frequency */}
          <Pressable
            style={styles.row}
            onPress={() => {
              showPrompt({
                title: 'Dining Frequency',
                message: 'How many times per week do you eat out?',
                defaultValue: String(profile.diningFrequency),
                keyboardType: 'number-pad',
                buttons: [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Save', onPress: (text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num >= 0) void updateDiningFrequency(num);
                  }},
                ],
              });
            }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Dining Out</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {profile.diningFrequency}x / week ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Goal */}
          <Pressable
            style={styles.row}
            onPress={() => {
              if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    options: ['Cancel', 'Lose weight', 'Build muscle', 'Stay balanced'],
                    cancelButtonIndex: 0,
                  },
                  (index) => {
                    const goals: Goal[] = ['lose', 'muscle', 'balanced'];
                    if (index > 0) {
                      const goal = goals[index - 1];
                      posthog.capture('profile_goal_updated', { goal });
                      void updateGoal(goal);
                    }
                  },
                );
              } else {
                Alert.alert('Goal', 'Select your goal', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Lose weight', onPress: () => { posthog.capture('profile_goal_updated', { goal: 'lose' }); void updateGoal('lose'); } },
                  { text: 'Build muscle', onPress: () => { posthog.capture('profile_goal_updated', { goal: 'muscle' }); void updateGoal('muscle'); } },
                  { text: 'Stay balanced', onPress: () => { posthog.capture('profile_goal_updated', { goal: 'balanced' }); void updateGoal('balanced'); } },
                ]);
              }
            }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Goal</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {profile.goal ? GOAL_LABELS[profile.goal] : 'Not set'} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={() => setDietaryModalVisible(true)}>
            <Text style={[styles.label, { color: colors.text }]}>Dietary Restrictions</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]} numberOfLines={1}>
              {profile.dietaryRestrictions.length > 0
                ? profile.dietaryRestrictions.join(', ')
                : 'None'} ›
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          SUPPORT
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Pressable style={styles.row} onPress={() => setFeedbackVisible(true)}>
            <Text style={[styles.label, { color: colors.text }]}>Send Feedback</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={rateApp}>
            <Text style={[styles.label, { color: colors.text }]}>Rate on App Store</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={shareApp}>
            <Text style={[styles.label, { color: colors.text }]}>Share App</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          APP ICON
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.iconGrid}>
            {APP_ICONS.map((icon) => {
              const isActive = activeIcon === icon.name;
              return (
                <Pressable
                  key={icon.label}
                  onPress={() => handleIconChange(icon.name)}
                  style={styles.iconOption}
                >
                  <View style={[
                    styles.iconImageWrapper,
                    isActive && { borderColor: colors.brandGreen, borderWidth: 3 },
                  ]}>
                    <Image source={icon.source} style={styles.iconImage} />
                  </View>
                  <Text style={[styles.iconLabel, { color: isActive ? colors.brandGreen : colors.textSecondary }]}>
                    {icon.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          INFORMATION
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Pressable style={styles.row} onPress={() => router.push('/(settings)/information')}>
            <Text style={[styles.label, { color: colors.text }]}>About Our Data</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={() => Linking.openURL('https://hachlyai.com/tos')}>
            <Text style={[styles.label, { color: colors.text }]}>Terms of Service</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={() => Linking.openURL('https://hachlyai.com/privacy-policy')}>
            <Text style={[styles.label, { color: colors.text }]}>Privacy Policy</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          ABOUT
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Version</Text>
            <Text style={[styles.value, { color: colors.textTertiary }]}>1.0.0</Text>
          </View>

          {__DEV__ && (
            <>
              <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
              <Pressable style={styles.row} onPress={resetOnboarding}>
                <Text style={[styles.label, { color: colors.text }]}>Replay Onboarding</Text>
                <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
              </Pressable>
            </>
          )}

          {__DEV__ && (
            <>
              <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
              <Pressable
                style={styles.row}
                onPress={async () => {
                  try {
                    const lat = coords?.latitude ?? 51.5074;
                    const lng = coords?.longitude ?? -0.1278;
                    const results = await MapkitSearch.searchNearbyAll(lat, lng, 3);
                    const uniqueNames = [...new Set(results.map((r: any) => r.name))];

                    // Send to backend for matching
                    const res = await fetch('https://healmeal-api.politesky-13f5ab28.uksouth.azurecontainerapps.io/restaurants/match', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ names: uniqueNames }),
                    });
                    const data = await res.json();

                    const matched = data.chains?.map((c: any) => `${c.name} (${c.mealCount} meals)`).join('\n') || 'none';
                    const unmatchedCount = data.unmatched?.length || 0;

                    Alert.alert(
                      `${data.chains?.length || 0} chains matched`,
                      `From ${uniqueNames.length} unique names:\n\n${matched}\n\n${unmatchedCount} unmatched`,
                    );
                  } catch (e: any) {
                    Alert.alert('MapKit Error', e.message);
                  }
                }}
              >
                <Text style={[styles.label, { color: '#c94444' }]}>DEV: Test MapKit Search</Text>
                <Text style={[styles.value, { color: colors.textSecondary }]}>›</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={dietaryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Dietary Restrictions</Text>
            <Pressable onPress={() => setDietaryModalVisible(false)}>
              <Text style={[styles.modalSend, { color: colors.brandGreen }]}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.dietaryGrid} showsVerticalScrollIndicator={false}>
            {DIETARY_OPTIONS.map(({ label, icon }) => {
              const isSelected = profile.dietaryRestrictions.includes(label);
              return (
                <Pressable
                  key={label}
                  onPress={() => {
                    const current = profile.dietaryRestrictions;
                    const next = isSelected
                      ? current.filter((r) => r !== label)
                      : [...current, label];
                    posthog.capture('profile_dietary_updated', { restrictions: next });
                    void updateDietaryRestrictions(next);
                  }}
                  style={[
                    styles.dietaryChip,
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
                  <Text style={[styles.dietaryChipLabel, { color: isSelected ? '#22a654' : colors.text }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={feedbackVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setFeedbackVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Feedback</Text>
            <Pressable onPress={sendFeedback} disabled={!feedbackMessage.trim() || sending}>
              <Text style={[styles.modalSend, { color: feedbackMessage.trim() && !sending ? colors.brandGreen : colors.textTertiary }]}>
                {sending ? 'Sending...' : 'Send'}
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={[styles.feedbackInput, styles.feedbackMessage, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textTertiary}
            value={feedbackMessage}
            onChangeText={setFeedbackMessage}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <TextInput
            style={[styles.feedbackInput, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
            placeholder="Email (optional — if you'd like a reply)"
            placeholderTextColor={colors.textTertiary}
            value={feedbackEmail}
            onChangeText={setFeedbackEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  title: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  label: { fontSize: 16, fontWeight: '500' },
  value: { fontSize: 16, fontWeight: '600' },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  iconOption: {
    alignItems: 'center',
    gap: 8,
  },
  iconImageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 17,
    fontWeight: '400',
  },
  modalSend: {
    fontSize: 17,
    fontWeight: '600',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  feedbackMessage: {
    height: 160,
  },
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 20,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dietaryChipLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

function calcStreak(history: WeightEntry[]): number {
  if (history.length === 0) return 0;

  const dates = new Set(history.map((e) => e.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today or yesterday has an entry (allow logging later in the day)
  const todayStr = fmt(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = fmt(yesterday);

  if (!dates.has(todayStr) && !dates.has(yesterdayStr)) return 0;

  // Count consecutive days backwards from the most recent logged day
  const start = dates.has(todayStr) ? today : yesterday;
  let streak = 0;
  const d = new Date(start);
  while (dates.has(fmt(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
