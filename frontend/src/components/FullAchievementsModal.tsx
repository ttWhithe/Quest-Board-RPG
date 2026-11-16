import { useState } from 'react';
import { motion } from 'framer-motion';
import { RARITY_COLORS } from '../constants';
import { useAchievements } from '../api/achievements';
import { useUpdateCharacter, useCharacter } from '../api/character';

interface Props {
  onClose: () => void;
}

export function FullAchievementsModal({ onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const { data: achievements = [], isLoading } = useAchievements();
  const { data: charData } = useCharacter();
  const { mutate: updateCharacter, isPending } = useUpdateCharacter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pinnedIds = charData?.user.pinned_achievements || [];

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const handleTogglePin = (achId: string) => {
    setErrorMsg(null);
    if (!pinnedIds.includes(achId) && pinnedIds.length >= 5) {
      setErrorMsg('Можно закрепить не более 5 достижений. Сначала открепите одно из текущих.');
      return;
    }

    const newPinned = pinnedIds.includes(achId)
      ? pinnedIds.filter((id) => id !== achId)
      : [...pinnedIds, achId];

    updateCharacter(
      { pinned_achievements: newPinned },
      {
        onError: (err: any) =>
          setErrorMsg(err.response?.data?.detail?.detail || 'Ошибка сохранения'),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">Книга деяний</h2>
          <button
            onClick={onClose}
            className="text-2xl text-[#5c4033] hover:text-red-700 font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 p-3 bg-[#f4ebd8] border-b border-[#5c4033]/30 flex-wrap items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Все' },
              { id: 'unlocked', label: 'Полученные' },
              { id: 'locked', label: 'В процессе' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-1 text-sm font-bold border rounded transition-colors ${
                  filter === f.id
                    ? 'bg-amber-700 text-white border-amber-900'
                    : 'bg-transparent text-[#3b2f2f] border-[#5c4033] hover:bg-[#e8dac1]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-bold text-[#5c4033]">
            Закреплено: {pinnedIds.length} / 5
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-2 p-2 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 relative">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-[#5c4033] font-bold text-lg animate-pulse">
                Загрузка книги деяний...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((ach) => {
                const isUnlocked = ach.unlocked;
                const isPinned = pinnedIds.includes(ach.id);
                const rarityColor = RARITY_COLORS[ach.rarity] ?? '#5c4033';

                const rewardType = ach.reward?.type || 'xp';
                const rewardAmount = ach.reward?.amount || 0;
                const rewardText =
                  rewardType === 'xp' ? `+${rewardAmount} XP` : `Предмет (x${rewardAmount})`;

                return (
                  <motion.div
                    key={ach.id}
                    whileHover={{ scale: 1.02 }}
                    className={`relative p-4 rounded-lg flex flex-col items-center text-center transition-all bg-[#1a1512]
                      ${isUnlocked ? 'border-[5px] shadow-lg' : 'border-2 border-dashed opacity-90'}`}
                    style={{
                      borderColor: isUnlocked ? rarityColor : '#5c4033',
                      boxShadow: isUnlocked ? `0 0 12px ${rarityColor}40` : 'none',
                    }}
                  >
                    {/* Кнопка закрепления (только для полученных) */}
                    {isUnlocked && (
                      <button
                        onClick={() => handleTogglePin(ach.id)}
                        disabled={isPending}
                        className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border text-sm transition-all z-10 shadow-lg ${
                          isPinned
                            ? 'bg-amber-600 border-amber-400 text-white scale-110'
                            : 'bg-black/60 border-gray-400 text-gray-300 hover:text-white hover:border-white hover:bg-black/80'
                        }`}
                        title={isPinned ? 'Открепить' : 'Закрепить на карточке'}
                      >
                        {isPinned ? '📍' : '📌'}
                      </button>
                    )}

                    <div className="w-16 h-16 mb-2 relative flex items-center justify-center">
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
                          backgroundColor: isUnlocked ? rarityColor : '#5c4033',
                          opacity: isUnlocked ? 1 : 0.35, // Стильный силуэт для закрытых
                          filter: isUnlocked
                            ? `drop-shadow(0 0 6px ${rarityColor}80)`
                            : 'none',
                        }}
                      />
                    </div>

                    <h3
                      className="font-bold leading-tight mb-1 text-sm"
                      style={{ color: isUnlocked ? rarityColor : '#a8a29e' }}
                    >
                      {ach.name}
                    </h3>

                    <p className={`text-xs leading-tight mb-2 flex-1 ${isUnlocked ? 'text-gray-400' : 'text-gray-500/70'}`}>
                      {ach.description}
                    </p>

                    <div
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${
                        isUnlocked
                          ? 'bg-amber-900/40 text-amber-500 border border-amber-700'
                          : 'bg-gray-800/60 text-gray-400 border border-gray-700/60'
                      }`}
                    >
                      🏆 {rewardText}
                    </div>

                    {isUnlocked ? (
                      <span className="mt-auto text-[10px] font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-800">
                        Получено
                      </span>
                    ) : (
                      <span className="mt-auto text-[10px] font-bold text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700">
                        Закрыто
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-[#5c4033]/60 italic mt-10">Здесь пока пусто...</p>
          )}
        </div>
      </div>
    </div>
  );
}
