import { useState, useMemo, useEffect } from 'react';
import type { InventoryItem } from '../api/character';
import { rarityColor } from '../constants';

interface Props {
  items: InventoryItem[];
  onClose: () => void;
}

export function FullInventoryModal({ items, onClose }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // Загружаем закрепленные при открытии
  useEffect(() => {
    const saved = localStorage.getItem('qb_pinned_items');
    if (saved) setPinnedIds(JSON.parse(saved));
  }, []);

  const togglePin = (id: string) => {
    let newPinned;
    if (pinnedIds.includes(id)) {
      newPinned = pinnedIds.filter(pid => pid !== id);
    } else {
      newPinned = [...pinnedIds, id];
    }
    setPinnedIds(newPinned);
    localStorage.setItem('qb_pinned_items', JSON.stringify(newPinned));
    // Сообщаем компоненту Inventory, что список изменился
    window.dispatchEvent(new Event('pinnedItemsChanged'));
  };

  const filteredItems = useMemo(() => {
    if (filter === 'pinned') {
      return items.filter(item => pinnedIds.includes(item.id));
    }
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter, pinnedIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

        {/* Шапка модалки */}
        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">Сумка странника</h2>
          <button
            onClick={onClose}
            className="text-2xl text-[#5c4033] hover:text-red-700 font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Фильтры */}
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
                filter === f.id
                  ? 'bg-amber-700 text-white border-amber-900'
                  : 'bg-transparent text-[#3b2f2f] border-[#5c4033] hover:bg-[#e8dac1]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Сетка предметов */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
            {filteredItems.map((item) => {
              const isPinned = pinnedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="relative aspect-square border-2 rounded-sm bg-[#1a1512] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-md group"
                  style={{ borderColor: rarityColor(item.rarity) }}
                  title={`${item.name} (${item.rarity})`}
                >
                  <img src={item.icon_path} alt={item.name} className="w-full h-full object-cover p-1" />

                  {/* Кнопка закрепления */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.id);
                    }}
                    className={`absolute top-0 right-0 p-1 bg-black/60 rounded-bl-md hover:bg-black transition-colors ${
                      isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title={isPinned ? 'Открепить' : 'Закрепить'}
                  >
                    <span className="text-xs">📌</span>
                  </button>

                  {(item.type === 'consumable' || item.id.endsWith('81') || item.id.endsWith('82')) && (
                    <span className="absolute bottom-0 right-1 text-white font-bold text-xs drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                      5
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <p className="text-center text-gray-500 italic mt-10">Предметов в этой категории нет.</p>
          )}
        </div>

      </div>
    </div>
  );
}
