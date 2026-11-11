import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { User } from '../types';
import type { QuestRank } from './quests';

// Ранги сложности уже определены в api/quests.ts — переиспользуем.
export type CharacterRank = QuestRank;

export interface CharacterStats {
  completed_total: number;
  failed_total: number;
  by_rank: Record<CharacterRank, number>;
}

export interface CharacterResponse {
  user: User;
  level: number;
  xp_into_level: number;
  xp_for_next_level: number;
  xp_bonus_percent: number;
  stats: CharacterStats;
}

// PATCH /character — whitelist (Spec §7.6)
export interface CharacterUpdate {
  nickname?: string;
  emblem_seed?: string;
  timezone?: string;
}

export const characterKeys = {
  all: ['character'] as const,
  detail: () => [...characterKeys.all, 'detail'] as const,
};

export function useCharacter() {
  return useQuery<CharacterResponse>({
    queryKey: characterKeys.detail(),
    queryFn: async () => {
      const { data } = await api.get<CharacterResponse>('/character');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CharacterUpdate) => {
      const { data } = await api.patch<CharacterResponse>('/character', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(characterKeys.detail(), data);
      // Синхронизация user в AuthContext (nickname/emblem_seed/timezone) —
      // в шаге 2 через updateUser(data.user) из useAuth().
    },
  });
}

// --- НОВЫЕ ХУКИ ДЛЯ ШАГА 3 ---

export interface CharacterStatsResponse {
  stats: Record<string, number>;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  slot: string;
  rarity: string;
  icon_path: string;
  stats: Record<string, number>;
}

export interface InventoryResponse {
  items: InventoryItem[];
  total: number;
}

export function useCharacterStats() {
  return useQuery<CharacterStatsResponse>({
    queryKey: [...characterKeys.all, 'stats'],
    queryFn: async () => {
      const { data } = await api.get<CharacterStatsResponse>('/character/stats');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCharacterInventory() {
  return useQuery<InventoryResponse>({
    queryKey: [...characterKeys.all, 'inventory'],
    queryFn: async () => {
      const { data } = await api.get<InventoryResponse>('/character/inventory');
      return data;
    },
    staleTime: 30_000,
  });
}
