import { useState, useMemo, useRef } from 'react';
import type { InventoryItem } from '../api/character';
import { rarityColor, rankColor } from '../constants';
import { useUpdateInventoryItem } from '../api/character';

interface Props {
  items: InventoryItem[];
  onClose: () => void;
}

export function FullInventoryModal({ items, onClose }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const { mutate: updateItem } = useUpdateInventoryItem();

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

  const togglePin = (item: InventoryItem) => {
    updateItem({ itemId: item.id, payload: { is_pinned: !item.is_pinned } });
  };

  const filteredItems = useMemo(() => {
    if (filter === 'pinned') return items.filter(item => item.is_pinned);
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">Сумка странника</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold transition-colors">✕</button>
        </div>

        <div className="flex gap-2 p-3 bg-[#f4ebd8] border-b border-[#5c4033]/30 flex-wrap">
          {[
            { id: 'pinned', label: '📌 Закрепленные' },
            { id: 'all', label: 'Все' },
            { id: 'weapon', label: 'Оружие' },
            { id: 'armor', label: 'Броня' },
            { id: 'jewelry', label: 'Украшения' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-sm font-bold border rounded transition-colors ${
                filter === f.id ? 'bg-amber-700 text-white border-amber-900' : 'bg-transparent text-[#3b2f2f] border-[#5c4033] hover:bg-[#e8dac1]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
            {filteredItems.map((item) => {
              const enhancementLetter = item.enhancement_level > 0 ? ['', 'D', 'C', 'B', 'A', 'S'][item.enhancement_level] : '';

              return (
                <div
                  key={item.id}
                  onMouseEnter={(e) => handleMouseEnter(e, item)}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                  className="relative aspect-square border-2 rounded-sm bg-[#1a1512] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-md group"
                  style={{ borderColor: rarityColor(item.rarity) }}
                >
                  <img src={item.icon_path} alt={item.name} className="w-full h-full object-cover p-1" />

                  {/* BDO Style Заточка - увеличен размер до text-5xl */}
                  {enhancementLetter && (
                    <span
                      className="absolute inset-0 flex items-center justify-center font-bold text-5xl opacity-90 pointer-events-none select-none z-10"
                      style={{
                        color: rankColor(enhancementLetter),
                        WebkitTextStroke: '2px black',
                        textShadow: '0px 0px 4px rgba(0,0,0,0.8)'
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

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item);
                    }}
                    className={`absolute top-0 left-0 p-1 bg-black/60 rounded-br-md hover:bg-black transition-colors z-20 ${
                      item.is_pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title={item.is_pinned ? 'Открепить' : 'Закрепить'}
                  >
                    <span className="text-xs">📌</span>
                  </button>
                </div>
              );
            })}
          </div>
          {filteredItems.length === 0 && <p className="text-center text-gray-500 italic mt-10">Предметов нет.</p>}
        </div>
      </div>

      {hoveredItem && (
        <div
          className="fixed z-[60] pointer-events-none bg-black/95 border-2 border-amber-600/50 p-3 rounded-lg shadow-2xl w-64 -translate-x-1/2 -translate-y-[110%]"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <h4 className="font-bold text-sm mb-1 flex items-center justify-between" style={{ color: rarityColor(hoveredItem.rarity) }}>
            <span>{hoveredItem.name}</span>
            {hoveredItem.enhancement_level > 0 && (
              <span className="text-2xl" style={{ color: rankColor(['', 'D', 'C', 'B', 'A', 'S'][hoveredItem.enhancement_level]), WebkitTextStroke: '1px black' }}>
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
    </div>
  );
}
