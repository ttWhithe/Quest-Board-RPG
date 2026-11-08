import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Emblem } from './components/Emblem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Board } from './pages/Board';
import { Character } from './pages/Character';
import { Events } from './pages/Events';
import { Calendar } from './pages/Calendar';

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

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { to: '/board', label: 'Доска' },
    { to: '/character', label: 'Персонаж' },
    { to: '/events', label: 'События' },
    { to: '/calendar', label: 'Календарь' },
  ];

  const currentTitle = PAGE_TITLES[location.pathname] || '';

  return (
    // Сделали sticky top-0 и z-50, чтобы шапка всегда была сверху
    <header className="bg-slate-800 text-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center relative">
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
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/character')}
            >
              <Emblem seed={user.emblem_seed} size={32} />
              <span className="text-sm text-gray-300">{user.nickname}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
            >
              Выйти
            </button>
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
              <Emblem seed={user.emblem_seed} size={40} />
              <span className="font-semibold">{user.nickname}</span>
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
          <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col w-full">
            <Header />

            <main className="flex-1 w-full flex flex-col relative">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/board" replace />} />
                  <Route path="/board" element={<Board />} />
                  <Route path="/character" element={<Character />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/calendar" element={<Calendar />} />
                </Route>

                <Route
                  path="*"
                  element={<div className="p-8 text-red-500 text-center">404 - Страница не найдена</div>}
                />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
