export const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
} as const;

export type Rarity = keyof typeof RARITY_COLORS;

export const RARITY_MULTIPLIERS: Record<string, number> = {
  common: 1.0,
  uncommon: 1.1,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.5,
};

export const RANK_COLORS = {
  S: '#EF4444',
  A: '#F97316',
  B: '#EAB308',
  C: '#22C55E',
  D: '#3B82F6',
  E: '#8B5CF6',
  F: '#6B7280',
} as const;

// Базовый опыт за ранг (сложность)
export const RANK_BASE = {
  F: 10,
  E: 20,
  D: 35,
  C: 55,
  B: 80,
  A: 120,
  S: 200,
} as const;

// Множитель опыта за редкость (срочность)
export const RARITY_MULT = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0,
} as const;

export type Rank = keyof typeof RANK_COLORS;

/**
 * Возвращает hex-цвет для заданной редкости.
 * Если редкость неизвестна, возвращает цвет common.
 */
export const rarityColor = (rarity: Rarity | string): string => {
  return RARITY_COLORS[rarity as Rarity] ?? RARITY_COLORS.common;
};

/**
 * Возвращает hex-цвет для заданного ранга.
 * Если ранг неизвестен, возвращает цвет F.
 */
export const rankColor = (rank: Rank | string): string => {
  return RANK_COLORS[rank as Rank] ?? RANK_COLORS.F;
};

export const ENHANCEMENT_COSTS: Record<string, number> = {
  D: 1,
  C: 2,
  B: 4,
  A: 8,
  S: 16,
};
