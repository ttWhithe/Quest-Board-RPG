export const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
} as const;

export type Rarity = keyof typeof RARITY_COLORS;

export const RANK_COLORS = {
  S: '#EF4444',
  A: '#F97316',
  B: '#EAB308',
  C: '#22C55E',
  D: '#3B82F6',
  E: '#8B5CF6',
  F: '#6B7280',
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
