import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
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

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // УДАЛИЛИ: const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="flex gap-6 items-center">
          <span className="font-bold text-xl">⚔ QuestBoard</span>
          {user && (
            <>
              <NavLink to="/board" className={({ isActive }) => isActive ? "text-amber-400 font-bold" : "hover:text-amber-400"}>Доска</NavLink>
              <NavLink to="/character" className={({ isActive }) => isActive ? "text-amber-400 font-bold" : "hover:text-amber-400"}>Персонаж</NavLink>
              <NavLink to="/events" className={({ isActive }) => isActive ? "text-amber-400 font-bold" : "hover:text-amber-400"}>События</NavLink>
              <NavLink to="/calendar" className={({ isActive }) => isActive ? "text-amber-400 font-bold" : "hover:text-amber-400"}>Календарь</NavLink>
            </>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/character')}>
              <Emblem seed={user.emblem_seed} size={32} />
              <span className="text-sm text-gray-300">{user.nickname}</span>
            </div>
            <button onClick={handleLogout} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
              Выйти
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
            <Header />

            <main className="container mx-auto flex-1">
              <Routes>
                {/* Публичные роуты */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Защищенные роуты */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/board" replace />} />
                  <Route path="/board" element={<Board />} />
                  <Route path="/character" element={<Character />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/calendar" element={<Calendar />} />
                </Route>

                <Route path="*" element={<div className="p-8 text-red-500 text-center">404 - Страница не найдена</div>} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
