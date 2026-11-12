import { useState, useRef } from 'react';
import { useCharacterInventory, useUpdateInventoryItem } from '../api/character';
import type { InventoryItem } from '../api/character';
import { rarityColor, rankColor } from '../constants';
import { FullInventoryModal } from './FullInventoryModal';
import { ModuleSkeleton } from './Skeletons';
import { clsx } from 'clsx';

interface InventoryProps {
  noCard?: boolean;
  onDragStartItem: (item: InventoryItem | null) => void;
  filterSlot?: string | null;
  onResetFilter?: () => void;
}

export function Inventory({ noCard = false, onDragStartItem, filterSlot, onResetFilter }: InventoryProps) {
  const { data, isLoading } = useCharacterInventory();
  const { mutate: updateItem } = useUpdateInventoryItem();
  const [showModal, setShowModal] = useState(false);

  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, item: InventoryItem) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    hoverTimeout.current = window.setTimeout(() => {
      setHoveredItem(item);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredItem(null);
  };

  const handleDoubleClick = (item: InventoryItem) => {
    if (item.slot === 'none') return;
    let targetSlot = item.slot;
    if (item.slot === 'ring') targetSlot = 'ring1';
    if (item.type === 'weapon') targetSlot = 'main_hand';
    updateItem({ itemId: item.id, payload: { equipped_slot: targetSlot } });
  };

  if (isLoading || !data) {
    return noCard ? <div className="animate-pulse h-full bg-gray-200"></div> : <ModuleSkeleton />;
  }

  let displayItems = [...data.items];

  if (filterSlot) {
    displayItems = displayItems.filter(i => {
      if (filterSlot === 'ring1' || filterSlot === 'ring2') return i.slot === 'ring';
      if (filterSlot === 'neck') return i.slot === 'amulet';
      if (filterSlot === 'main_hand' || filterSlot === 'off_hand') return i.type === 'weapon';
      return i.slot === filterSlot;
    });
  } else {
    displayItems.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
  }

  displayItems = displayItems.slice(0, 24);

  const content = (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 border-b-2 border-tavern-wood pb-2 shrink-0">
        <h3 className="text-xl font-bold text-gray-800 font-fantasy flex items-center gap-2">
          Инвентарь
          {filterSlot && (
            <button
              onClick={onResetFilter}
              className="text-xs bg-amber-700 text-white px-2 py-0.5 rounded hover:bg-amber-900 transition-colors"
            >
              Сбросить
            </button>
          )}
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-amber-700 hover:text-amber-900 font-bold underline transition-colors"
        >
          Полный инвентарь
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 24 }).map((_, i) => {
          const item = displayItems[i];
          const enhancementLetter = item && item.enhancement_level > 0 ? ['', 'D', 'C', 'B', 'A', 'S'][item.enhancement_level] : '';

          return item ? (
            <div
              key={item.id}
              draggable={item.slot !== 'none'}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'move';
                onDragStartItem(item);
              }}
              onDragEnd={() => onDragStartItem(null)}
              onDoubleClick={() => handleDoubleClick(item)}
              onMouseEnter={(e) => handleMouseEnter(e, item)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              className={clsx(
                "relative aspect-square border-2 rounded-sm bg-[#1a1512] flex items-center justify-center hover:scale-105 transition-transform cursor-grab active:cursor-grabbing",
                item.equipped_slot && "opacity-50"
              )}
              style={{ borderColor: rarityColor(item.rarity) }}
            >
              <img src={item.icon_path} alt={item.name} className="w-full h-full object-cover p-1" />

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

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateItem({ itemId: item.id, payload: { enhancement_level: item.enhancement_level + 1 } });
                }}
                className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-1 rounded-tr-md hover:bg-black z-20"
                title="Заточить (тест)"
              >
                +
              </button>

              {item.is_pinned && (
                <span className="absolute top-0 left-1 text-white text-xs drop-shadow-md z-10">📌</span>
              )}

              {item.equipped_slot && (
                <span className="absolute top-0 right-1 text-white font-bold text-[10px] bg-green-600 rounded-sm px-1 drop-shadow-md z-10">
                  E
                </span>
              )}
            </div>
          ) : (
            <div key={i} className="aspect-square border border-[#5c4033] bg-[#e8dac1] rounded-sm opacity-40" />
          );
        })}
      </div>

      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none bg-black/95 border-2 border-amber-600/50 p-3 rounded-lg shadow-2xl w-64 -translate-x-1/2 -translate-y-[110%]"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <h4 className="font-bold text-sm mb-1 flex items-center justify-between" style={{ color: rarityColor(hoveredItem.rarity) }}>
            <span>{hoveredItem.name}</span>
            {hoveredItem.enhancement_level > 0 && (
              <span className="text-base" style={{ color: rankColor(['', 'D', 'C', 'B', 'A', 'S'][hoveredItem.enhancement_level]), WebkitTextStroke: '1px black' }}>
                {['', 'D', 'C', 'B', 'A', 'S'][hoveredItem.enhancement_level]}
              </span>
            )}
          </h4>
          <p className="text-gray-400 text-xs italic mb-2">{hoveredItem.type} / {hoveredItem.slot}</p>
          <div className="flex flex-col gap-1 text-xs text-white border-t border-gray-700 pt-2">
            {Object.entries(hoveredItem.stats).map(([stat, val]) => (
              <span key={stat} className="text-green-400">+{val} {stat}</span>
            ))}
          </div>
        </div>
      )}

      {showModal && <FullInventoryModal items={data.items} onClose={() => setShowModal(false)} />}
    </div>
  );

  return noCard ? content : <div className="parchment-card p-6">{content}</div>;
}
