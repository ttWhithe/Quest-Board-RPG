import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { characterKeys } from './character';

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
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<TalentUpgradeResponse>(`/talents/${code}/upgrade`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talentKeys.all });
      queryClient.invalidateQueries({ queryKey: characterKeys.detail() });
    },
  });
}
