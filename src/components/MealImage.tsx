import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '@/constants/theme';

interface MealImageProps {
  uri: string | null | undefined;
  name: string;
  style: any;
  contentFit?: 'cover' | 'contain';
}

// Ordered: multi-word phrases first, then food TYPE, then protein, then drinks, then desserts
// This ensures "Chicken Pizza" matches pizza (🍕) not chicken (🍗)
const FOOD_MAP: { words: string[]; emoji: string }[] = [
  // Multi-word phrases (checked as substrings — specific enough to be safe)
  { words: ['ice cream', 'mcflurry', 'krushem', 'frozen yogurt'], emoji: '🍦' },
  { words: ['hot dog'], emoji: '🌭' },
  { words: ['fried rice', 'egg fried'], emoji: '🍜' },
  { words: ['hash brown'], emoji: '🍟' },
  { words: ['sausage roll'], emoji: '🥧' },
  { words: ['garlic bread'], emoji: '🍞' },
  { words: ['big mac', 'quarter pounder'], emoji: '🍔' },

  // Food TYPE — takes priority over protein
  { words: ['burger', 'whopper', 'angus'], emoji: '🍔' },
  { words: ['pizza', 'margherita', 'pepperoni', 'calzone'], emoji: '🍕' },
  { words: ['taco', 'burrito', 'quesadilla', 'nacho', 'tortilla', 'enchilada'], emoji: '🌮' },
  { words: ['wrap', 'flatbread', 'pitta', 'pita'], emoji: '🌯' },
  { words: ['sandwich', 'panini', 'toastie', 'baguette'], emoji: '🥪' },
  { words: ['salad', 'caesar', 'slaw'], emoji: '🥗' },
  { words: ['pasta', 'spaghetti', 'penne', 'lasagne', 'macaroni', 'carbonara', 'bolognese'], emoji: '🍝' },
  { words: ['noodle', 'ramen', 'pad thai', 'chow mein', 'udon'], emoji: '🍜' },
  { words: ['soup', 'broth', 'chowder'], emoji: '🍲' },
  { words: ['fries', 'chips', 'wedge', 'potato'], emoji: '🍟' },
  { words: ['pie', 'pasty'], emoji: '🥧' },
  { words: ['sub'], emoji: '🥪' },

  // Protein — only matches if no food type matched first
  { words: ['chicken', 'wing', 'nugget', 'tender', 'zinger', 'fillet', 'popcorn'], emoji: '🍗' },
  { words: ['steak', 'beef', 'rib', 'brisket'], emoji: '🥩' },
  { words: ['fish', 'cod', 'salmon', 'prawn', 'shrimp', 'seafood'], emoji: '🐟' },
  { words: ['sausage', 'bratwurst'], emoji: '🌭' },

  // Breakfast
  { words: ['breakfast', 'pancake', 'waffle', 'omelette', 'bacon', 'egg'], emoji: '🍳' },

  // Drinks
  { words: ['coffee', 'latte', 'cappuccino', 'espresso', 'mocha', 'americano', 'macchiato'], emoji: '☕' },
  { words: ['tea', 'chai', 'matcha'], emoji: '🍵' },
  { words: ['smoothie', 'milkshake', 'frappe', 'frappuccino'], emoji: '🥤' },
  { words: ['shake'], emoji: '🥤' },
  { words: ['coke', 'pepsi', 'sprite', 'fanta', 'lemonade', 'soda', 'tango'], emoji: '🥤' },
  { words: ['water', 'sparkling'], emoji: '💧' },
  { words: ['juice'], emoji: '🧃' },

  // Desserts
  { words: ['cake', 'brownie', 'cookie', 'muffin', 'donut', 'doughnut', 'pastry', 'croissant'], emoji: '🍰' },
  { words: ['sundae', 'gelato'], emoji: '🍦' },

  // Bread/bakery (last — very generic)
  { words: ['bread', 'toast', 'roll', 'bun'], emoji: '🍞' },

  // Condiments
  { words: ['dip', 'sauce', 'mayo', 'ketchup', 'gravy'], emoji: '🫙' },
];

// Match whole words only to avoid "steak" matching "tea", etc.
const wordBoundary = (name: string, keyword: string): boolean => {
  // Multi-word phrases: use substring match (specific enough)
  if (keyword.includes(' ')) return name.includes(keyword);
  // Single words: match whole word using regex
  return new RegExp(`\\b${keyword}\\b`, 'i').test(name);
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const cat of FOOD_MAP) {
    if (cat.words.some((kw) => wordBoundary(lower, kw))) return cat.emoji;
  }
  return '🍽️';
}

export const MealImage = React.memo(function MealImage({ uri, name, style, contentFit = 'cover' }: MealImageProps) {
  const colors = useThemeColors();
  const [failed, setFailed] = useState(false);
  const hasUri = uri && uri.length > 0;

  if (!hasUri || failed) {
    const emoji = getEmoji(name);
    return (
      <View style={[style, styles.fallback, { backgroundColor: colors.surface }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      onError={() => setFailed(true)}
    />
  );
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 14,
  },
  emoji: {
    fontSize: 48,
  },
});
