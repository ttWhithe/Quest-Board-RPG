import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { characterKeys } from './character';

export interface Talent {
  code: string;
  title: string;
  rank: number;
  max_rank: number;
  xp_bonus_per_rank: number;
  requires: Record<string, number>;
  can_upgrade: boolean;
}

export interface TalentListResponse {
  available_points: number;
  total_spent_points: number;
  talents: Talent[];
}

export interface TalentUpgradeResponse {
  available_points: number;
  talent: Talent;
}

export const talentKeys = {
  all: ['talents'] as const,
};

export function useTalents() {
  return useQuery<TalentListResponse>({
    queryKey: talentKeys.all,
    queryFn: async () => {
      const { data } = await api.get<TalentListResponse>('/talents');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUpgradeTalent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<TalentUpgradeResponse>(`/talents/${code}/upgrade`);
      return data;
    },
    onSuccess: () => {
      // Инвалидируем таланты (чтобы обновить очки и статусы can_upgrade)
      queryClient.invalidateQueries({ queryKey: talentKeys.all });
      // Инвалидируем персонажа (чтобы обновить общий процент бонуса XP)
      queryClient.invalidateQueries({ queryKey: characterKeys.detail() });
    },
  });
}
