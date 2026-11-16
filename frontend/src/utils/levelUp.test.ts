import { describe, it, expect } from 'vitest';
import { shouldTriggerLevelUp, levelFromXp } from './levelUp';

describe('shouldTriggerLevelUp', () => {
  it('не срабатывает при первой загрузке (prev === null) — Sad Path', () => {
    expect(shouldTriggerLevelUp(null, 5)).toBe(false);
  });

  it('не срабатывает, если данных ещё нет — Sad Path', () => {
    expect(shouldTriggerLevelUp(3, undefined)).toBe(false);
  });

  it('не срабатывает при равном уровне — Sad Path', () => {
    expect(shouldTriggerLevelUp(3, 3)).toBe(false);
  });

  it('не срабатывает при понижении уровня — Sad Path', () => {
    expect(shouldTriggerLevelUp(3, 2)).toBe(false);
  });

  it('срабатывает при повышении уровня', () => {
    expect(shouldTriggerLevelUp(3, 4)).toBe(true);
  });
});

describe('levelFromXp', () => {
  it.each([
    [0, 1],
    [49, 1],
    [50, 2],
    [199, 2],
    [200, 3],
    [300, 3],
  ])('total_xp=%i → level=%i', (xp, expected) => {
    expect(levelFromXp(xp)).toBe(expected);
  });
});
