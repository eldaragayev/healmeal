import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Props {
  progress: number; // 0–1
}

export function ProgressBar({ progress }: Props) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${withTiming(progress * 100, { duration: 400 })}%` as any,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: '#22a654',
    borderRadius: 2,
  },
});
