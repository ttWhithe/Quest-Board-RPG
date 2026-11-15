import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { characterKeys } from './character';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  reward: Record<string, any>;
  unlocked: boolean;
  unlocked_at: string | null;
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

export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Achievement>(`/achievements/${id}/unlock`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
      queryClient.invalidateQueries({ queryKey: characterKeys.detail() });
    },
  });
}
