import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { User } from '../types';
import type { QuestRank } from './quests';
import { useToast } from '../contexts/ToastContext';
import { RARITY_COLORS } from '../constants';
import type { NewAchievementEvent } from './quests';

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

export interface CharacterUpdate {
  nickname?: string;
  emblem_seed?: string;
  guild_symbol?: string;
  timezone?: string;
  pinned_achievements?: string[];
}

export const characterKeys = {
  all: ['character'] as const,
  detail: () => [...characterKeys.all, 'detail'] as const,
  inventory: () => [...characterKeys.all, 'inventory'] as const,
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
      // Принудительно просим React Query обновить данные на странице персонажа
      queryClient.invalidateQueries({ queryKey: characterKeys.detail() });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<CharacterResponse>('/character/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      // Обновляем кэш персонажа
      queryClient.setQueryData(characterKeys.detail(), data);
      // На всякий случай инвалидируем, чтобы точно обновилось
      queryClient.invalidateQueries({ queryKey: characterKeys.detail() });
    },
  });
}

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
  enhancement_stats?: Record<string, Record<string, number>> | null; // Добавлено
  is_pinned: boolean;
  equipped_slot: string | null;
  enhancement_level: number;
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
    queryKey: characterKeys.inventory(),
    queryFn: async () => {
      const { data } = await api.get<InventoryResponse>('/character/inventory');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ itemId, payload }: any) => {
      // Бэкенд теперь возвращает { item, new_achievements }
      const { data } = await api.patch<{ item: InventoryItem, new_achievements?: NewAchievementEvent[] }>(`/character/inventory/${itemId}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: [...characterKeys.all, 'stats'] });

      data.new_achievements?.forEach((ach, index) => {
        setTimeout(() => {
          addToast({
            title: `Достижение: ${ach.name}`,
            description: ach.description,
            icon: `/icons/${ach.icon}.svg`,
            color: RARITY_COLORS[ach.rarity] || '#5c4033',
          });
        }, index * 500);
      });
    },
  });
}
