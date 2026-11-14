import type { CharacterStats } from '../api/character';
import { RANK_COLORS } from '../constants';

interface Props {
  stats: CharacterStats;
}

export function QuestStats({ stats }: Props) {
  const ranks = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const;

  return (
    <div className="parchment-card p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-4 font-fantasy border-b-2 border-tavern-wood pb-2">
        Статистика гильдии
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
          <p className="text-xs text-green-700 font-medium uppercase tracking-wider">Выполнено</p>
          <p className="text-3xl font-bold text-green-800">{stats.completed_total}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
          <p className="text-xs text-red-700 font-medium uppercase tracking-wider">Провалено</p>
          <p className="text-3xl font-bold text-red-800">{stats.failed_total}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider text-center">Выполнено по рангам</p>
        <div className="flex justify-center gap-1.5 flex-wrap">
          {ranks.map(rank => (
            <div
              key={rank}
              className="flex flex-col items-center justify-center w-9 h-9 rounded text-white font-bold shadow-sm text-xs"
              style={{ backgroundColor: RANK_COLORS[rank] }}
              title={`Ранг ${rank}: ${stats.by_rank[rank]}`}
            >
              <span className="text-[9px] opacity-80">{rank}</span>
              <span>{stats.by_rank[rank]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
