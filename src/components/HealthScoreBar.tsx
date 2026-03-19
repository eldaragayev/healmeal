import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useThemeColors, Spacing } from '@/constants/theme';
import { type HealthScoreResult, getScoreColor } from '@/utils/healthScore';

const STATUS_ICONS = { good: '\u2713', okay: '\u25B3', poor: '\u2717' } as const;

/* ------------------------------------------------------------------ */
/*  Full bar — used in MealDetailSheet above the nutrition row         */
/* ------------------------------------------------------------------ */

export function HealthScoreBar({ result }: { result: HealthScoreResult }) {
  const colors = useThemeColors();
  const [showModal, setShowModal] = useState(false);
  const scoreColor = getScoreColor(result.score, colors);

  return (
    <>
      <Pressable onPress={() => setShowModal(true)} style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{result.score}</Text>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Health Score</Text>
          <Text style={[styles.whyLink, { color: colors.textTertiary }]}>Why?</Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceBorder }]}>
          <View style={[styles.fill, { width: `${result.score}%`, backgroundColor: scoreColor }]} />
        </View>
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surfaceElevated }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>Health Score</Text>
            <Text style={[styles.modalScore, { color: scoreColor }]}>{result.score}</Text>

            <View style={[styles.modalTrack, { backgroundColor: colors.surfaceBorder }]}>
              <View style={[styles.modalFill, { width: `${result.score}%`, backgroundColor: scoreColor }]} />
            </View>

            <View style={styles.breakdownList}>
              {result.breakdown.map((item) => {
                const icon = STATUS_ICONS[item.status];
                const itemColor =
                  item.status === 'good' ? colors.brandGreen :
                  item.status === 'okay' ? colors.fat :
                  colors.protein;
                return (
                  <View key={item.key} style={[styles.breakdownRow, { borderBottomColor: colors.surfaceBorder }]}>
                    <Text style={[styles.breakdownIcon, { color: itemColor }]}>{icon}</Text>
                    <View style={styles.breakdownInfo}>
                      <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                        {item.label}{' '}
                        <Text style={{ fontWeight: '400', color: colors.textSecondary }}>
                          {item.value}{item.unit}
                        </Text>
                      </Text>
                      <Text style={[styles.breakdownDetail, { color: colors.textSecondary }]}>
                        {item.detail}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.goalNote, { color: colors.textTertiary }]}>
              Based on your {result.goalLabel} goal
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact bar — used on MealCard / feed combo cards                  */
/* ------------------------------------------------------------------ */

export function HealthScoreMini({ score, colors }: { score: number; colors: ReturnType<typeof useThemeColors> }) {
  const scoreColor = getScoreColor(score, colors);

  return (
    <View style={miniStyles.row}>
      <Text style={[miniStyles.number, { color: scoreColor }]}>{score}</Text>
      <View style={[miniStyles.track, { backgroundColor: colors.surfaceBorder }]}>
        <View style={[miniStyles.fill, { width: `${score}%`, backgroundColor: scoreColor }]} />
      </View>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  number: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 18,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  whyLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 4,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalScore: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
  },
  modalTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  modalFill: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownList: {
    marginTop: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  breakdownIcon: {
    fontSize: 16,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  breakdownInfo: {
    flex: 1,
    gap: 1,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  breakdownDetail: {
    fontSize: 13,
    fontWeight: '400',
  },
  goalNote: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
});
