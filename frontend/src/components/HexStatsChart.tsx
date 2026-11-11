import { useMemo } from 'react';

const STATS = [
  { name: 'Сила', value: 6.4 },
  { name: 'Ловкость', value: 8.2 },
  { name: 'Интеллект', value: 5.0 },
  { name: 'Дух', value: 7.1 },
  { name: 'Выносливость', value: 4.5 },
  { name: 'Восприятие', value: 9.0 },
  { name: 'Удача', value: 5.0 },
];

const MAX_VAL = 10;
const RADIUS = 90;
const CENTER = 120;

export function HexStatsChart() {
  const points = useMemo(() => {
    const numStats = STATS.length;
    return STATS.map((stat, i) => {
      const angle = (Math.PI * 2 * i) / numStats - Math.PI / 2;
      const r = (stat.value / MAX_VAL) * RADIUS;
      return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
    }).join(' ');
  }, []);

  const gridLines = useMemo(() => {
    return [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
      const pts = STATS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / STATS.length - Math.PI / 2;
        const r = RADIUS * scale;
        return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
      }).join(' ');
      return pts;
    });
  }, []);

  const axes = useMemo(() => {
    return STATS.map((stat, i) => {
      const angle = (Math.PI * 2 * i) / STATS.length - Math.PI / 2;
      return {
        x2: CENTER + RADIUS * Math.cos(angle),
        y2: CENTER + RADIUS * Math.sin(angle),
        labelX: CENTER + (RADIUS + 25) * Math.cos(angle),
        labelY: CENTER + (RADIUS + 25) * Math.sin(angle),
        label: stat.name,
      };
    });
  }, []);

  return (
    <div className="parchment-card p-6 flex flex-col items-center justify-center">
      <h3 className="text-xl font-bold text-gray-800 mb-2 font-fantasy w-full border-b-2 border-tavern-wood pb-2">
        Профиль навыков
      </h3>
      <svg width="240" height="240" className="overflow-visible mt-4">
        {/* Сетка */}
        {gridLines.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="#5c4033"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        ))}
        {/* Оси */}
        {axes.map((axis, i) => (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={axis.x2}
            y2={axis.y2}
            stroke="#5c4033"
            strokeOpacity={0.4}
            strokeWidth={1}
          />
        ))}
        {/* Значение */}
        <polygon
          points={points}
          fill="#d97706"
          fillOpacity={0.4}
          stroke="#b45309"
          strokeWidth={2}
        />
        {/* Подписи */}
        {axes.map((axis, i) => (
          <text
            key={i}
            x={axis.labelX}
            y={axis.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold fill-[#3b2f2f]"
          >
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
