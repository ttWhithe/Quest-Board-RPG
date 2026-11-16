import { useState } from 'react';
import { FullAchievementsModal } from './FullAchievementsModal';
import { useAchievements } from '../api/achievements';
import { useCharacter } from '../api/character';
import { RARITY_COLORS } from '../constants';

export function Achievements() {
  const [showModal, setShowModal] = useState(false);
  const { data: achievements = [], isLoading } = useAchievements();
  const { data: charData } = useCharacter();

  const pinnedIds = charData?.user.pinned_achievements || [];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // Приоритет отображения: pinned → свежие unlocked → первые locked.
  // 6 слотов — размер сетки 3x2.
  const pinned = achievements.filter((a) => pinnedIds.includes(a.id) && a.unlocked);
  const fresh = achievements
    .filter((a) => a.unlocked && !pinnedIds.includes(a.id))
    .sort((a, b) => (b.unlocked_at ?? '').localeCompare(a.unlocked_at ?? ''));
  const locked = achievements.filter((a) => !a.unlocked);

  const displayed = [...pinned, ...fresh, ...locked].slice(0, 6);

  if (isLoading) {
    return (
      <div className="parchment-card p-5 text-center animate-pulse text-gray-500">
        Загрузка достижений...
      </div>
    );
  }

  return (
    <div className="parchment-card p-5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="text-xl font-bold text-gray-800 font-fantasy">Достижения</h3>
          <span className="text-xs font-bold text-[#5c4033]">
            {unlockedCount} / {totalCount}
          </span>
        </div>

        {/* Тонкий прогресс-бар */}
        <div className="h-1.5 bg-[#5c4033]/20 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-amber-700 to-amber-400 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {displayed.map((ach) => {
            const isUnlocked = ach.unlocked;
            const isPinned = pinnedIds.includes(ach.id);
            const color = RARITY_COLORS[ach.rarity] ?? '#5c4033';

            return (
              <div
                key={ach.id}
                onClick={() => setShowModal(true)}
                className={`relative aspect-square flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.04] ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-[#1f1a16] to-[#0f0d0b] border-[5px]'
                    : 'bg-[#1a1512]/40 border-2 border-dashed border-[#5c4033]/40'
                }`}
                style={
                  isUnlocked
                    ? {
                        borderColor: color,
                        boxShadow: `0 0 16px ${color}60, inset 0 0 8px ${color}40`,
                      }
                    : undefined
                }
                title={ach.description} // Всегда показываем описание при наведении
              >
                {isPinned && (
                  <span className="absolute top-1 right-1 text-[10px] text-amber-400 drop-shadow">
                    📍
                  </span>
                )}

                <div className="w-11 h-11 mb-1 relative flex items-center justify-center">
                  <div
                    className="w-full h-full"
                    style={{
                      WebkitMaskImage: `url(/icons/${ach.icon}.svg)`,
                      maskImage: `url(/icons/${ach.icon}.svg)`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      backgroundColor: isUnlocked ? color : '#3b2f2f',
                      opacity: isUnlocked ? 1 : 0.4,
                      filter: isUnlocked ? `drop-shadow(0 0 6px ${color}80)` : 'none',
                    }}
                  />
                </div>

                <span
                  className={`text-[10px] text-center font-bold leading-tight line-clamp-2 ${
                    isUnlocked
                      ? 'text-parchment-light'
                      : 'text-[#5c4033]/70' // Темно-коричневый для читаемости
                  }`}
                >
                  {ach.name} {/* Название теперь видно всегда */}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="mt-4 w-full text-center text-xs font-bold text-amber-800 hover:text-amber-600 underline transition-colors"
        >
          Открыть книгу деяний →
        </button>
      </div>

      {showModal && (
        <FullAchievementsModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
