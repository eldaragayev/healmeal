import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/constants/theme';
import { StepLayout } from '../StepLayout';
import type { StepProps } from '@/hooks/useOnboarding';

const fontFamily = Platform.select({ ios: 'ui-rounded', default: undefined });

const SOURCES = [
  { key: 'app_store', label: 'App Store', icon: 'logo-apple-appstore', iconSet: 'ion' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok', iconSet: 'fa5' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', iconSet: 'fa5' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube', iconSet: 'fa5' },
  { key: 'facebook', label: 'Facebook', icon: 'facebook', iconSet: 'fa5' },
  { key: 'friend', label: 'Friend or Family', icon: 'account-group', iconSet: 'mci' },
  { key: 'google', label: 'Google Search', icon: 'google', iconSet: 'fa5' },
  { key: 'x', label: 'X', icon: 'twitter', iconSet: 'fa5' },
  { key: 'podcast', label: 'Podcast', icon: 'podcast', iconSet: 'fa5' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal', iconSet: 'mci' },
] as const;

function SourceIcon({ icon, iconSet, color }: { icon: string; iconSet: string; color: string }) {
  switch (iconSet) {
    case 'fa5':
      return <FontAwesome5 name={icon} size={22} color={color} />;
    case 'ion':
      return <Ionicons name={icon as any} size={24} color={color} />;
    case 'mci':
      return <MaterialCommunityIcons name={icon as any} size={24} color={color} />;
    default:
      return null;
  }
}

export function AttributionStep({ data, update, onNext, onBack }: StepProps) {
  const colors = useThemeColors();

  const select = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update({ attribution: key });
  };

  return (
    <StepLayout cta="Next" onNext={onNext} onBack={onBack} ctaDisabled={!data.attribution}>
      <Text style={[styles.headline, { color: colors.text }]}>
        Quick one —{'\n'}how'd you find us?
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Helps us find more people like you
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.grid}>
          {SOURCES.map(({ key, label, icon, iconSet }) => {
            const selected = data.attribution === key;
            return (
              <Pressable
                key={key}
                onPress={() => select(key)}
                style={[
                  styles.card,
                  {
                    backgroundColor: selected ? 'rgba(34,166,84,0.08)' : colors.surface,
                    borderColor: selected ? '#22a654' : colors.surfaceBorder,
                  },
                ]}
              >
                <SourceIcon
                  icon={icon}
                  iconSet={iconSet}
                  color={selected ? '#22a654' : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.label,
                    { color: selected ? '#22a654' : colors.text },
                  ]}
                  numberOfLines={1}
                >
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

const styles = StyleSheet.create({
  headline: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 20,
    fontFamily,
  },
  sub: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 24,
    fontFamily,
  },
  scroll: { flex: 1 },
  grid: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
    fontFamily,
  },
});
