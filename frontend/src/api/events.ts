import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type EventKind = 'birthday' | 'holiday' | 'reminder' | 'custom';

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  kind: EventKind;
  repeats_yearly: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreateInput {
  title: string;
  date: string;
  kind: EventKind;
  repeats_yearly?: boolean;
}

export interface EventUpdateInput {
  title?: string;
  date?: string;
  kind?: EventKind;
  repeats_yearly?: boolean;
}

export const eventKeys = {
  all: ['events'] as const,
  list: () => [...eventKeys.all, 'list'] as const,
};

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: eventKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<Event[]>('/events');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventCreateInput) => {
      const { data } = await api.post<Event>('/events', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.list() }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: EventUpdateInput }) => {
      const { data } = await api.patch<Event>(`/events/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.list() }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.list() }),
  });
}
