import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quest } from '../api/quests';
import { useCompleteQuest } from '../api/quests';
import { RARITY_COLORS, RANK_BASE, RARITY_MULT } from '../constants';
import { formatDeadline } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function QuestCard({ quest }: { quest: Quest }) {
  const { updateUser } = useAuth();
  const { addToast } = useToast();
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

        // Показываем тосты за полученные достижения
        if (data.new_achievements && data.new_achievements.length > 0) {
          data.new_achievements.forEach((ach, index) => {
            setTimeout(() => {
              addToast({
                title: `Достижение: ${ach.name}`,
                description: ach.description,
                icon: `/icons/${ach.icon}.svg`,
                color: RARITY_COLORS[ach.rarity] || '#5c4033',
              });
            }, index * 500); // Небольшая задержка между тостами
          });
        }
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
        className="torn-paper p-4 flex flex-col relative transition-transform group-hover:-translate-y-1 h-full"
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

      {/* Крестик выполненного квеста — ВЫНЕСЕН ИЗ torn-paper, чтобы не обрезался */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-[140%] h-[140%] opacity-80 rotate-[-8deg] drop-shadow-2xl"
          >
            <path
              d="M105.367 18.328c23.14 15.444 46.098 31.27 68.55 47.572-45.055-20.895-94.51-35.918-149.37-44.246 46.697 26.72 91.596 55.58 135.705 85.524-37.203-18.033-77.48-32.22-121.602-41.37 58.218 34.322 109.368 72.465 154.71 114.206C136.02 227.227 86.295 284.717 45.79 354.18c27.11-24.29 54.91-47.545 82.868-70.68C81.942 339.36 45.05 405.01 20.2 482.135c20.36-24.62 40.988-48.203 61.905-70.817 44.7-67.485 89.567-147.11 148.856-170.418-29.61 30.708-63.36 75.164-98.25 118.145 40.99-40.437 83.09-77.46 126.415-111.512 61.598 70.49 110.757 149.38 152.145 235.873-6.738-44.794-16.796-87.384-30.03-127.666l46.444 65.53s-26.037-72.69-43.66-101.987c40.76 55.91 78.208 114.428 112.328 175.205-18.674-89.454-50.512-169.772-98.893-238.224a1783.223 1783.223 0 0 1 100.93 109.045C465.048 288.827 423.58 221.82 372.214 167c40.224-25.887 81.48-49.73 123.863-71.783a757.16 757.16 0 0 0-92.006 21.934c21.836-16.173 44.41-32.124 67.024-47.523-37.987 11.91-74.633 25.775-109.067 41.433 42.668-27.673 86.32-53.668 131.004-78.602h-.003c-67.47 18.055-130.83 42.19-188.998 73.548-56.294-41.79-122.01-71.787-198.663-87.68z"
              fill="#c30000" /* Темно-бордовый (кровь) */
            />
          </svg>
        </div>
      )}
    </div>
  );
}
