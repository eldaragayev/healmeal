import { useRouter } from 'expo-router';
import { useModalData } from '@/hooks/useModalData';
import { MealDetailSheet } from '@/components/MealDetailSheet';

export default function MealDetailModal() {
  const router = useRouter();
  const { getMeal, setRestaurant } = useModalData();
  const { meal, match } = getMeal();

  return (
    <MealDetailSheet
      meal={meal}
      match={match}
      visible={true}
      onClose={() => router.back()}
      onViewRestaurant={match ? () => {
        setRestaurant(match);
        router.back();
        setTimeout(() => router.push('/(restaurants)/restaurant-detail'), 100);
      } : undefined}
    />
  );
}
