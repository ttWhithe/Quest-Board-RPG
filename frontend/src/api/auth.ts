import { api } from './client';
import type { AuthResponse, User } from '../types';

export interface DailyReward {
  day: number;
  type: 'xp' | 'item';
  amount: number;
  item_id?: string;
  label: string;
}

export interface DailyRewardInfo {
  rewards: DailyReward[];
  current_day: number;
  can_claim: boolean;
  streak: number;
}

export const authApi = {
  login: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  demo: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/demo');
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  getDailyReward: async (): Promise<DailyRewardInfo> => {
    const response = await api.get<DailyRewardInfo>('/auth/daily-reward');
    return response.data;
  },

  claimDailyReward: async (): Promise<{ success: boolean; xp_awarded: number; next_day: number; new_total_xp: number; login_streak: number }> => {
    const response = await api.post('/auth/daily-reward');
    return response.data;
  }
};
