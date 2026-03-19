import type { Goal } from '@/hooks/useProfile';

interface MacroData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SubScore {
  key: 'calories' | 'protein' | 'carbs' | 'fat';
  label: string;
  value: number;
  unit: string;
  score: number;
  status: 'good' | 'okay' | 'poor';
  detail: string;
}

export interface HealthScoreResult {
  score: number;
  breakdown: SubScore[];
  goalLabel: string;
}

const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Lose Weight',
  muscle: 'Build Muscle',
  balanced: 'Stay Balanced',
};

const WEIGHTS: Record<Goal, { calories: number; protein: number; carbs: number; fat: number }> = {
  lose:     { calories: 0.35, protein: 0.25, carbs: 0.20, fat: 0.20 },
  muscle:   { calories: 0.15, protein: 0.45, carbs: 0.20, fat: 0.20 },
  balanced: { calories: 0.25, protein: 0.25, carbs: 0.25, fat: 0.25 },
};

function scoreCalories(cal: number, goal: Goal): { score: number; detail: string } {
  const targets: Record<Goal, { ideal: number; sigma: number }> = {
    lose:     { ideal: 450, sigma: 200 },
    muscle:   { ideal: 600, sigma: 250 },
    balanced: { ideal: 550, sigma: 200 },
  };
  const { ideal, sigma } = targets[goal];
  const diff = Math.abs(cal - ideal);
  const score = Math.exp(-0.5 * (diff / sigma) ** 2) * 100;

  let detail: string;
  if (score >= 70) detail = 'On target';
  else if (cal > ideal) detail = cal > ideal + sigma ? 'Too high for your goal' : 'Slightly high';
  else detail = cal < ideal - sigma ? 'Too low for your goal' : 'Slightly low';

  return { score, detail };
}

function scoreProtein(protein: number, goal: Goal): { score: number; detail: string } {
  const targets: Record<Goal, { min: number; ideal: number }> = {
    lose:     { min: 20, ideal: 35 },
    muscle:   { min: 30, ideal: 45 },
    balanced: { min: 20, ideal: 30 },
  };
  const { min, ideal } = targets[goal];
  let score: number;
  if (protein >= ideal) score = 100;
  else if (protein <= 0) score = 0;
  else if (protein < min) score = (protein / min) * 50;
  else score = 50 + ((protein - min) / (ideal - min)) * 50;

  let detail: string;
  if (score >= 70) detail = 'Excellent';
  else if (score >= 40) detail = 'Adequate';
  else detail = 'Low for your goal';

  return { score, detail };
}

function scoreCarbs(carbs: number, goal: Goal): { score: number; detail: string } {
  const targets: Record<Goal, { ideal: number; max: number }> = {
    lose:     { ideal: 25, max: 60 },
    muscle:   { ideal: 45, max: 80 },
    balanced: { ideal: 40, max: 65 },
  };
  const { ideal, max } = targets[goal];
  let score: number;
  if (carbs <= ideal) score = 100;
  else if (carbs >= max * 1.5) score = 0;
  else if (carbs >= max) score = Math.max(0, 50 - ((carbs - max) / max) * 100);
  else score = 100 - ((carbs - ideal) / (max - ideal)) * 50;

  let detail: string;
  if (score >= 70) detail = 'Good';
  else if (score >= 40) detail = 'Slightly high';
  else detail = 'Too high for your goal';

  return { score, detail };
}

function scoreFat(fat: number, goal: Goal): { score: number; detail: string } {
  const targets: Record<Goal, { ideal: number; max: number }> = {
    lose:     { ideal: 10, max: 25 },
    muscle:   { ideal: 15, max: 30 },
    balanced: { ideal: 14, max: 25 },
  };
  const { ideal, max } = targets[goal];
  let score: number;
  if (fat <= ideal) score = 100;
  else if (fat >= max * 1.5) score = 0;
  else if (fat >= max) score = Math.max(0, 50 - ((fat - max) / max) * 100);
  else score = 100 - ((fat - ideal) / (max - ideal)) * 50;

  let detail: string;
  if (score >= 70) detail = 'Good';
  else if (score >= 40) detail = 'Moderate';
  else detail = 'Too high for your goal';

  return { score, detail };
}

function getStatus(score: number): 'good' | 'okay' | 'poor' {
  if (score >= 70) return 'good';
  if (score >= 40) return 'okay';
  return 'poor';
}

export function computeHealthScore(macros: MacroData, goal: Goal | null): HealthScoreResult {
  const g = goal ?? 'balanced';
  const weights = WEIGHTS[g];

  const cal = scoreCalories(macros.calories, g);
  const prot = scoreProtein(macros.protein, g);
  const carb = scoreCarbs(macros.carbs, g);
  const f = scoreFat(macros.fat, g);

  const rawScore =
    weights.calories * cal.score +
    weights.protein * prot.score +
    weights.carbs * carb.score +
    weights.fat * f.score;

  const score = Math.max(1, Math.min(100, Math.round(rawScore)));

  const breakdown: SubScore[] = [
    { key: 'calories', label: 'Calories', value: macros.calories, unit: '', score: Math.round(cal.score), status: getStatus(cal.score), detail: cal.detail },
    { key: 'protein', label: 'Protein', value: macros.protein, unit: 'g', score: Math.round(prot.score), status: getStatus(prot.score), detail: prot.detail },
    { key: 'carbs', label: 'Carbs', value: macros.carbs, unit: 'g', score: Math.round(carb.score), status: getStatus(carb.score), detail: carb.detail },
    { key: 'fat', label: 'Fat', value: macros.fat, unit: 'g', score: Math.round(f.score), status: getStatus(f.score), detail: f.detail },
  ];

  return { score, breakdown, goalLabel: GOAL_LABELS[g] };
}

export function getScoreColor(score: number, colors: { brandGreen: string; fat: string; protein: string }): string {
  if (score >= 70) return colors.brandGreen;
  if (score >= 45) return colors.fat;
  return colors.protein;
}
