import { useState } from 'react';
import { useCreateEvent, useUpdateEvent } from '../api/events';
import type { Event, EventKind } from '../api/events';

interface EventFormProps {
  initialData?: Event;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
  const isEditing = !!initialData;
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const isPending = isCreating || isUpdating;

  const [title, setTitle] = useState(initialData?.title || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [kind, setKind] = useState<EventKind>(initialData?.kind || 'custom');
  const [repeatsYearly, setRepeatsYearly] = useState(initialData?.repeats_yearly || false);

  const handleKindChange = (newKind: EventKind) => {
    setKind(newKind);
    if (newKind === 'birthday') {
      setRepeatsYearly(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      date,
      kind,
      repeats_yearly: kind === 'birthday' ? true : repeatsYearly,
    };

    if (isEditing) {
      updateEvent({ id: initialData.id, payload }, {
        onSuccess,
        onError: (err: any) => alert(err.response?.data?.detail || 'Ошибка при обновлении'),
      });
    } else {
      createEvent(payload, {
        onSuccess,
        onError: (err: any) => alert(err.response?.data?.detail || 'Ошибка при создании'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Название</label>
        <input
          type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          placeholder="День рождения Гильдмастера..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Дата</label>
          <input
            type="date" required value={date} onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Тип события</label>
          <select
            value={kind} onChange={(e) => handleKindChange(e.target.value as EventKind)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="custom">Кастомное</option>
            <option value="birthday">День рождения</option>
            <option value="holiday">Праздник</option>
            <option value="reminder">Напоминание</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox" id="repeats" checked={repeatsYearly}
          onChange={(e) => setRepeatsYearly(e.target.checked)}
          disabled={kind === 'birthday'}
          className="rounded border-gray-300"
        />
        <label htmlFor="repeats" className="text-sm text-gray-700">
          Повторять каждый год {kind === 'birthday' && '(обязательно для ДР)'}
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
          Отмена
        </button>
        <button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50">
          {isPending ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
        </button>
      </div>
    </form>
  );
}
