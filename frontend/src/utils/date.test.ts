import { formatDeadline, formatTime, minutesToPercent } from './date';

describe('date utils', () => {
  describe('minutesToPercent', () => {
    it('returns correct percentages for key times of the day', () => {
      // 00:00 = 0%
      expect(minutesToPercent(new Date(2026, 0, 1, 0, 0))).toBe(0);
      // 06:00 = 25%
      expect(minutesToPercent(new Date(2026, 0, 1, 6, 0))).toBe(25);
      // 12:00 = 50%
      expect(minutesToPercent(new Date(2026, 0, 1, 12, 0))).toBe(50);
      // 18:00 = 75%
      expect(minutesToPercent(new Date(2026, 0, 1, 18, 0))).toBe(75);
      // 23:59 = 99.9305...%
      const p = minutesToPercent(new Date(2026, 0, 1, 23, 59));
      expect(p).toBeCloseTo(99.93, 1);
    });
  });

  describe('formatTime', () => {
    it('returns time in HH:mm format', () => {
      expect(formatTime(new Date(2026, 0, 1, 14, 30))).toBe('14:30');
      expect(formatTime(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
      expect(formatTime(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
    });
  });

  describe('formatDeadline', () => {
    it('returns null for empty input (Sad Path)', () => {
      expect(formatDeadline(null)).toBeNull();
    });

    it('formats valid date string to ru-RU locale', () => {
      const dateStr = '2026-01-20T18:00:00Z';
      const formatted = formatDeadline(dateStr);

      // Результат зависит от таймзоны машины, поэтому проверяем общую структуру
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('янв');
      expect(formatted).toMatch(/\d{1,2} янв/);
    });
  });
});
