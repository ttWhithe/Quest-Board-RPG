/**
 * Чистая логика: нужно ли показать модалку повышения уровня.
 *
 * - prev === null → первая загрузка, не показываем (защита от ложного срабатывания)
 * - current === undefined → данные ещё не пришли, не показываем
 * - current > prev → уровень вырос, показываем
 * - current <= prev → не показываем
 */
export function shouldTriggerLevelUp(
  prevLevel: number | null,
  currentLevel: number | undefined
): boolean {
  if (currentLevel === undefined) return false;
  if (prevLevel === null) return false;
  return currentLevel > prevLevel;
}

/** Формула из spec.md §5.2: level = floor(sqrt(total_xp / 50)) + 1 */
export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 50)) + 1;
}
