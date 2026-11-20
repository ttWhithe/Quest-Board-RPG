import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './client';
import { useToast } from '../contexts/ToastContext';
import { RARITY_COLORS } from '../constants';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  reward: Record<string, any>;
  unlocked: boolean;
  unlocked_at: string | null;
  progress?: { current: number; target: number } | null;
}

export const achievementKeys = {
  all: ['achievements'] as const,
};

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: achievementKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Achievement[]>('/achievements');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTrackEvent() {
  const { addToast } = useToast();
  return useMutation({
    mutationFn: async (statName: string) => {
      const { data } = await api.post('/achievements/track', { stat_name: statName });
      return data;
    },
    onSuccess: (newAchievements: any[]) => {
      newAchievements?.forEach((ach, index) => {
        setTimeout(() => {
          addToast({
            title: `Достижение: ${ach.name}`,
            description: ach.description,
            icon: ach.icon,
            color: RARITY_COLORS[ach.rarity] || '#5c4033',
          });
        }, index * 500);
      });
    },
  });
}
