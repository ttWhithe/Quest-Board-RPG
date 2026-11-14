export interface User {
  id: string;
  email: string | null;
  nickname: string;
  emblem_seed: string;
  timezone: string;
  total_xp: number;
  is_demo: boolean;
  created_at: string;

  // Новые поля для стриков и наград
  login_streak: number;
  max_login_streak: number;
  daily_reward_day: number;
  last_daily_reward_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
