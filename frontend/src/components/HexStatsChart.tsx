import { useMemo } from 'react';
import { useCharacterStats } from '../api/character';
import { HexSkeleton } from './Skeletons';

const MAX_VAL = 10;
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

  const points = useMemo(() => {
    if (!data) return '';
    return STAT_LABELS.map((stat, i) => {
      const val = data.stats[stat.key] || 5.0;
      const angle = (Math.PI * 2 * i) / STAT_LABELS.length - Math.PI / 2;
      const r = (val / MAX_VAL) * RADIUS;
      return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
    }).join(' ');
  }, [data]);

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
    <div className="parchment-card p-6 flex flex-col items-center justify-center">
      <h3 className="text-xl font-bold text-gray-800 mb-2 font-fantasy w-full border-b-2 border-tavern-wood pb-2">
        Профиль навыков
      </h3>
      <svg width="240" height="240" className="overflow-visible mt-4">
        {gridLines.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#5c4033" strokeOpacity={0.3} strokeWidth={1} />
        ))}
        {axes.map((axis, i) => (
          <line key={i} x1={CENTER} y1={CENTER} x2={axis.x2} y2={axis.y2} stroke="#5c4033" strokeOpacity={0.4} strokeWidth={1} />
        ))}
        <polygon points={points} fill="#d97706" fillOpacity={0.4} stroke="#b45309" strokeWidth={2} />
        {axes.map((axis, i) => (
          <text key={i} x={axis.labelX} y={axis.labelY} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-[#3b2f2f]">
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
