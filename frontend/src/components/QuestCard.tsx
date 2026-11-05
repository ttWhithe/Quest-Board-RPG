import { Quest } from '../api/quests';
import { RARITY_COLORS, RANK_COLORS } from '../constants';

interface QuestCardProps {
  quest: Quest;
  onComplete?: (id: string) => void; // Пригодится на шаге 4
}

export function QuestCard({ quest }: QuestCardProps) {
  const isCompleted = quest.effective_status === 'completed';
  const isFailed = quest.effective_status === 'failed';

  const rarityColor = RARITY_COLORS[quest.rarity];
  const rankColor = RANK_COLORS[quest.rank];

  // Форматирование дедлайна (пока простой вариант, потом вынесем в utils)
  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border-l-4 p-4 flex flex-col relative overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeftColor: rarityColor }}
    >
      {/* Бейдж ранга и индикатор редкости */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-1 rounded text-white"
            style={{ backgroundColor: rankColor }}
          >
            {quest.rank}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: rarityColor }}>
            {quest.rarity}
          </span>
        </div>
        {quest.recurrence !== 'none' && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            ↻ {quest.recurrence}
          </span>
        )}
      </div>

      {/* Заголовок и описание */}
      <div className="mb-4 flex-1 relative">
        <h3 className={`font-bold text-lg text-gray-800 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
          {quest.title}
        </h3>
        {quest.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {quest.description}
          </p>
        )}

        {/* Красный крест для выполненных (Spec §15) */}
        {isCompleted && (
          <div className="absolute -left-2 top-0 text-red-500 text-2xl font-bold opacity-80 pointer-events-none">
            ✕
          </div>
        )}
      </div>

      {/* Подвал карточки: дедлайн и XP */}
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100 text-sm">
        <div className="text-gray-500">
          {quest.deadline ? (
            <span className={isFailed ? 'text-red-600 font-medium' : ''}>
              ⏳ {formatDeadline(quest.deadline)}
            </span>
          ) : (
            <span>Без дедлайна</span>
          )}
        </div>
        <div className="font-semibold text-amber-600">
          {quest.xp_awarded_total > 0 ? `${quest.xp_awarded_total} XP` : '... XP'}
        </div>
      </div>
    </div>
  );
}
