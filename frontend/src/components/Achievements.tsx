const MOCK_ACHIEVEMENTS = [
  { id: 1, icon: '⚔️', name: 'Первый шаг', unlocked: true, rarity: 'common' },
  { id: 2, icon: '🛡️', name: 'Новичок', unlocked: true, rarity: 'uncommon' },
  { id: 3, icon: '🏹', name: 'Опытный', unlocked: false, rarity: 'rare' },
  { id: 4, icon: '👑', name: 'Ветеран', unlocked: false, rarity: 'epic' },
  { id: 5, icon: '🐉', name: 'Убийца драконов', unlocked: false, rarity: 'legendary' },
  { id: 6, icon: '🦉', name: 'Полуночник', unlocked: true, rarity: 'uncommon' },
];

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-400',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-amber-500',
};

export function Achievements() {
  return (
    <div className="parchment-card p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-fantasy border-b-2 border-tavern-wood pb-2">
        Достижения
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {MOCK_ACHIEVEMENTS.map((ach) => (
          <div
            key={ach.id}
            className={`aspect-square flex flex-col items-center justify-center p-2 border-2 rounded-lg bg-[#f4ebd8] transition-all hover:scale-105 cursor-help ${
              ach.unlocked ? RARITY_BORDER[ach.rarity] : 'border-gray-300 grayscale opacity-50'
            }`}
            title={ach.name}
          >
            <span className="text-2xl mb-1">{ach.icon}</span>
            <span className="text-[10px] text-center font-bold text-[#3b2f2f] leading-tight">
              {ach.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
