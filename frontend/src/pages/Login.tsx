import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

export function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login(data.access_token, data.user);
      navigate('/board');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setIsLoading(true);
    try {
      const data = await authApi.demo();
      login(data.access_token, data.user);
      navigate('/board');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка демо-режима');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="parchment-card max-w-md mx-auto mt-20 p-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-[#3b2f2f] font-fantasy tracking-wider">
        {t('auth.login')}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 font-bold text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#5c4033] mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-fantasy w-full"
            placeholder="Введите email..."
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#5c4033] mb-1">Пароль</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-fantasy w-full"
            placeholder="Введите пароль..."
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-wood w-full mt-2"
        >
          {isLoading ? t('common.loading') : 'Войти'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#8b7355]"></div>
          <span className="flex-shrink-0 mx-4 text-[#8b7355] font-bold">или</span>
          <div className="flex-grow border-t border-[#8b7355]"></div>
        </div>

        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="btn-fantasy w-full mt-4"
        >
          {t('auth.demo')}
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-[#3b2f2f] font-medium">
        Нет аккаунта? <Link to="/register" className="text-amber-700 hover:text-amber-600 font-bold ml-1">Зарегистрироваться</Link>
      </div>
    </div>
  );
}
