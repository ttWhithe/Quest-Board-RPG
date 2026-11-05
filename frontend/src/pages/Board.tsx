import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuests } from '../api/quests';
import type { QuestFilters } from '../api/quests';
import { QuestCard } from '../components/QuestCard';

export function Board() {
  // Состояние фильтров
  const [filters, setFilters] = useState<QuestFilters>({
    status: '',
    rank: '',
    rarity: '',
    sort: 'deadline_asc',
  });

  // Запрос данных (наш хук из шага 1)
  const { data, isLoading, isError } = useQuests(filters);

  // Обработчик изменения фильтров
  const handleFilterChange = (key: keyof QuestFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Шапка доски */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Доска квестов</h1>
        <Link
          to="/quests/new"
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded shadow"
        >
          + Новый квест
        </Link>
      </div>

      {/* Панель фильтров (Spec §15) */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <select
          className="border rounded p-2 text-sm"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="active">В процессе</option>
          <option value="completed">Выполненные</option>
          <option value="failed">Проваленные</option>
        </select>

        <select
          className="border rounded p-2 text-sm"
          value={filters.rank}
          onChange={(e) => handleFilterChange('rank', e.target.value)}
        >
          <option value="">Все ранги</option>
          {['S', 'A', 'B', 'C', 'D', 'E', 'F'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          className="border rounded p-2 text-sm"
          value={filters.rarity}
          onChange={(e) => handleFilterChange('rarity', e.target.value)}
        >
          <option value="">Вся редкость</option>
          {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          className="border rounded p-2 text-sm"
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
        >
          <option value="deadline_asc">Дедлайн (ближний)</option>
          <option value="deadline_desc">Дедлайн (дальний)</option>
          <option value="created_desc">Новые сначала</option>
          <option value="rank_desc">Ранг (сложные)</option>
        </select>
      </div>

      {/* Состояния загрузки и ошибок */}
      {isLoading && (
        <div className="text-center py-10 text-gray-500">Загрузка квестов...</div>
      )}
      {isError && (
        <div className="text-center py-10 text-red-500">Ошибка загрузки квестов.</div>
      )}

      {/* Сетка квестов */}
      {!isLoading && !isError && data?.items.length === 0 && (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 text-lg mb-4">Квестов пока нет</p>
          <Link to="/quests/new" className="text-amber-500 hover:underline">
            Создать первый квест
          </Link>
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.items.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}
    </div>
  );
}
