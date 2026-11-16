import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Emblem } from './components/Emblem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { API_BASE_URL } from './api/client';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Board = lazy(() => import('./pages/Board').then(m => ({ default: m.Board })));
const Character = lazy(() => import('./pages/Character').then(m => ({ default: m.Character })));
const Events = lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const Talents = lazy(() => import('./pages/Talents').then(m => ({ default: m.Talents })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const PAGE_TITLES: Record<string, string> = {
  '/board': 'Доска',
  '/character': 'Персонаж',
  '/events': 'События',
  '/calendar': 'Календарь',
};

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { to: '/board', label: 'Доска' },
    { to: '/character', label: 'Персонаж' },
    { to: '/talents', label: 'Таланты' },
    { to: '/events', label: 'События' },
    { to: '/calendar', label: 'Календарь' },
  ];

  const currentTitle = PAGE_TITLES[location.pathname] || '';

  return (
    // Сделали sticky top-0 и z-50, чтобы шапка всегда была сверху
    <header className="bg-tavern-wood text-parchment-light shadow-[0_4px_10px_rgba(0,0,0,0.6)] border-b-2 border-black sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-2 md:py-3 flex justify-between items-center relative">
        {/* Логотип */}
        <div
          className="font-bold text-xl cursor-pointer flex items-center gap-2 z-10"
          onClick={() => navigate('/board')}
        >
          <span>⚔</span> <span className="hidden sm:inline">QuestBoard</span>
        </div>

        {/* Название текущей страницы (только мобилки) */}
        <div className="absolute left-1/2 -translate-x-1/2 md:hidden font-semibold text-amber-400">
          {user ? currentTitle : ''}
        </div>

        {/* Десктопная навигация */}
        {user && (
          <div className="hidden md:flex gap-6 items-center ml-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'text-amber-400 font-bold' : 'hover:text-amber-400 transition-colors'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Десктопный профиль */}
        {user && (
          <div className="hidden md:flex items-center ml-auto relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <span
                className="text-lg font-bold text-parchment-light truncate max-w-[110px]"
                title={user.nickname}
              >
                {user.nickname}
              </span>
              {user.avatar_url ? (
                <img
                  src={`${API_BASE_URL}${user.avatar_url}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#5c4033]"
                />
              ) : (
                <Emblem seed={user.emblem_seed} guildSymbol={user.guild_symbol} size={40} />
              )}
              <svg className={`w-5 h-5 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Выпадающее меню */}
            {isProfileMenuOpen && (
              <>
                {/* Невидимый фон для закрытия меню по клику вне его */}
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />

                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1512] border-2 border-[#5c4033] rounded-md shadow-2xl z-50 overflow-hidden flex flex-col">
                  <button onClick={() => { navigate('/character'); setIsProfileMenuOpen(false); }} className="text-left px-4 py-2.5 hover:bg-[#5c4033]/50 text-parchment-light text-sm font-bold transition-colors">
                    <span className="mr-2">👤</span> Профиль
                  </button>
                  <button onClick={() => { alert('Настройки в разработке'); setIsProfileMenuOpen(false); }} className="text-left px-4 py-2.5 hover:bg-[#5c4033]/50 text-parchment-light text-sm font-bold transition-colors">
                    <span className="mr-2">⚙️</span> Настройки
                  </button>
                  <button onClick={() => { alert('Поддержка в разработке'); setIsProfileMenuOpen(false); }} className="text-left px-4 py-2.5 hover:bg-[#5c4033]/50 text-parchment-light text-sm font-bold transition-colors">
                    <span className="mr-2">🛡️</span> Поддержка
                  </button>
                  <div className="h-px bg-[#5c4033] w-full my-0.5"></div>
                  <button onClick={handleLogout} className="text-left px-4 py-2.5 hover:bg-red-900/50 text-red-400 text-sm font-bold transition-colors">
                    <span className="mr-2">🚪</span> Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Мобильная кнопка бургера */}
        {user && (
          <button
            className="md:hidden text-2xl focus:outline-none z-10 p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        )}
      </nav>

      {/* Мобильное выпадающее меню */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 absolute w-full left-0 shadow-lg">
          <div className="flex flex-col px-4 py-4 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
              {user.avatar_url ? (
                <img
                  src={`${API_BASE_URL}${user.avatar_url}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#5c4033]"
                />
              ) : (
                <Emblem seed={user.emblem_seed} guildSymbol={user.guild_symbol} size={48} />
              )}
              <span
                className="font-bold text-lg truncate max-w-[200px]"
                title={user.nickname}
              >
                {user.nickname}
              </span>
            </div>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'text-amber-400 font-bold' : 'text-gray-300'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="mt-2 text-left text-red-400 font-medium"
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {/* Убрали overflow-x-hidden отсюда, он переехал в index.css (body) */}
          <div className="min-h-screen flex flex-col w-full relative z-0">
            <Header />

            <main className="flex-1 w-full flex flex-col relative">
              <Suspense fallback={
                <div className="flex h-full min-h-[50vh] items-center justify-center text-amber-700 font-fantasy text-2xl animate-pulse">
                  Загрузка хроник...
                </div>
              }>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/board" replace />} />
                    <Route path="/board" element={<Board />} />
                    <Route path="/character" element={<Character />} />
                    <Route path="/talents" element={<Talents />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/calendar" element={<Calendar />} />
                  </Route>

                  <Route
                    path="*"
                    element={<div className="p-8 text-red-500 text-center">404 - Страница не найдена</div>}
                  />
                </Routes>
              </Suspense>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
