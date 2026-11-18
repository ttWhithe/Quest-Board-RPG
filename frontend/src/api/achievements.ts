import { useQuery } from '@tanstack/react-query';
import { api } from './client';

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
