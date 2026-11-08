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
    <div className="parchment-card max-w-md mx-auto mt-20 p-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-[#3b2f2f] font-fantasy tracking-wider">
        {t('auth.register')}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 font-bold text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
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
          <label className="block text-sm font-bold text-[#5c4033] mb-1">Никнейм</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={32}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="input-fantasy w-full"
            placeholder="Как вас зовут, странник?"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#5c4033] mb-1">Пароль</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-fantasy w-full"
            placeholder="Минимум 8 символов"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-wood w-full mt-2"
        >
          {isLoading ? t('common.loading') : 'Создать героя'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#3b2f2f] font-medium">
        Уже есть аккаунт? <Link to="/login" className="text-amber-700 hover:text-amber-600 font-bold ml-1">Войти</Link>
      </div>
    </div>
  );
}
