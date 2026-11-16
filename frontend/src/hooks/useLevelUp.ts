import { useState, useRef, useEffect } from 'react';
import { shouldTriggerLevelUp } from '../utils/levelUp';

/**
 * Отслеживает повышение уровня.
 * Логика проверки — в чистой функции shouldTriggerLevelUp (см. utils/levelUp.ts).
 */
export function useLevelUp(currentLevel: number | undefined) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentLevel === undefined) return;
    if (shouldTriggerLevelUp(prevLevelRef.current, currentLevel)) {
      setShowLevelUp(true);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  const dismiss = () => setShowLevelUp(false);

  return { showLevelUp, dismiss };
}
