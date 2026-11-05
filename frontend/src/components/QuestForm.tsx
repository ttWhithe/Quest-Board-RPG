import { useState } from 'react';
import { useCreateQuest } from '../api/quests';
import type { QuestRank, QuestRarity, QuestRecurrence } from '../api/quests';

interface QuestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuestForm({ onSuccess, onCancel }: QuestFormProps) {
  const { mutate: createQuest, isPending, error } = useCreateQuest();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rank, setRank] = useState<QuestRank>('F');
  const [rarity, setRarity] = useState<QuestRarity>('common');
  const [deadline, setDeadline] = useState('');
  const [recurrence, setRecurrence] = useState<QuestRecurrence>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Конвертируем локальное время из input[type="datetime-local"] в UTC ISO
    const deadlineIso = deadline ? new Date(deadline).toISOString() : null;

    createQuest(
      {
        title,
        description: description || undefined,
        rank,
        rarity,
        deadline: deadlineIso,
        recurrence,
      },
      {
        onSuccess: () => onSuccess(),
      }
    );
  };

  // Достаем текст ошибки от бэкенда (если есть)
  const errorMessage = error ? (error as any).response?.data?.detail || 'Ошибка при создании' : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{errorMessage}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Название</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          placeholder="Убить дракона..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          rows={3}
          placeholder="Детали квеста (необязательно)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ранг (сложность)</label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value as QuestRank)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            {['S', 'A', 'B', 'C', 'D', 'E', 'F'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Редкость (срочность)</label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as QuestRarity)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Дедлайн</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Повторение</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as QuestRecurrence)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="none">Один раз</option>
            <option value="daily">Ежедневно</option>
            <option value="weekly">Еженедельно</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
        >
          {isPending ? 'Создание...' : 'Создать квест'}
        </button>
      </div>
    </form>
  );
}
