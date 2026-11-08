import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useQuests } from '../api/quests';
import { useEvents } from '../api/events';
import type { Event } from '../api/events';
import { ScrollOfTime } from '../components/ScrollOfTime';
import { CalendarSkeleton } from '../components/Skeletons';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  // 1. Запрашиваем квесты с дедлайном на выбранный день
  const { data: questsData, isLoading: isQuestsLoading } = useQuests({ deadline_date: dateStr });

  // 2. Запрашиваем все события
  const { data: eventsData, isLoading: isEventsLoading } = useEvents();

  // Фильтруем события на выбранный день (с учетом повторения каждый год)
  const filteredEvents = (eventsData || []).filter((ev: Event) => {
    const evDate = new Date(ev.date);
    if (!ev.repeats_yearly) {
      return evDate.getDate() === currentDate.getDate() &&
             evDate.getMonth() === currentDate.getMonth() &&
             evDate.getFullYear() === currentDate.getFullYear();
    }
    // Если ежегодное: проверяем месяц, день и что год не раньше даты создания
    return evDate.getDate() === currentDate.getDate() &&
           evDate.getMonth() === currentDate.getMonth() &&
           currentDate.getFullYear() >= evDate.getFullYear();
  });

  const handlePrevDay = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate((prev) => addDays(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  if (isQuestsLoading || isEventsLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Свиток времени</h1>
        </div>
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Свиток времени</h1>
      </div>

      {/* Панель управления датой */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 rounded text-gray-600 font-bold">
            &larr;
          </button>
          <h2 className="text-lg md:text-xl font-bold text-gray-800 min-w-[150px] md:min-w-[200px] text-center capitalize">
            {format(currentDate, 'd MMMM yyyy', { locale: ru })}
          </h2>
          <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 rounded text-gray-600 font-bold">
            &rarr;
          </button>
        </div>
        <button onClick={handleToday} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium text-sm w-full sm:w-auto">
          Сегодня
        </button>
      </div>

      {/* Подсказка для мобильных устройств */}
      <div className="md:hidden flex flex-col items-center justify-center bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg mb-4 text-sm text-center">
        <span className="font-bold mb-1">📱 Мобильная версия</span>
        <span>Листайте шкалу влево/вправо или поверните телефон горизонтально для удобного просмотра.</span>
      </div>

      {/* Сам свиток (обертка для скролла на мобильных) */}
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[600px]">
          <ScrollOfTime
            quests={questsData?.items || []}
            events={filteredEvents}
            currentDate={currentDate}
          />
        </div>
      </div>
    </div>
  );
}
