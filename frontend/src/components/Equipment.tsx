/**
 * ВАЖНО: Размер картинки-заглушки персонажа.
 * Из-за адаптивной верстки высота картинки зависит от высоты слотов экипировки.
 * Рекомендуемое соотношение сторон: 1:3.
 * Рекомендуемое разрешение: 500x1500 пикселей.
 * Используется object-cover object-top, поэтому лицо персонажа должно быть в верхней части картинки.
 */

const LEFT_SLOTS = [
  { id: 'head', name: 'Голова', icon: '🪖' },
  { id: 'shoulders', name: 'Плечи', icon: '🧥' },
  { id: 'chest', name: 'Торс', icon: '🥋' },
  { id: 'gloves', name: 'Перчатки', icon: '🧤' },
  { id: 'belt', name: 'Пояс', icon: '🎗️' },
  { id: 'feet', name: 'Ступни', icon: '👢' },
];

const RIGHT_SLOTS = [
  { id: 'back', name: 'Спина', icon: '🎒' },
  { id: 'neck', name: 'Шея', icon: '📿' },
  { id: 'main_hand', name: 'Оружие 1', icon: '⚔️' },
  { id: 'off_hand', name: 'Оружие 2', icon: '🛡️' },
  { id: 'ring1', name: 'Кольцо 1', icon: '💍' },
  { id: 'ring2', name: 'Кольцо 2', icon: '💍' },
];

interface EquipmentProps {
  noCard?: boolean;
}

export function Equipment({ noCard = false }: EquipmentProps) {
  const renderSlot = (slot: { id: string, name: string, icon: string }) => (
    <div
      key={slot.id}
      className="relative group flex flex-col items-center justify-center aspect-square border-2 border-dashed border-[#5c4033] rounded-lg bg-[#e8dac1] hover:opacity-100 transition-all cursor-pointer shadow-sm"
      title={slot.name}
    >
      <span className="text-xl md:text-2xl grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
        {slot.icon}
      </span>
      <span className="text-[8px] uppercase tracking-wider text-[#3b2f2f] mt-1 font-bold opacity-70 text-center leading-tight">
        {slot.name}
      </span>
    </div>
  );

  const content = (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-bold text-gray-800 mb-3 font-fantasy border-b-2 border-tavern-wood pb-2 shrink-0">
        Экипировка
      </h3>

      <div className="flex justify-center gap-1 md:gap-2 flex-1 items-stretch">

        <div className="flex flex-col justify-between gap-1 md:gap-2 w-14 md:w-16">
          {LEFT_SLOTS.map(renderSlot)}
        </div>

        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-full max-w-[170px] h-full border-2 border-[#5c4033] bg-[#d5c3a5] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
             <img
               src="/images/character_placeholder.png"
               alt="Character"
               className="w-full h-full object-cover object-top"
             />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-1 md:gap-2 w-14 md:w-16">
          {RIGHT_SLOTS.map(renderSlot)}
        </div>

      </div>
    </div>
  );

  return noCard ? content : <div className="parchment-card p-6 h-full">{content}</div>;
}
