import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

export function DailyRewardModal() {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [claimedXp, setClaimedXp] = useState<number | null>(null);

  const { data: rewardInfo } = useQuery({
    queryKey: ['daily-reward'],
    queryFn: authApi.getDailyReward,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Исправлено: используем useEffect для открытия модалки
  useEffect(() => {
    if (rewardInfo?.can_claim && claimedXp === null) {
      setIsOpen(true);
    }
  }, [rewardInfo, claimedXp]);

  const claimMutation = useMutation({
    mutationFn: authApi.claimDailyReward,
    onSuccess: (data) => {
      setClaimedXp(data.xp_awarded);
      // Обновляем AuthContext, чтобы огонек появился мгновенно
      updateUser({
        total_xp: data.new_total_xp,
        daily_reward_day: data.next_day,
        login_streak: data.login_streak
      });
      queryClient.invalidateQueries({ queryKey: ['daily-reward'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });

  if (!isOpen || !rewardInfo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="parchment-card w-full max-w-2xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/images/parchment-texture.png')] opacity-20 pointer-events-none mix-blend-multiply" />

        <h2 className="text-3xl font-bold text-center text-[#3b2f2f] font-fantasy mb-2 relative z-10">
          Ежедневный дар
        </h2>
        <p className="text-center text-[#5c4033] mb-6 relative z-10">
          Твоя серия: <span className="font-bold text-orange-600">🔥 {rewardInfo.streak} дней</span>
        </p>

        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-8 relative z-10">
          {rewardInfo.rewards.map((reward) => {
            const isCurrent = reward.day === rewardInfo.current_day;
            const isPast = reward.day < rewardInfo.current_day;

            return (
              <div
                key={reward.day}
                className={`relative flex flex-col items-center justify-between p-2 rounded-lg border-2 h-32 transition-all
                  ${isCurrent ? 'border-amber-600 bg-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.6)] z-10' :
                    isPast ? 'border-[#5c4033]/30 bg-black/5 opacity-50' : 'border-[#5c4033]/50 bg-[#e8dac1]'}`}
              >
                <span className="text-xs font-bold text-[#5c4033] w-full text-center">День {reward.day}</span>

                <div className="text-3xl">
                  {reward.type === 'xp' ? '✨' : '🎁'}
                </div>

                <span className="text-[10px] font-bold text-center leading-tight text-[#3b2f2f] w-full">
                  {reward.label}
                </span>

                {isPast && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                    <span className="text-3xl text-green-700 drop-shadow-md">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center relative z-10">
          {claimedXp !== null ? (
            <div className="text-center">
              <p className="text-xl font-bold text-green-700 mb-4 animate-bounce">
                Получено +{claimedXp} XP!
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-wood px-8"
              >
                Продолжить
              </button>
            </div>
          ) : (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="btn-wood px-12 py-3 text-lg font-bold animate-pulse hover:animate-none"
            >
              {claimMutation.isPending ? 'Получение...' : 'Забрать награду'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
