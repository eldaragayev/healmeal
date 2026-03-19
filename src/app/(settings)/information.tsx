import React from 'react';
import { ScrollView, Text, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Spacing } from '@/constants/theme';

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

export default function InformationScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'About Our Data',
          headerTransparent: true,
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          unstable_headerLeftItems: () => [
            {
              type: 'button' as const,
              label: 'Back',
              icon: { type: 'sfSymbol' as const, name: 'chevron.left' },
              sharesBackground: false,
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.text }]}>
          How HealMeal Works
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          HealMeal helps you explore nutritional information for meals at popular restaurants. Our goal is to make it easier for you to make informed choices when eating out.
        </Text>

        <Text style={[styles.subheading, { color: colors.text }]}>
          Where Our Data Comes From
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          We use a combination of sources to provide nutritional information, including publicly available data from restaurants, government nutrition databases, and AI-based estimation. Where restaurant-provided data is not available, we use artificial intelligence to estimate nutritional values based on standard recipes, ingredients, and portion sizes.
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          We try to improve the accuracy of our data over time, but nutritional values may vary based on preparation methods, portion sizes, regional differences, and ingredient substitutions. The information displayed in the app may not exactly reflect what you receive at the restaurant.
        </Text>

        <Text style={[styles.subheading, { color: colors.text }]}>
          AI-Estimated Values
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Some nutritional values and dietary targets in this app are estimated using artificial intelligence. This includes calorie counts, macronutrient breakdowns, and personalized daily targets. These estimates are based on general nutritional science and publicly available data, but they are approximations and should not be treated as precise measurements.
        </Text>

        <Text style={[styles.subheading, { color: colors.text }]}>
          Not Medical or Health Advice
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          HealMeal is not a medical application. The information provided in this app does not constitute medical advice, health advice, dietary advice, or any form of professional consultation. This app is intended for general informational and educational purposes only.
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          You should not rely on HealMeal as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider or registered dietitian before making any changes to your diet, especially if you have allergies, food intolerances, medical conditions, or are taking medication.
        </Text>

        <Text style={[styles.subheading, { color: colors.text }]}>
          Accuracy & Limitations
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          While we strive to provide helpful information, we make no guarantees regarding the accuracy, completeness, or reliability of any nutritional data, calorie counts, or dietary recommendations displayed in the app. Restaurant menus change frequently, and nutritional content can vary significantly between locations, preparation methods, and serving sizes.
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          HealMeal, its creators, and its affiliates are not responsible for any decisions you make based on the information provided in this app. Use of this app is entirely at your own risk. We expressly disclaim all liability for any adverse effects, health issues, or damages resulting from the use of information obtained through HealMeal.
        </Text>

        <Text style={[styles.subheading, { color: colors.text }]}>
          Allergen Information
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          HealMeal does not provide allergen information. If you have food allergies or intolerances, always verify ingredients directly with the restaurant before ordering. Do not rely on this app to determine whether a meal is safe for you to consume.
        </Text>

        <Text style={[styles.subheading, { color: colors.text }]}>
          Educational Purpose
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          This app is designed for educational and informational purposes only. It is intended to help users develop a general awareness of nutritional content in restaurant meals. It is not designed to diagnose, treat, cure, or prevent any disease or health condition.
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          By using HealMeal, you acknowledge and agree that the app provides estimated information only, and that you assume full responsibility for any dietary choices you make.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 60, paddingTop: 16 },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 16,
    fontFamily,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 24,
    marginBottom: 8,
    fontFamily,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 12,
  },
});
