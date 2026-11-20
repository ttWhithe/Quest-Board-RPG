import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { characterKeys } from './character';
import { useToast } from '../contexts/ToastContext';
import { RARITY_COLORS } from '../constants';
import type { NewAchievementEvent } from './quests';

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  type: 'start' | 'small' | 'notable';
  x: number;
  y: number;
  max_rank: number;
  rank: number;
  can_upgrade: boolean;
}

export interface TalentTreeResponse {
  available_points: number;
  total_spent_points: number;
  nodes: TalentNode[];
  edges: [string, string][];
}

export interface TalentUpgradeResponse {
  available_points: number;
  node: TalentNode;
  new_achievements?: NewAchievementEvent[];
}

export const talentKeys = {
  all: ['talents'] as const,
};

export function useTalents() {
  return useQuery<TalentTreeResponse>({
    queryKey: talentKeys.all,
    queryFn: async () => {
      const { data } = await api.get<TalentTreeResponse>('/talents');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUpgradeTalent() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<TalentUpgradeResponse>(`/talents/${code}/upgrade`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: talentKeys.all });
      queryClient.invalidateQueries({ queryKey: characterKeys.detail() });

      // Тосты
      data.new_achievements?.forEach((ach, index) => {
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
