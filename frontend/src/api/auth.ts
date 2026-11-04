import { api } from './client';
import type { AuthResponse, User } from '../types';

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
  }
};
