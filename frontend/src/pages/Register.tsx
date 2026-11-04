import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

export function Register() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Получаем таймзону из браузера (Spec §5.6)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const data = await authApi.register({ email, password, nickname, timezone });
      login(data.access_token, data.user);
      navigate('/board');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{t('auth.register')}</h2>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700">Никнейм</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={32}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Пароль</label>
          <input
            type="password"
            required
            minLength={8}
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
          {isLoading ? t('common.loading') : t('auth.register')}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Уже есть аккаунт? <Link to="/login" className="text-blue-600 hover:underline">{t('auth.login')}</Link>
      </div>
    </div>
  );
}
