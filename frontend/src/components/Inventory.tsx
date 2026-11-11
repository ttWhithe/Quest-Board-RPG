import { useState, useRef, useEffect } from 'react';
import { useCharacterInventory } from '../api/character';
import type { InventoryItem } from '../api/character';
import { rarityColor } from '../constants';
import { FullInventoryModal } from './FullInventoryModal';
import { ModuleSkeleton } from './Skeletons';

interface InventoryProps {
  noCard?: boolean;
}

export function Inventory({ noCard = false }: InventoryProps) {
  const { data, isLoading } = useCharacterInventory();
  const [showModal, setShowModal] = useState(false);

  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<number | null>(null);

  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const loadPinned = () => {
    const saved = localStorage.getItem('qb_pinned_items');
    if (saved) setPinnedIds(JSON.parse(saved));
  };

  useEffect(() => {
    loadPinned();
    window.addEventListener('pinnedItemsChanged', loadPinned);
    return () => window.removeEventListener('pinnedItemsChanged', loadPinned);
  }, []);

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

  if (isLoading || !data) {
    return noCard ? <div className="animate-pulse h-full bg-gray-200"></div> : <ModuleSkeleton />;
  }

  let displayItems = data.items.filter(i => pinnedIds.includes(i.id));
  if (displayItems.length === 0) {
    displayItems = data.items;
  }
  // Теперь 24 предмета (сетка 4x6)
  displayItems = displayItems.slice(0, 24);

  const content = (
    <div className="h-full flex flex-col">
      {/* Уменьшили отступ снизу до сетки */}
      <div className="flex justify-between items-center mb-3 border-b-2 border-tavern-wood pb-2 shrink-0">
        <h3 className="text-xl font-bold text-gray-800 font-fantasy">Инвентарь</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-amber-700 hover:text-amber-900 font-bold underline transition-colors"
        >
          Полный инвентарь
        </button>
      </div>

      {/* Идеальная сетка 4x6 */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 24 }).map((_, i) => {
          const item = displayItems[i];

          return item ? (
            <div
              key={item.id}
              onMouseEnter={(e) => handleMouseEnter(e, item)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              className="relative aspect-square border-2 rounded-sm bg-[#1a1512] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              style={{ borderColor: rarityColor(item.rarity) }}
            >
              <img src={item.icon_path} alt={item.name} className="w-full h-full object-cover p-1" />

              {(item.type === 'consumable' || item.id.endsWith('81') || item.id.endsWith('82')) && (
                <span className="absolute bottom-0 right-1 text-white font-bold text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                  5
                </span>
              )}
            </div>
          ) : (
            <div key={i} className="aspect-square border border-[#5c4033] bg-[#e8dac1] rounded-sm opacity-40" />
          );
        })}
      </div>

      {/* Тултип предмета */}
      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none bg-black/95 border-2 border-amber-600/50 p-3 rounded-lg shadow-2xl w-64 -translate-x-1/2 -translate-y-[110%]"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <h4 className="font-bold text-sm mb-1" style={{ color: rarityColor(hoveredItem.rarity) }}>
            {hoveredItem.name}
          </h4>
          <p className="text-gray-400 text-xs italic mb-2">{hoveredItem.type} / {hoveredItem.slot}</p>
          <div className="flex flex-col gap-1 text-xs text-white border-t border-gray-700 pt-2">
            {Object.entries(hoveredItem.stats).map(([stat, val]) => (
              <span key={stat} className="text-green-400">+{val} {stat}</span>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <FullInventoryModal
          items={data.items}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );

  return noCard ? content : <div className="parchment-card p-6">{content}</div>;
}
