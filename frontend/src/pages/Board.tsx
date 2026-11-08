import { useState } from 'react';
import { useQuests } from '../api/quests';
import type { QuestFilters } from '../api/quests';
import { QuestCard } from '../components/QuestCard';
import { QuestForm } from '../components/QuestForm';
import { QuestCardSkeleton } from '../components/Skeletons';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Обработчик изменения фильтров
  const handleFilterChange = (key: keyof QuestFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Шапка доски */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-parchment-light drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Доска квестов</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-fantasy w-full sm:w-auto"
        >
          + Новый квест
        </button>
      </div>

      {/* Панель фильтров (Spec §15) */}
      <div className="parchment-card p-4 mb-6 flex flex-wrap gap-4 items-center">
        <select
          className="input-fantasy text-sm"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="active">В процессе</option>
          <option value="completed">Выполненные</option>
          <option value="failed">Проваленные</option>
        </select>

        <select
          className="input-fantasy text-sm"
          value={filters.rank}
          onChange={(e) => handleFilterChange('rank', e.target.value)}
        >
          <option value="">Все ранги (сложность)</option>
          <option value="S">S (высшая сложность)</option>
          <option value="A">A (очень сложный)</option>
          <option value="B">B (сложный)</option>
          <option value="C">C (средний)</option>
          <option value="D">D (легкий)</option>
          <option value="E">E (очень легкий)</option>
          <option value="F">F (пустяк)</option>
        </select>

        <select
          className="input-fantasy text-sm"
          value={filters.rarity}
          onChange={(e) => handleFilterChange('rarity', e.target.value)}
        >
          <option value="">Вся редкость (срочность)</option>
          <option value="legendary">legendary (горит!)</option>
          <option value="epic">epic (очень срочно)</option>
          <option value="rare">rare (срочно)</option>
          <option value="uncommon">uncommon (не срочно)</option>
          <option value="common">common (обычный)</option>
        </select>

        <select
          className="input-fantasy text-sm"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <QuestCardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && (
        <div className="text-center py-10 text-red-500">Ошибка загрузки квестов.</div>
      )}

      {/* Сетка квестов */}
      {!isLoading && !isError && data?.items.length === 0 && (
        <div className="text-center py-20 parchment-card">
          <p className="text-gray-500 text-lg mb-4">Квестов пока нет</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-amber-500 hover:underline"
          >
            Создать первый квест
          </button>
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.items.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {/* Модалка создания квеста */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="parchment-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6">Новый квест</h2>
            <QuestForm
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
