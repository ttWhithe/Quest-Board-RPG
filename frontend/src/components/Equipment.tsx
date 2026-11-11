const SLOTS = [
  { id: 'head', name: 'Голова', icon: '🪖' },
  { id: 'chest', name: 'Торс', icon: '🥋' },
  { id: 'legs', name: 'Ноги', icon: '👖' },
  { id: 'feet', name: 'Ступни', icon: '👢' },
  { id: 'main_hand', name: 'Оружие', icon: '⚔️' },
  { id: 'off_hand', name: 'Щит', icon: '🛡️' },
  { id: 'ring', name: 'Кольцо', icon: '💍' },
  { id: 'amulet', name: 'Амулет', icon: '📿' },
];

export function Equipment() {
  return (
    <div className="parchment-card p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-fantasy border-b-2 border-tavern-wood pb-2">
        Экипировка
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-[#5c4033] rounded-lg bg-[#e8dac1] opacity-70 hover:opacity-100 transition-opacity cursor-pointer group relative"
            title={slot.name}
          >
            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">
              {slot.icon}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#3b2f2f] mt-1 font-bold">
              {slot.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
