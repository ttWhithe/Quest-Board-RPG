import { useState } from 'react';
import { FullAchievementsModal } from './FullAchievementsModal';
import type { Achievement } from './FullAchievementsModal';
import { RARITY_COLORS } from '../constants';

// Пока используем данные из JSON напрямую
const ACHIEVEMENTS: Achievement[] = [
  { id: "ach_first_quest", name: "Первый шаг", description: "Выполнить первый квест", icon: "⚔️", unlocked: true, rarity: "common" },
  { id: "ach_10_quests", name: "Новичок", description: "Выполнить 10 квестов", icon: "🛡️", unlocked: true, rarity: "uncommon" },
  { id: "ach_50_quests", name: "Опытный", description: "Выполнить 50 квестов", icon: "🏹", unlocked: false, rarity: "rare" },
  { id: "ach_100_quests", name: "Ветеран", description: "Выполнить 100 квестов", icon: "👑", unlocked: false, rarity: "epic" },
  { id: "ach_s_rank", name: "Убийца драконов", description: "Выполнить 5 квестов ранга S", icon: "🐉", unlocked: false, rarity: "legendary" },
  { id: "ach_night_owl", name: "Полуночник", description: "Выполнить квест после полуночи", icon: "🦉", unlocked: true, rarity: "uncommon" },
  { id: "ach_talent_1", name: "Прозрение", description: "Изучить первый талант", icon: "🌟", unlocked: true, rarity: "rare" },
  { id: "ach_talent_10", name: "Мастер пути", description: "Изучить 10 талантов", icon: "✨", unlocked: false, rarity: "epic" },
  { id: "ach_event_1", name: "Организатор", description: "Создать первое событие", icon: "📅", unlocked: true, rarity: "common" },
  { id: "ach_no_fail", name: "Безупречно", description: "Выполнить 20 квестов без провалов", icon: "💎", unlocked: false, rarity: "legendary" }
];

export function Achievements() {
  const [showModal, setShowModal] = useState(false);

  // Показываем только первые 6 в карточке
  const displayedAchievements = ACHIEVEMENTS.slice(0, 6);

  return (
    <div className="parchment-card p-5">
      <div className="flex justify-between items-center mb-4 border-b-2 border-tavern-wood pb-2">
        <h3 className="text-xl font-bold text-gray-800 font-fantasy">Достижения</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-amber-700 hover:text-amber-900 font-bold underline transition-colors"
        >
          Все достижения
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {displayedAchievements.map((ach) => (
          <div
            key={ach.id}
            onClick={() => setShowModal(true)}
            className={`aspect-square flex flex-col items-center justify-center p-2 border-2 rounded-lg bg-[#f4ebd8] transition-all hover:scale-105 cursor-pointer ${
              ach.unlocked ? '' : 'border-gray-300 grayscale opacity-50'
            }`}
            style={ach.unlocked ? { borderColor: RARITY_COLORS[ach.rarity] } : {}}
            title={ach.description}
          >
            <span className="text-2xl mb-1">{ach.icon}</span>
            <span className="text-[10px] text-center font-bold text-[#3b2f2f] leading-tight">
              {ach.name}
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <FullAchievementsModal
          achievements={ACHIEVEMENTS}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
