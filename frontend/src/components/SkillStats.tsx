import { useCharacterStats } from '../api/character';
import { ModuleSkeleton } from './Skeletons';

const STAT_LABELS: Record<string, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  intellect: 'Интеллект',
  spirit: 'Дух',
  endurance: 'Выносливость',
  perception: 'Восприятие',
  luck: 'Удача',
};

export function SkillStats() {
  const { data, isLoading } = useCharacterStats();

  if (isLoading || !data) {
    return <ModuleSkeleton />;
  }

  return (
    <div className="parchment-card p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-fantasy border-b-2 border-tavern-wood pb-2">
        Характеристики
      </h3>
      <div className="space-y-3">
        {Object.entries(STAT_LABELS).map(([key, label]) => {
          const value = data.stats[key] || 5.0;
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[#3b2f2f] font-semibold w-32">{label}</span>
              <div className="flex-1 mx-4 h-3 bg-[#c4a982] border border-[#5c4033] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
              <span className="text-[#3b2f2f] font-bold w-12 text-right">
                {value.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
