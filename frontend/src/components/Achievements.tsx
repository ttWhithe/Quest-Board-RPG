import { useState } from 'react';
import { FullAchievementsModal } from './FullAchievementsModal';
import { useAchievements } from '../api/achievements';
import { RARITY_COLORS } from '../constants';

export function Achievements() {
  const [showModal, setShowModal] = useState(false);
  const { data: achievements = [], isLoading } = useAchievements();

  if (isLoading) {
    return <div className="parchment-card p-5 text-center animate-pulse text-gray-500">Загрузка достижений...</div>;
  }

  // Берем 6 достижений для отображения на главной (можно брать закрепленные)
  const displayedAchievements = achievements.slice(0, 6);

  return (
    <div className="parchment-card p-5">
      <div className="flex justify-between items-center mb-4 border-b-2 border-tavern-wood pb-2">
        <h3 className="text-xl font-bold text-gray-800 font-fantasy">Достижения</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-amber-700 hover:text-amber-900 font-bold underline transition-colors"
        >
          Все {achievements.length} достижений
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {displayedAchievements.map((ach) => (
          <div
            key={ach.id}
            onClick={() => setShowModal(true)}
            className={`aspect-square flex flex-col items-center justify-center p-2 border-2 rounded-lg bg-[#1a1512] transition-all hover:scale-105 cursor-pointer ${
              ach.unlocked ? '' : 'border-gray-600'
            }`}
            style={ach.unlocked ? { borderColor: RARITY_COLORS[ach.rarity] } : {}}
            title={ach.description}
          >
            <div className="w-10 h-10 mb-1 relative flex items-center justify-center">
              <img
                src={`/icons/${ach.icon}.svg`}
                alt={ach.name}
                className="w-full h-full object-contain absolute"
                style={{
                  WebkitMaskImage: `url(/icons/${ach.icon}.svg)`,
                  maskImage: `url(/icons/${ach.icon}.svg)`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  backgroundColor: ach.unlocked ? RARITY_COLORS[ach.rarity] : '#4b5563',
                  opacity: ach.unlocked ? 1 : 0.5,
                }}
              />
            </div>
            <span className="text-[10px] text-center font-bold leading-tight" style={{ color: ach.unlocked ? '#f4ebd8' : '#a8a29e' }}>
              {ach.name}
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <FullAchievementsModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
