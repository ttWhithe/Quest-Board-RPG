import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quest } from '../api/quests';
import { useCompleteQuest } from '../api/quests';
import { RARITY_COLORS, RANK_BASE, RARITY_MULT } from '../constants';
import { formatDeadline } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';

export function QuestCard({ quest }: { quest: Quest }) {
  const { updateUser } = useAuth();
  const { mutate: completeQuest, isPending } = useCompleteQuest();
  const [showXp, setShowXp] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  const isCompleted = quest.effective_status === 'completed';
  // Цвет печати = редкость (срочность)
  const rarityColor = RARITY_COLORS[quest.rarity];

  // Расчет потенциального XP (для отображения до выполнения)
  const calculatePotentialXp = () => {
    let base = RANK_BASE[quest.rank] || 0;
    let mult = RARITY_MULT[quest.rarity] || 1.0;
    let urgencyMult = 1.0;

    // Проверка на срочность (ТЗ §5.5)
    if (quest.recurrence === 'none' && quest.deadline) {
      const deadlineTime = new Date(quest.deadline).getTime();
      const now = new Date().getTime();
      const diffHours = (deadlineTime - now) / (1000 * 60 * 60);

      if (diffHours >= 0 && diffHours < 24) {
        urgencyMult = 1.5;
      }
    }

    return Math.floor(base * mult * urgencyMult);
  };

  const potentialXp = calculatePotentialXp();

  const handleComplete = () => {
    completeQuest(quest.id, {
      onSuccess: (data) => {
        updateUser({ total_xp: data.user_after.total_xp });
        setEarnedXp(data.xp_awarded);
        setShowXp(true);
        setTimeout(() => setShowXp(false), 2000);
      },
      onError: (err: any) => {
        const code = err.response?.data?.code;
        if (code === 'ALREADY_COMPLETED') alert('Квест уже выполнен!');
        else if (code === 'ALREADY_COMPLETED_IN_PERIOD') alert('Квест уже выполнен в этом периоде!');
        else if (code === 'QUEST_ARCHIVED') alert('Квест в архиве.');
        else alert('Ошибка при выполнении квеста');
      },
    });
  };

  return (
    <div className="relative group">
      {/* Гвоздь, прибивающий карточку */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-md border border-gray-600 z-20"></div>

      <div
        className="torn-paper p-4 flex flex-col relative transition-transform group-hover:-translate-y-1"
      >
        <AnimatePresence>
          {showXp && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -60, scale: 1.2 }}
              exit={{ opacity: 0, y: -80 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-fantasy font-bold text-tavern-gold drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] z-30 pointer-events-none"
            >
              +{earnedXp} XP
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-start mb-2 relative z-10">
          {/* Сургучная печать: Цвет от редкости, Буква от ранга */}
          <div
            className="wax-seal"
            style={{ backgroundColor: rarityColor }}
            title={`Редкость: ${quest.rarity}, Ранг: ${quest.rank}`}
          >
            {quest.rank}
          </div>

          {quest.recurrence !== 'none' && (
            <span className="text-xs bg-[#eaddc5] text-[#3b2f2f] px-2 py-1 border border-[#3b2f2f] font-bold shadow-sm" style={{ borderRadius: '2px 8px 3px 8px' }}>
              ↻ {quest.recurrence === 'daily' ? 'Ежедневно' : 'Еженедельно'}
            </span>
          )}
        </div>

        <h3 className={`text-lg font-bold leading-tight mb-4 flex-1 text-[#3b2f2f] ${isCompleted ? 'line-through opacity-50' : ''}`}>
          {quest.title}
        </h3>

        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <span className="text-red-600 font-black opacity-90 text-[15rem] leading-none rotate-[-15deg] select-none">
              ✕
            </span>
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-center text-sm border-t-2 border-dashed border-[#8b7355] pt-3 font-bold text-[#5c4033]">
            <span className="flex items-center gap-1">
              <span className="text-lg">⌛</span>
              {quest.deadline ? formatDeadline(quest.deadline) : 'Бессрочно'}
            </span>
            <span className="text-amber-800">
              {isCompleted ? `${quest.xp_awarded_total} XP` : `${potentialXp} XP`}
            </span>
          </div>

          {!isCompleted && quest.effective_status !== 'archived' && (
            <button
              onClick={handleComplete}
              disabled={isPending}
              className="btn-wood w-full text-sm py-2 disabled:opacity-50 border-[#2a1b14] shadow-[0_4px_0_#2a1b14] active:shadow-none hover:-translate-y-[2px] transition-all"
            >
              {isPending ? '...' : 'Выполнить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
