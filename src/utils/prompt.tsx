import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { Spacing, Typography, useThemeColors } from '@/constants/theme';

type PromptButtonStyle = 'default' | 'cancel' | 'destructive';

interface PromptButton {
  text: string;
  style?: PromptButtonStyle;
  onPress?: (value: string) => void;
}

interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  buttons: PromptButton[];
}

let showPromptImpl: ((options: PromptOptions) => void) | null = null;

export function showPrompt(options: PromptOptions) {
  if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
    Alert.prompt(
      options.title,
      options.message,
      options.buttons.map((button) => ({
        text: button.text,
        style: button.style,
        onPress: (value?: string) => button.onPress?.(value ?? ''),
      })),
      'plain-text',
      options.defaultValue,
      options.keyboardType
    );
    return;
  }

  if (showPromptImpl) {
    showPromptImpl(options);
    return;
  }

  Alert.alert(options.title, options.message);
}

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const [prompt, setPrompt] = useState<PromptOptions | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    showPromptImpl = (nextPrompt) => {
      setValue(nextPrompt.defaultValue ?? '');
      setPrompt(nextPrompt);
    };

    return () => {
      showPromptImpl = null;
    };
  }, []);

  const close = () => setPrompt(null);

  const handlePress = (button: PromptButton) => {
    const currentValue = value;
    close();
    button.onPress?.(currentValue);
  };

  const buttons = prompt?.buttons ?? [];

  return (
    <>
      {children}
      <Modal
        animationType="fade"
        onRequestClose={close}
        transparent
        visible={prompt !== null}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[Typography.heading, styles.title, { color: colors.text }]}>
              {prompt?.title}
            </Text>
            {prompt?.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {prompt.message}
              </Text>
            ) : null}
            <TextInput
              autoFocus
              keyboardType={prompt?.keyboardType ?? 'default'}
              onChangeText={setValue}
              placeholder={prompt?.placeholder}
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              value={value}
            />
            <View style={styles.buttonRow}>
              {buttons.map((button) => (
                <Pressable
                  key={button.text}
                  onPress={() => handlePress(button)}
                  style={[
                    styles.button,
                    {
                      backgroundColor:
                        button.style === 'cancel' ? colors.surface : colors.brandGreenSoft,
                      borderColor:
                        button.style === 'cancel' ? colors.surfaceBorder : colors.brandGreenBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: button.style === 'cancel' ? colors.text : colors.brandGreen,
                      },
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
