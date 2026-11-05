import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// ============================================================
// Types
// ============================================================

export type QuestRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type QuestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type QuestRecurrence = 'none' | 'daily' | 'weekly';
export type QuestDbStatus = 'active' | 'completed' | 'archived';
export type QuestEffectiveStatus = 'active' | 'completed' | 'failed' | 'archived';

export type QuestSort =
  | 'deadline_asc' | 'deadline_desc'
  | 'created_desc' | 'created_asc'
  | 'rank_desc' | 'rank_asc'
  | 'rarity_desc' | 'rarity_asc';

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  rank: QuestRank;
  rarity: QuestRarity;
  deadline: string | null;
  status: QuestDbStatus;
  effective_status: QuestEffectiveStatus;
  recurrence: QuestRecurrence;
  last_completed_at: string | null;
  completion_count: number;
  xp_awarded_total: number;
  created_at: string;
  updated_at: string;
}

export interface QuestFilters {
  status?: QuestEffectiveStatus | '';
  rank?: QuestRank | '';
  rarity?: QuestRarity | '';
  sort?: QuestSort;
  deadline_date?: string;
  limit?: number;
  offset?: number;
}

export interface QuestListResponse {
  items: Quest[];
  total: number;
  limit: number;
  offset: number;
}

export interface QuestCreateInput {
  title: string;
  description?: string;
  rank: QuestRank;
  rarity: QuestRarity;
  deadline?: string | null;
  recurrence?: QuestRecurrence;
}

// Ответ от POST /quests/{id}/complete (Spec §7.7)
export interface CompleteQuestResponse {
  quest: Quest;
  xp_awarded: number;
  user_after: {
    total_xp: number;
    level: number;
    xp_into_level: number;
    xp_for_next_level: number;
  };
}

// ============================================================
// Query keys
// ============================================================

export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number>) => [...questKeys.lists(), filters] as const,
  details: () => [...questKeys.all, 'detail'] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
};

// ============================================================
// Helpers
// ============================================================

function normalizeFilters(filters: QuestFilters = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (filters.status) out.status = filters.status;
  if (filters.rank) out.rank = filters.rank;
  if (filters.rarity) out.rarity = filters.rarity;
  if (filters.sort) out.sort = filters.sort;
  if (filters.deadline_date) out.deadline_date = filters.deadline_date;
  if (typeof filters.limit === 'number') out.limit = filters.limit;
  if (typeof filters.offset === 'number') out.offset = filters.offset;
  return out;
}

// ============================================================
// Queries & Mutations
// ============================================================

export function useQuests(filters: QuestFilters = {}) {
  const params = normalizeFilters(filters);
  return useQuery<QuestListResponse>({
    queryKey: questKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<QuestListResponse>('/quests', { params });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QuestCreateInput) => {
      const response = await api.post<Quest>('/quests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<CompleteQuestResponse>(`/quests/${id}/complete`);
      return response.data;
    },
    onSuccess: () => {
      // Обновляем список квестов
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
    },
  });
}
