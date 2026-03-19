import { ActionSheetIOS, Alert, Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import * as Device from 'expo-device';
import { posthog } from '@/analytics';
import { showPrompt } from '@/utils/prompt';

const FEEDBACK_URL = 'https://room-ai-web.vercel.app/api/feedback';

const MEAL_OPTIONS = [
  'Wrong calories/nutrition',
  'Wrong photo',
  'Item no longer available',
  'Wrong restaurant',
  'Other',
  'Cancel',
];

const RESTAURANT_OPTIONS = [
  'Wrong location',
  'Restaurant closed',
  'Menu is outdated',
  'Other',
  'Cancel',
];

async function sendReport(reason: string, context: string, comment?: string): Promise<boolean> {
  try {
    const rcInfo = await Purchases.getCustomerInfo();
    const phId = await posthog.getDistinctId();
    const device = `${Device.modelName ?? 'Unknown'} · ${Platform.OS} ${Platform.Version}`;

    const feedback = comment
      ? `[Report] ${reason}\n${context}\nComment: ${comment}\n\nDevice: ${device}\nPostHog: ${phId}`
      : `[Report] ${reason}\n${context}\n\nDevice: ${device}\nPostHog: ${phId}`;

    const response = await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: 'HealMeal',
        userID: rcInfo.originalAppUserId,
        feedback,
      }),
    });
    if (!response.ok) throw new Error(`Feedback API error: ${response.status}`);

    posthog.capture('report_submitted', { reason, type: context.startsWith('Meal:') ? 'meal' : 'restaurant' });
    return true;
  } catch {
    return false;
  }
}

async function submitReport(reason: string, context: string, comment?: string) {
  const ok = await sendReport(reason, context, comment);
  Alert.alert(
    ok ? 'Thanks!' : 'Error',
    ok ? 'Report submitted.' : 'Could not submit report. Please try again.'
  );
}

function promptComment(reason: string, context: string) {
  showPrompt({
    title: 'Add a comment',
    message: 'Optional — tell us more',
    buttons: [
      { text: 'Skip', style: 'cancel', onPress: () => { void submitReport(reason, context); } },
      {
        text: 'Send',
        onPress: (text) => {
          const comment = text.trim();
          void submitReport(reason, context, comment.length > 0 ? comment : undefined);
        },
      },
    ],
  });
}

export function reportMeal(mealName: string, restaurant: string) {
  const context = `Meal: ${mealName} at ${restaurant}`;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Report an issue',
        options: MEAL_OPTIONS,
        cancelButtonIndex: MEAL_OPTIONS.length - 1,
        destructiveButtonIndex: undefined,
      },
      (index) => {
        if (index === MEAL_OPTIONS.length - 1) return; // Cancel
        const reason = MEAL_OPTIONS[index];
        if (reason === 'Other') {
          promptComment('Other', context);
        } else {
          void submitReport(reason, context);
        }
      },
    );
  } else {
    Alert.alert('Report an issue', undefined, [
      ...MEAL_OPTIONS.slice(0, -1).map((option) => ({
        text: option,
        onPress: () => {
          if (option === 'Other') {
            promptComment('Other', context);
          } else {
            void submitReport(option, context);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }
}

export function reportRestaurant(restaurantName: string) {
  const context = `Restaurant: ${restaurantName}`;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Report an issue',
        options: RESTAURANT_OPTIONS,
        cancelButtonIndex: RESTAURANT_OPTIONS.length - 1,
        destructiveButtonIndex: undefined,
      },
      (index) => {
        if (index === RESTAURANT_OPTIONS.length - 1) return; // Cancel
        const reason = RESTAURANT_OPTIONS[index];
        if (reason === 'Other') {
          promptComment('Other', context);
        } else {
          void submitReport(reason, context);
        }
      },
    );
  } else {
    Alert.alert('Report an issue', undefined, [
      ...RESTAURANT_OPTIONS.slice(0, -1).map((option) => ({
        text: option,
        onPress: () => {
          if (option === 'Other') {
            promptComment('Other', context);
          } else {
            void submitReport(option, context);
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }
}
