import { Stack, useRouter } from 'expo-router';
import { useModalData } from '@/hooks/useModalData';
import { RestaurantDetail } from '@/components/RestaurantDetail';

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { getRestaurant, setMeal, setPendingSearch } = useModalData();
  const match = getRestaurant();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
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
      <RestaurantDetail
        match={match}
        visible={true}
        onClose={() => router.back()}
        onMealPress={(meal, m) => {
          setMeal(meal, m);
          router.push('/(restaurants)/meal-detail');
        }}
        onViewAllMeals={() => {
          if (match) {
            setPendingSearch(match.chain.name);
            router.dismissAll();
            router.navigate('/search');
          }
        }}
        onGetRecommendations={() => {
          router.push('/(restaurants)/restaurant-combos');
        }}
      />
    </>
  );
}
