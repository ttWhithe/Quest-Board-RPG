import { useCharacterInventory, useUpdateInventoryItem } from '../api/character';
import type { InventoryItem } from '../api/character';
import { rarityColor, rankColor } from '../constants';
import { clsx } from 'clsx';

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

const SLOT_MAP: Record<string, string> = {
  neck: 'amulet',
  ring1: 'ring1',
  ring2: 'ring2',
};

interface EquipmentProps {
  noCard?: boolean;
  draggedItem: InventoryItem | null;
  onSlotClick: (slotId: string | null) => void;
  activeFilter: string | null;
}

export function Equipment({ noCard = false, draggedItem, onSlotClick, activeFilter }: EquipmentProps) {
  const { data } = useCharacterInventory();
  const { mutate: updateItem } = useUpdateInventoryItem();

  const equippedItems: Record<string, InventoryItem> = {};
  if (data) {
    data.items.forEach(item => {
      if (item.equipped_slot) {
        equippedItems[item.equipped_slot] = item;
      }
    });
  }

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const targetBackendSlot = SLOT_MAP[slotId] || slotId;

    const isWeapon = draggedItem.type === 'weapon';
    const isRing = draggedItem.slot === 'ring';

    const isValid =
      draggedItem.slot === targetBackendSlot ||
      (isRing && (targetBackendSlot === 'ring1' || targetBackendSlot === 'ring2')) ||
      (isWeapon && (targetBackendSlot === 'main_hand' || targetBackendSlot === 'off_hand'));

    if (!isValid) return;

    updateItem({ itemId: draggedItem.id, payload: { equipped_slot: targetBackendSlot } });
  };

  const handleDragOver = (e: React.DragEvent, canDrop: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
  };

  const handleSlotClick = (slotId: string) => {
    const targetBackendSlot = SLOT_MAP[slotId] || slotId;
    if (!equippedItems[targetBackendSlot]) {
      onSlotClick(activeFilter === targetBackendSlot ? null : targetBackendSlot);
    }
  };

  const handleUnequip = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    const targetBackendSlot = SLOT_MAP[slotId] || slotId;
    const item = equippedItems[targetBackendSlot];
    if (item) {
      updateItem({ itemId: item.id, payload: { equipped_slot: null } });
    }
  };

  const renderSlot = (slot: { id: string, name: string, icon: string }) => {
    const targetBackendSlot = SLOT_MAP[slot.id] || slot.id;
    const item = equippedItems[targetBackendSlot];

    const isWeapon = draggedItem?.type === 'weapon';
    const isRing = draggedItem?.slot === 'ring';

    const canDrop = draggedItem && (
      draggedItem.slot === targetBackendSlot ||
      (isRing && (targetBackendSlot === 'ring1' || targetBackendSlot === 'ring2')) ||
      (isWeapon && (targetBackendSlot === 'main_hand' || targetBackendSlot === 'off_hand'))
    );

    const isFiltered = activeFilter === targetBackendSlot;
    const enhancementLetter = item && item.enhancement_level > 0 ? ['', 'D', 'C', 'B', 'A', 'S'][item.enhancement_level] : '';

    return (
      <div
        key={slot.id}
        onDragOver={(e) => handleDragOver(e, !!canDrop)}
        onDrop={(e) => handleDrop(e, slot.id)}
        onClick={() => handleSlotClick(slot.id)}
        onDoubleClick={(e) => handleUnequip(e, slot.id)}
        className={clsx(
          "relative group flex flex-col items-center justify-center aspect-square border-2 rounded-lg transition-all cursor-pointer shadow-sm overflow-hidden",
          canDrop ? "border-green-500 bg-green-100/50 scale-110 z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
          isFiltered ? "border-amber-500 bg-amber-100/50 scale-105" :
          item ? "border-solid bg-[#e8dac1]" : "border-dashed border-[#5c4033] bg-[#e8dac1]",
          draggedItem && !canDrop && "opacity-50"
        )}
        style={(!canDrop && !isFiltered && item) ? { borderColor: rarityColor(item.rarity) } : {}}
        title={item ? `${item.name} (двойной клик чтобы снять)` : `Нажмите, чтобы отфильтровать`}
      >
        {item ? (
          <div className="absolute inset-0 p-1 relative">
            <img
              src={item.icon_path}
              alt={item.name}
              className="w-full h-full object-cover rounded-md"
            />
            {/* BDO Style Заточка */}
            {enhancementLetter && (
              <span
                className="absolute inset-0 flex items-center justify-center font-bold text-3xl opacity-90 pointer-events-none select-none z-10"
                style={{
                  color: rankColor(enhancementLetter),
                  WebkitTextStroke: '1.5px black',
                  textShadow: '0px 0px 3px rgba(0,0,0,0.8)'
                }}
              >
                {enhancementLetter}
              </span>
            )}
          </div>
        ) : (
          <>
            <span className={clsx(
              "text-xl md:text-2xl transition-all duration-300",
              isFiltered ? "grayscale-0 opacity-100 scale-110" : "grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100"
            )}>
              {slot.icon}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-[#3b2f2f] mt-1 font-bold opacity-70 text-center leading-tight">
              {slot.name}
            </span>
          </>
        )}
      </div>
    );
  };

  const content = (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-bold text-gray-800 mb-3 font-fantasy border-b-2 border-tavern-wood pb-2 shrink-0 flex justify-between items-center">
        <span>Экипировка</span>
        {activeFilter && (
          <button onClick={() => onSlotClick(null)} className="text-xs text-amber-700 hover:text-amber-900 underline">
            Сбросить фильтр
          </button>
        )}
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
