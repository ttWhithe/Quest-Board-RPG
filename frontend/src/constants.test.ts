import { RANK_COLORS, RARITY_COLORS, rankColor, rarityColor } from './constants';

describe('constants utils', () => {
  describe('rarityColor', () => {
    it('returns correct color for all valid rarities', () => {
      expect(rarityColor('common')).toBe(RARITY_COLORS.common);
      expect(rarityColor('uncommon')).toBe(RARITY_COLORS.uncommon);
      expect(rarityColor('rare')).toBe(RARITY_COLORS.rare);
      expect(rarityColor('epic')).toBe(RARITY_COLORS.epic);
      expect(rarityColor('legendary')).toBe(RARITY_COLORS.legendary);
    });

    it('returns fallback color (common) for unknown rarity', () => {
      // Sad Path: проверяем, что неизвестная строка не роняет приложение
      expect(rarityColor('mythic')).toBe(RARITY_COLORS.common);
      expect(rarityColor('')).toBe(RARITY_COLORS.common);
    });
  });

  describe('rankColor', () => {
    it('returns correct color for all valid ranks', () => {
      expect(rankColor('S')).toBe(RANK_COLORS.S);
      expect(rankColor('A')).toBe(RANK_COLORS.A);
      expect(rankColor('B')).toBe(RANK_COLORS.B);
      expect(rankColor('C')).toBe(RANK_COLORS.C);
      expect(rankColor('D')).toBe(RANK_COLORS.D);
      expect(rankColor('E')).toBe(RANK_COLORS.E);
      expect(rankColor('F')).toBe(RANK_COLORS.F);
    });

    it('returns fallback color (F) for unknown rank', () => {
      // Sad Path
      expect(rankColor('Z')).toBe(RANK_COLORS.F);
      expect(rankColor('s')).toBe(RANK_COLORS.F); // Регистрозависимость
    });
  });
});
