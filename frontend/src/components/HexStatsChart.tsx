import { useMemo, useState, useRef } from 'react';
import { useCharacterStats } from '../api/character';
import { HexSkeleton } from './Skeletons';

const RADIUS = 90;
const CENTER = 120;

const STAT_LABELS = [
  { key: 'strength', name: 'Сила' },
  { key: 'dexterity', name: 'Ловкость' },
  { key: 'intellect', name: 'Интеллект' },
  { key: 'spirit', name: 'Дух' },
  { key: 'endurance', name: 'Выносливость' },
  { key: 'perception', name: 'Восприятие' },
  { key: 'luck', name: 'Удача' },
];

export function HexStatsChart() {
  const { data, isLoading } = useCharacterStats();

  // Стейты для тултипа
  const [hoveredStat, setHoveredStat] = useState<{ name: string; value: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeout = useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, name: string, value: number) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    hoverTimeout.current = window.setTimeout(() => {
      setHoveredStat({ name, value });
    }, 500); // Задержка 0.5 секунд
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredStat(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Вычисляем динамический максимум
  const maxVal = useMemo(() => {
    if (!data || !data.stats) return 10;
    const values = Object.values(data.stats);
    const highestStat = values.length > 0 ? Math.max(...values) : 10;
    return highestStat > 10 ? Math.ceil(highestStat * 1.1) : 10;
  }, [data]);

  // Вычисляем координаты вершин (и строку для полигона, и массив для точек)
  const { pointsString, vertexCoords } = useMemo(() => {
    if (!data) return { pointsString: '', vertexCoords: [] };

    const coords = STAT_LABELS.map((stat, i) => {
      const val = data.stats[stat.key] || 5.0;
      const angle = (Math.PI * 2 * i) / STAT_LABELS.length - Math.PI / 2;
      const r = (val / maxVal) * RADIUS;
      return {
        x: CENTER + r * Math.cos(angle),
        y: CENTER + r * Math.sin(angle),
        name: stat.name,
        value: val,
      };
    });

    return {
      pointsString: coords.map(c => `${c.x},${c.y}`).join(' '),
      vertexCoords: coords,
    };
  }, [data, maxVal]);

  const gridLines = useMemo(() => {
    return [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
      const pts = STAT_LABELS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / STAT_LABELS.length - Math.PI / 2;
        const r = RADIUS * scale;
        return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
      }).join(' ');
      return pts;
    });
  }, []);

  const axes = useMemo(() => {
    return STAT_LABELS.map((stat, i) => {
      const angle = (Math.PI * 2 * i) / STAT_LABELS.length - Math.PI / 2;
      return {
        x2: CENTER + RADIUS * Math.cos(angle),
        y2: CENTER + RADIUS * Math.sin(angle),
        labelX: CENTER + (RADIUS + 25) * Math.cos(angle),
        labelY: CENTER + (RADIUS + 25) * Math.sin(angle),
        label: stat.name,
      };
    });
  }, []);

  if (isLoading || !data) {
    return <HexSkeleton />;
  }

  return (
    <div className="parchment-card p-6 flex flex-col items-center justify-center relative">
      <h3 className="text-xl font-bold text-gray-800 mb-2 font-fantasy w-full border-b-2 border-tavern-wood pb-2">
        Профиль навыков
      </h3>

      <svg width="240" height="260" className="overflow-visible mt-2">
        {/* Сетка */}
        {gridLines.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#5c4033" strokeOpacity={0.3} strokeWidth={1} />
        ))}

        {/* Оси */}
        {axes.map((axis, i) => (
          <line key={i} x1={CENTER} y1={CENTER} x2={axis.x2} y2={axis.y2} stroke="#5c4033" strokeOpacity={0.4} strokeWidth={1} />
        ))}

        {/* Оранжевый полигон */}
        <polygon points={pointsString} fill="#d97706" fillOpacity={0.4} stroke="#b45309" strokeWidth={2} />

        {/* Точки на вершинах */}
        {vertexCoords.map((coord, i) => (
          <circle
            key={i}
            cx={coord.x}
            cy={coord.y}
            r={4}
            fill="#b45309"
            stroke="#f4ebd8"
            strokeWidth={1.5}
            className="cursor-pointer transition-all duration-200 hover:r-6 hover:fill-[#d97706]"
            onMouseEnter={(e) => handleMouseEnter(e, coord.name, coord.value)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          />
        ))}

        {/* Подписи осей */}
        {axes.map((axis, i) => (
          <text key={i} x={axis.labelX} y={axis.labelY} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-[#3b2f2f]">
            {axis.label}
          </text>
        ))}

        {/* Подпись масштаба */}
        <text x={CENTER} y={CENTER + RADIUS + 35} textAnchor="middle" className="text-[10px] font-semibold fill-[#5c4033] opacity-60">
          Масштаб: {maxVal}
        </text>
      </svg>

      {/* Тултип (в стиле инвентаря) */}
      {hoveredStat && (
        <div
          className="fixed z-50 pointer-events-none bg-black/95 border-2 border-amber-600/50 p-3 rounded-lg shadow-2xl w-40 -translate-x-1/2 -translate-y-[110%] animate-in fade-in zoom-in duration-200"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <h4 className="font-bold text-sm mb-1 text-amber-500 text-center">
            {hoveredStat.name}
          </h4>
          <div className="text-green-400 font-bold text-lg text-center">
            {hoveredStat.value.toFixed(0.5)}
          </div>
        </div>
      )}
    </div>
  );
}
