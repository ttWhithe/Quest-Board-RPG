import { useState } from 'react';
import { motion } from 'framer-motion';
import { RARITY_COLORS } from '../constants';
import { ACHIEVEMENTS } from '../data/achievements';

interface Props {
  onClose: () => void;
}

export function FullAchievementsModal({ onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filtered = ACHIEVEMENTS.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">Книга деяний</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold transition-colors">✕</button>
        </div>

        <div className="flex gap-2 p-3 bg-[#f4ebd8] border-b border-[#5c4033]/30 flex-wrap">
          {[
            { id: 'all', label: 'Все' },
            { id: 'unlocked', label: 'Полученные' },
            { id: 'locked', label: 'В процессе' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-1 text-sm font-bold border rounded transition-colors ${
                filter === f.id ? 'bg-amber-700 text-white border-amber-900' : 'bg-transparent text-[#3b2f2f] border-[#5c4033] hover:bg-[#e8dac1]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((ach) => {
              const iconColor = ach.unlocked ? RARITY_COLORS[ach.rarity] : '#4b5563';

              // Форматируем текст награды
              const rewardText = ach.reward.type === 'xp'
                ? `+${ach.reward.amount} XP`
                : `Предмет (x${ach.reward.amount})`;

              return (
                <motion.div
                  key={ach.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative p-4 rounded-lg border-2 flex flex-col items-center text-center transition-all bg-[#1a1512]
                    ${ach.unlocked ? 'shadow-md' : 'opacity-50 grayscale'}`}
                  style={{ borderColor: ach.unlocked ? RARITY_COLORS[ach.rarity] : '#5c4033' }}
                >
                  {/* Иконка через img с инверсией цвета и наложением цвета редкости */}
                  <div className="w-16 h-16 mb-2 relative flex items-center justify-center">
                    <img
                      src={`/icons/${ach.icon}.svg`}
                      alt={ach.name}
                      className="w-full h-full object-contain absolute"
                      style={{
                        filter: ach.unlocked ? 'invert(1) sepia(1) saturate(5) hue-rotate(180deg)' : 'invert(1) opacity(0.3)',
                        // Используем маску для точного цвета редкости
                        WebkitMaskImage: `url(/icons/${ach.icon}.svg)`,
                        maskImage: `url(/icons/${ach.icon}.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        backgroundColor: iconColor
                      }}
                    />
                  </div>

                  <h3 className="font-bold leading-tight mb-1 text-sm" style={{ color: ach.unlocked ? RARITY_COLORS[ach.rarity] : '#a8a29e' }}>
                    {ach.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-tight mb-2 flex-1">{ach.description}</p>

                  {/* Награда */}
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${ach.unlocked ? 'bg-amber-900/40 text-amber-500 border border-amber-700' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    🏆 {rewardText}
                  </div>

                  {ach.unlocked ? (
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
          {filtered.length === 0 && (
            <p className="text-center text-[#5c4033]/60 italic mt-10">Здесь пока пусто...</p>
          )}
        </div>
      </div>
    </div>
  );
}
