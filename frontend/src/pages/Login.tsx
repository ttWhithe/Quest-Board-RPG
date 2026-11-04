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
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{t('auth.login')}</h2>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Пароль</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-800 text-white p-2 rounded hover:bg-slate-700 disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={handleDemo}
          disabled={isLoading}
          className="w-full bg-amber-500 text-white p-2 rounded hover:bg-amber-600 disabled:opacity-50"
        >
          {t('auth.demo')}
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Нет аккаунта? <Link to="/register" className="text-blue-600 hover:underline">{t('auth.register')}</Link>
      </div>
    </div>
  );
}
