import { useRouter } from 'expo-router';
import { useSettings } from '@/hooks/useSettings';
import { WeightHistory } from '@/components/WeightHistory';

export default function WeightHistoryModal() {
  const router = useRouter();
  const { settings, addWeightEntry, removeWeightEntry } = useSettings();

  return (
    <WeightHistory
      history={settings.weightHistory}
      onAdd={addWeightEntry}
      onRemove={removeWeightEntry}
      onClose={() => router.back()}
    />
  );
}
