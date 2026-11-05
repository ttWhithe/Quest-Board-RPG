import { useQuery } from '@tanstack/react-query';
import { api } from './client';

// ============================================================
// Types — контракт API (spec.md §6.2, §7.2, §7.5, §7.7)
// ============================================================

export type QuestRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type QuestRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export type QuestRecurrence = 'none' | 'daily' | 'weekly';

/** Сырой статус в БД (spec §7.5). НЕ использовать для UI/фильтров. */
export type QuestDbStatus = 'active' | 'completed' | 'archived';

/** Вычисляемый статус в API (spec §7.5). По нему красим/фильтруем. */
export type QuestEffectiveStatus =
  | 'active'
  | 'completed'
  | 'failed'
  | 'archived';

/** Значения ?sort= (spec §7.2). Некорректное → 422 VALIDATION_ERROR. */
export type QuestSort =
  | 'deadline_asc'
  | 'deadline_desc'
  | 'created_desc'
  | 'created_asc'
  | 'rank_desc'
  | 'rank_asc'
  | 'rarity_desc'
  | 'rarity_asc';

/** Квест в ответе API (spec §7.7). */
export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  rank: QuestRank;
  rarity: QuestRarity;
  /** ISO-8601 UTC, либо null. */
  deadline: string | null;
  /** Сырой статус (source of truth в БД). */
  status: QuestDbStatus;
  /** Вычисленный статус — этим живёт UI. */
  effective_status: QuestEffectiveStatus;
  recurrence: QuestRecurrence;
  last_completed_at: string | null;
  completion_count: number;
  xp_awarded_total: number;
  created_at: string;
  updated_at: string;
}

/** Параметры GET /quests (spec §7.2). Пустая строка = без фильтра. */
export interface QuestFilters {
  status?: QuestEffectiveStatus | '';
  rank?: QuestRank | '';
  rarity?: QuestRarity | '';
  sort?: QuestSort;
  /** YYYY-MM-DD в TZ пользователя (для «Свитка времени»). */
  deadline_date?: string;
  /** 1..200, default 50 на бэкенде. */
  limit?: number;
  /** >= 0, default 0. */
  offset?: number;
}

export interface QuestListResponse {
  items: Quest[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================
// Query keys — единая точка правды для инвалидации
// (пригодится в шагах 3-4: complete / archive / create)
// ============================================================

export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (filters: Record<string, string | number>) =>
    [...questKeys.lists(), filters] as const,
  details: () => [...questKeys.all, 'detail'] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
};

// ============================================================
// Helpers
// ============================================================

/**
 * Убирает пустые значения из фильтров.
 * Зачем: queryKey должен быть стабильным — `undefined`/`''`
 * не должны создавать «новый» кэш-ключ.
 */
function normalizeFilters(
  filters: QuestFilters = {},
): Record<string, string | number> {
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
// Hooks
// ============================================================

/**
 * Список квестов текущего пользователя.
 * Spec: §7.2 (фильтры/sort/пагинация), §7.5 (status-фильтр по effective_status).
 */
export function useQuests(filters: QuestFilters = {}) {
  const params = normalizeFilters(filters);
  return useQuery<QuestListResponse>({
    queryKey: questKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<QuestListResponse>('/quests', {
        params,
      });
      return data;
    },
    // Доска не критична к «свежести в миллисекунду» — 30с кэша,
    // а complete/archive/create будут инвалидировать явно (шаги 3-4).
    staleTime: 30_000,
  });
}
