const STATS = [
  { name: 'Сила', value: 6.4, max: 10 },
  { name: 'Ловкость', value: 8.2, max: 10 },
  { name: 'Интеллект', value: 5.0, max: 10 },
  { name: 'Дух', value: 7.1, max: 10 },
  { name: 'Выносливость', value: 4.5, max: 10 },
  { name: 'Восприятие', value: 9.0, max: 10 },
  { name: 'Удача', value: 5.0, max: 10 },
];

export function SkillStats() {
  return (
    <div className="parchment-card p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 font-fantasy border-b-2 border-tavern-wood pb-2">
        Характеристики
      </h3>
      <div className="space-y-3">
        {STATS.map((stat) => (
          <div key={stat.name} className="flex items-center justify-between">
            <span className="text-[#3b2f2f] font-semibold w-32">{stat.name}</span>
            <div className="flex-1 mx-4 h-3 bg-[#c4a982] border border-[#5c4033] rounded-sm overflow-hidden">
              <div
                className="h-full bg-amber-600"
                style={{ width: `${(stat.value / stat.max) * 100}%` }}
              />
            </div>
            <span className="text-[#3b2f2f] font-bold w-12 text-right">
              {stat.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
