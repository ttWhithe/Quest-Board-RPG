import { useState, useMemo, useRef } from 'react';
import type { InventoryItem } from '../api/character';
import { rarityColor, rankColor, RARITY_MULTIPLIERS } from '../constants';
import { useUpdateInventoryItem } from '../api/character';

const ENHANCEMENT_LETTERS = ['', 'D', 'C', 'B', 'A', 'S'] as const;
const MAX_ENHANCEMENT = 5;

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
const RARITY_NAMES: Record<string, string> = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

const enhLetter = (level: number): string =>
  ENHANCEMENT_LETTERS[Math.min(Math.max(level, 0), MAX_ENHANCEMENT)];

type EnhStatsMap = Record<string, Record<string, number>>;
const getEnhStatsMap = (item: InventoryItem): EnhStatsMap | undefined =>
  (item as unknown as { enhancement_stats?: EnhStatsMap }).enhancement_stats;

interface Props {
  items: InventoryItem[];
  onClose: () => void;
}

export function FullInventoryModal({ items, onClose }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [mode, setMode] = useState<'inventory' | 'blacksmith'>('inventory');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { mutate: updateItem } = useUpdateInventoryItem();

  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<number | null>(null);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const handleMouseEnter = (e: React.MouseEvent, item: InventoryItem) => {
    if (mode === 'blacksmith' || selectedItemId) return;
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

  const setEnhancementLevel = (item: InventoryItem, level: number) => {
    const clamped = Math.min(Math.max(level, 0), MAX_ENHANCEMENT);
    if (clamped === item.enhancement_level) return;
    updateItem({ itemId: item.id, payload: { enhancement_level: clamped } });
  };

  const setRarity = (item: InventoryItem, rarity: string) => {
    updateItem({ itemId: item.id, payload: { rarity } });
  };

  const filteredItems = useMemo(() => {
    if (filter === 'pinned') return items.filter((item) => item.is_pinned);
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  // Обновленный расчет статов с учетом множителя редкости
  const selectedStats = useMemo(() => {
    if (!selectedItem) {
      return { base: {} as Record<string, number>, current: {} as Record<string, number>, rawCurrent: {} as Record<string, number> };
    }
    const base = selectedItem.stats as Record<string, number>;
    const letter = enhLetter(selectedItem.enhancement_level);
    const map = getEnhStatsMap(selectedItem);

    // Сначала берем базовые или заточенные статы ДО умножения на редкость
    const rawCurrent = (selectedItem.enhancement_level > 0 && map?.[letter]) ? map[letter] : base;

    // Применяем множитель редкости
    const mult = RARITY_MULTIPLIERS[selectedItem.rarity] || 1.0;
    const current: Record<string, number> = {};
    for (const [stat, val] of Object.entries(rawCurrent)) {
      current[stat] = Math.round(val * mult * 10) / 10;
    }

    return { base, current, rawCurrent };
  }, [selectedItem]);

  const rarityIndex = selectedItem ? RARITIES.indexOf(selectedItem.rarity as any) : -1;
  const canUpgradeRarity = rarityIndex !== -1 && rarityIndex < RARITIES.length - 1;
  const canDowngradeRarity = rarityIndex > 0;

  const itemClickHandler = (item: InventoryItem) => {
    if (mode === 'blacksmith') {
      setSelectedItemId(selectedItemId === item.id ? null : item.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">
            {mode === 'inventory' ? 'Сумка странника' : 'Кузница'}
          </h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold transition-colors">✕</button>
        </div>

        <div className="flex gap-2 p-3 bg-[#f4ebd8] border-b border-[#5c4033]/30 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
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

          <div className="flex gap-1 border border-[#5c4033] rounded p-1 bg-[#e8dac1] ml-auto">
            <button
              onClick={() => { setMode('inventory'); setSelectedItemId(null); }}
              className={`px-3 py-1 text-sm font-bold rounded transition-colors ${mode === 'inventory' ? 'bg-amber-700 text-white' : 'text-[#3b2f2f] hover:bg-[#d4c3a0]'}`}
            >
              Сумка
            </button>
            <button
              onClick={() => setMode('blacksmith')}
              className={`px-3 py-1 text-sm font-bold rounded transition-colors ${mode === 'blacksmith' ? 'bg-amber-700 text-white' : 'text-[#3b2f2f] hover:bg-[#d4c3a0]'}`}
            >
              ⚒ Кузница
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 min-w-0 overflow-y-auto p-6">
            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
              {filteredItems.map((item) => {
                const letter = item.enhancement_level > 0 ? enhLetter(item.enhancement_level) : '';
                const isSelected = selectedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => itemClickHandler(item)}
                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                    className={`relative aspect-square border-4 rounded-sm bg-[#1a1512] flex items-center justify-center shadow-md group transition-transform ${
                      mode === 'blacksmith' ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                    } ${isSelected ? 'scale-105 ring-2 ring-amber-400 z-10' : ''}`}
                    style={{ borderColor: rarityColor(item.rarity) }}
                  >
                    <img src={item.icon_path} alt={item.name} className="w-full h-full object-cover p-1" />

                    {letter && (
                      <span className="absolute inset-0 flex items-center justify-center font-bold text-5xl opacity-90 pointer-events-none select-none z-10"
                        style={{ color: rankColor(letter), WebkitTextStroke: '2px black', textShadow: '0px 0px 4px rgba(0,0,0,0.8)' }}>
                        {letter}
                      </span>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(item); }}
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

          {mode === 'blacksmith' && (
            <aside className="w-full md:w-80 md:border-l-2 border-t-2 md:border-t-0 border-[#5c4033] bg-[#e8dac1] flex flex-col overflow-y-auto">
              {!selectedItem ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-4xl mb-4 opacity-50">⚒</span>
                  <p className="text-[#3b2f2f]/70 italic">Выберите предмет из сетки слева, чтобы начать работу в кузнице.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center p-3 border-b border-[#5c4033]/30">
                    <h3 className="font-bold text-[#3b2f2f] text-lg truncate">{selectedItem.name}</h3>
                    <button onClick={() => setSelectedItemId(null)} className="text-[#5c4033] hover:text-red-700 font-bold">✕</button>
                  </div>

                  <div className="p-4 flex flex-col items-center border-b border-[#5c4033]/30">
                                        <div className="w-24 h-24 rounded border-[6px] bg-[#1a1512] flex items-center justify-center relative" style={{ borderColor: rarityColor(selectedItem.rarity) }}>
                      <img src={selectedItem.icon_path} alt={selectedItem.name} className="w-full h-full object-cover p-1" />
                      {selectedItem.enhancement_level > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center font-bold text-7xl pointer-events-none select-none"
                          style={{ color: rankColor(enhLetter(selectedItem.enhancement_level)), WebkitTextStroke: '2px black', textShadow: '0px 0px 4px rgba(0,0,0,0.8)' }}>
                          {enhLetter(selectedItem.enhancement_level)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#3b2f2f]/70 mt-2 capitalize">{selectedItem.type} · {selectedItem.slot === 'none' ? 'не экипируется' : selectedItem.slot}</div>
                  </div>

                  <div className="p-4 border-b border-[#5c4033]/30">
                    <h4 className="text-sm font-bold text-[#3b2f2f] mb-2 flex justify-between">
                      <span>Редкость</span>
                      <span className="text-xs font-normal text-[#3b2f2f]/60">Множитель: x{RARITY_MULTIPLIERS[selectedItem.rarity] || 1.0}</span>
                    </h4>
                    <div className="flex items-center justify-between bg-[#d4c3a0] rounded p-2">
                      <button
                        onClick={() => setRarity(selectedItem, RARITIES[rarityIndex - 1])}
                        disabled={!canDowngradeRarity}
                        className="w-8 h-8 rounded bg-[#5c4033] text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#7a5444] transition-colors"
                      >−</button>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold capitalize" style={{ color: rarityColor(selectedItem.rarity) }}>
                          {RARITY_NAMES[selectedItem.rarity] || selectedItem.rarity}
                        </span>
                      </div>
                      <button
                        onClick={() => setRarity(selectedItem, RARITIES[rarityIndex + 1])}
                        disabled={!canUpgradeRarity}
                        className="w-8 h-8 rounded bg-[#5c4033] text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#7a5444] transition-colors"
                      >+</button>
                    </div>
                  </div>

                  {getEnhStatsMap(selectedItem) ? (
                    <div className="p-4 border-b border-[#5c4033]/30">
                      <h4 className="text-sm font-bold text-[#3b2f2f] mb-2">Заточка</h4>
                      <div className="flex items-center justify-between bg-[#d4c3a0] rounded p-2">
                        <button
                          onClick={() => setEnhancementLevel(selectedItem, selectedItem.enhancement_level - 1)}
                          disabled={selectedItem.enhancement_level === 0}
                          className="w-8 h-8 rounded bg-[#5c4033] text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#7a5444] transition-colors"
                        >−</button>
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-bold leading-none" style={{ color: selectedItem.enhancement_level > 0 ? rankColor(enhLetter(selectedItem.enhancement_level)) : '#8b7a6a', WebkitTextStroke: selectedItem.enhancement_level > 0 ? '1px black' : undefined }}>
                            {selectedItem.enhancement_level > 0 ? enhLetter(selectedItem.enhancement_level) : '—'}
                          </span>
                          <span className="text-[10px] text-[#3b2f2f]/60 mt-1">ур. {selectedItem.enhancement_level}/{MAX_ENHANCEMENT}</span>
                        </div>
                        <button
                          onClick={() => setEnhancementLevel(selectedItem, selectedItem.enhancement_level + 1)}
                          disabled={selectedItem.enhancement_level >= MAX_ENHANCEMENT}
                          className="w-8 h-8 rounded bg-[#5c4033] text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#7a5444] transition-colors"
                        >+</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-b border-[#5c4033]/30 text-xs text-center text-[#3b2f2f]/60 italic">
                      Не подлежит заточке
                    </div>
                  )}

                  <div className="p-4 border-b border-[#5c4033]/30">
                    <h4 className="text-sm font-bold text-[#3b2f2f] mb-2">Характеристики</h4>
                    {Object.keys(selectedStats.current).length === 0 ? (
                      <p className="text-xs text-[#3b2f2f]/50 italic">Нет характеристик</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {Object.entries(selectedStats.current).map(([stat, val]) => {
                          const rawVal = selectedStats.rawCurrent[stat] ?? 0;
                          return (
                            <div key={stat} className="flex justify-between text-sm">
                              <span className="text-[#3b2f2f] capitalize">{stat}</span>
                              <div className="flex flex-col items-end">
                                <span className={val >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                                  {val >= 0 ? '+' : ''}{val}
                                </span>
                                <span className="text-[10px] text-[#3b2f2f]/60">
                                  (база: {rawVal >= 0 ? '+' : ''}{rawVal} × {RARITY_MULTIPLIERS[selectedItem.rarity] || 1.0})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedItem.slot !== 'none' && (
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-[#3b2f2f] mb-2">Камни (скоро)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="aspect-square border-2 border-dashed border-[#5c4033]/40 rounded bg-[#1a1512]/10 flex items-center justify-center" title="Слот для камня (скоро)">
                            <span className="text-[#5c4033]/30 text-lg">◇</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
        </div>
      </div>

      {hoveredItem && mode === 'inventory' && (
        <div className="fixed z-[60] pointer-events-none bg-black/95 border-2 border-amber-600/50 p-3 rounded-lg shadow-2xl w-64 -translate-x-1/2 -translate-y-[110%]"
          style={{ left: mousePos.x, top: mousePos.y }}>
          <h4 className="font-bold text-sm mb-1 flex items-center justify-between" style={{ color: rarityColor(hoveredItem.rarity) }}>
            <span>{hoveredItem.name}</span>
            {hoveredItem.enhancement_level > 0 && (
              <span className="text-2xl" style={{ color: rankColor(enhLetter(hoveredItem.enhancement_level)), WebkitTextStroke: '1px black' }}>
                {enhLetter(hoveredItem.enhancement_level)}
              </span>
            )}
          </h4>
          <p className="text-gray-400 text-xs italic mb-2">{hoveredItem.type} / {hoveredItem.slot}</p>
          <div className="flex flex-col gap-1 text-xs text-white border-t border-gray-700 pt-2">
            {(() => {
              const map = getEnhStatsMap(hoveredItem);
              const letter = enhLetter(hoveredItem.enhancement_level);
              const raw = (hoveredItem.enhancement_level > 0 && map?.[letter]) ? map[letter] : hoveredItem.stats;
              const mult = RARITY_MULTIPLIERS[hoveredItem.rarity] || 1.0;
              return Object.entries(raw).map(([stat, val]) => {
                const finalVal = Math.round(val * mult * 10) / 10;
                return (
                  <span key={stat} className={finalVal >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {finalVal >= 0 ? '+' : ''}{finalVal} {stat}
                  </span>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
