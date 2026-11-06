import { useState } from 'react';
import { useEvents, useDeleteEvent } from '../api/events';
import type { Event } from '../api/events';
import { EventForm } from '../components/EventForm';

const KIND_ICONS: Record<string, string> = {
  birthday: '🎂',
  holiday: '🌟',
  reminder: '🔔',
  custom: '✨',
};

export function Events() {
  const { data: events, isLoading, isError } = useEvents();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  const openCreate = () => {
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const openEdit = (ev: Event) => {
    setEditingEvent(ev);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Удалить это событие?')) {
      deleteEvent(id, { onError: () => alert('Ошибка при удалении') });
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500">Загрузка событий...</div>;
  if (isError) return <div className="text-center py-20 text-red-500">Ошибка загрузки событий.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">События и напоминания</h1>
        <button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded shadow">
          + Новое событие
        </button>
      </div>

      {events?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 text-lg mb-4">Событий пока нет</p>
          <button onClick={openCreate} className="text-amber-500 hover:underline">Создать первое событие</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events?.map((ev) => (
            <div key={ev.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div className="text-2xl">{KIND_ICONS[ev.kind]}</div>
                {ev.repeats_yearly && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Ежегодно</span>
                )}
              </div>
              <h3 className="font-bold text-lg text-gray-800 flex-1">{ev.title}</h3>
              <div className="text-sm text-gray-500 mt-2 mb-4">
                {new Date(ev.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="flex gap-2 border-t pt-3">
                <button onClick={() => openEdit(ev)} className="flex-1 text-sm text-blue-600 hover:bg-blue-50 py-1 rounded">
                  Изменить
                </button>
                <button onClick={() => handleDelete(ev.id)} disabled={isDeleting} className="flex-1 text-sm text-red-600 hover:bg-red-50 py-1 rounded disabled:opacity-50">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6">
              {editingEvent ? 'Редактировать событие' : 'Новое событие'}
            </h2>
            <EventForm
              initialData={editingEvent}
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
