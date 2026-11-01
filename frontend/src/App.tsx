import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// Создаем клиент TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function BoardPlaceholder() {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('board.title')}</h1>
      <p className="text-gray-500">Здесь будет доска квестов. (Tailwind работает!)</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100 text-gray-900">
          {/* Простой хедер для навигации */}
          <header className="bg-slate-800 text-white p-4 shadow-md">
            <nav className="container mx-auto flex gap-4">
              <span className="font-bold text-xl">⚔ QuestBoard</span>
              <a href="/board" className="hover:text-amber-400">Доска</a>
              <a href="/character" className="hover:text-amber-400">Персонаж</a>
            </nav>
          </header>

          {/* Основной контент */}
          <main className="container mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/board" replace />} />
              <Route path="/board" element={<BoardPlaceholder />} />
              <Route path="/login" element={<div className="p-8">Страница входа (в разработке)</div>} />
              <Route path="*" element={<div className="p-8 text-red-500">404 - Страница не найдена</div>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
