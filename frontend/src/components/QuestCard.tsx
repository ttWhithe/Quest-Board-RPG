import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quest } from '../api/quests';
import { useCompleteQuest } from '../api/quests';
import { RARITY_COLORS, RANK_COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface QuestCardProps {
  quest: Quest;
}

export function QuestCard({ quest }: QuestCardProps) {
  const { user, updateUser } = useAuth();
  const { mutate: completeQuest, isPending } = useCompleteQuest();

  // Состояние для анимации XP
  const [xpPopup, setXpPopup] = useState<number | null>(null);

  const isCompleted = quest.effective_status === 'completed';
  const isFailed = quest.effective_status === 'failed';
  const isArchived = quest.effective_status === 'archived';

  const rarityColor = RARITY_COLORS[quest.rarity];
  const rankColor = RANK_COLORS[quest.rank];

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleComplete = () => {
    completeQuest(quest.id, {
      onSuccess: (data) => {
        // Показываем анимацию
        setXpPopup(data.xp_awarded);
        setTimeout(() => setXpPopup(null), 1500); // Скрываем через 1.5 сек

        // Обновляем тотал XP у пользователя в глобальном контексте
        if (user) {
          updateUser({ total_xp: data.user_after.total_xp });
        }
      },
      onError: (error: any) => {
        const detail = error.response?.data?.detail || 'Ошибка при выполнении';
        alert(detail);
      }
    });
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border-l-4 p-4 flex flex-col relative"
      style={{ borderLeftColor: rarityColor }}
    >
      {/* Всплывающая анимация XP */}
      <AnimatePresence>
        {xpPopup !== null && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1.2 }}
            exit={{ opacity: 0, y: -80, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <span className="text-3xl font-black text-amber-500 drop-shadow-lg whitespace-nowrap">
              +{xpPopup} XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Подвал карточки */}
      <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm">
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

        {/* Кнопка выполнения (Скрыта, если уже выполнен или в архиве) */}
        {!isCompleted && !isArchived && (
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-4 rounded text-sm disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Выполняется...' : 'Выполнить'}
          </button>
        )}
      </div>
    </div>
  );
}
