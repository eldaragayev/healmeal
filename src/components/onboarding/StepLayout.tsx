import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingButton } from './OnboardingButton';
import { useThemeColors } from '@/constants/theme';

interface Props {
  cta?: string;
  onNext?: () => void;
  onBack?: () => void;
  ctaDisabled?: boolean;
  ctaVariant?: 'primary' | 'outline' | 'ghost';
  secondaryCta?: string;
  onSecondary?: () => void;
  footerNote?: React.ReactNode;
  children: React.ReactNode;
  centered?: boolean;
  keyboardAvoiding?: boolean;
}

export function StepLayout({
  cta,
  onNext,
  onBack,
  ctaDisabled,
  ctaVariant = 'primary',
  secondaryCta,
  onSecondary,
  footerNote,
  children,
  centered,
  keyboardAvoiding,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const bottomPad = Math.max(insets.bottom, 16);

  const content = (
    <View style={styles.container}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={16}>
          {Platform.OS === 'ios' ? (
            <SymbolView name={'chevron.left' as any} style={{ width: 20, height: 20 }} tintColor={colors.textTertiary} />
          ) : (
            <View><View style={{ width: 10, height: 2, backgroundColor: colors.textTertiary, transform: [{ rotate: '-45deg' }, { translateY: -3 }] }} /><View style={{ width: 10, height: 2, backgroundColor: colors.textTertiary, transform: [{ rotate: '45deg' }, { translateY: 3 }] }} /></View>
          )}
        </Pressable>
      )}
      <View style={[styles.content, centered && styles.centered]}>
        {children}
      </View>
      {cta && onNext && (
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          {footerNote}
          <OnboardingButton label={cta} onPress={onNext} disabled={ctaDisabled} variant={ctaVariant} />
          {secondaryCta && onSecondary && (
            <OnboardingButton label={secondaryCta} onPress={onSecondary} variant="ghost" />
          )}
        </View>
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 16}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 6,
  },
});
