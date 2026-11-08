import { useMemo, useState, useEffect } from 'react';
import { isSameDay } from 'date-fns';
import type { Quest } from '../api/quests';
import type { Event } from '../api/events';
import { RARITY_COLORS } from '../constants';
import { formatTime, minutesToPercent } from '../utils/date';

interface ScrollOfTimeProps {
  quests: Quest[];
  events: Event[];
  currentDate: Date;
}

export function ScrollOfTime({ quests, events, currentDate }: ScrollOfTimeProps) {
  const isToday = isSameDay(currentDate, new Date());

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nowPercent = minutesToPercent(now);

  const questsWithDeadlines = useMemo(() => {
    return quests.filter((q) => q.deadline).map((q) => {
      const d = new Date(q.deadline!);
      return {
        ...q,
        percent: minutesToPercent(d),
        timeStr: formatTime(d),
      };
    });
  }, [quests]);

  return (
    <div className="flex flex-col gap-8 min-w-[600px]">
      <div className="relative h-24 mt-6">
        {/* Линия времени */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#8b7355] -translate-y-1/2 rounded-full" />

        {/* Деления */}
        {[0, 6, 12, 18, 24].map((h) => (
          <div key={h} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${(h / 24) * 100}%` }}>
            <div className="w-0.5 h-3 bg-[#5c4033]" />
            <span className="text-xs font-bold text-[#5c4033] mt-1">{h.toString().padStart(2, '0')}:00</span>
          </div>
        ))}

        {/* Красная линия "Сейчас" */}
        {isToday && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-700 z-10 -translate-x-1/2" style={{ left: `${nowPercent}%` }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-700 text-white text-xs font-bold px-2 py-1 rounded shadow-md whitespace-nowrap border border-red-900">
              Сейчас {formatTime(now)}
            </div>
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-700 border-2 border-white rounded-full shadow -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}

        {/* Маркеры квестов */}
        {questsWithDeadlines.map((q) => (
          <div key={q.id} className="absolute top-1/2 -translate-y-1/2 -ml-2.5 z-20 group cursor-pointer" style={{ left: `${q.percent}%` }}>
            <div
              className="w-5 h-5 rounded-full border-2 border-[#3b2f2f] shadow-md transition-transform group-hover:scale-125"
              style={{ backgroundColor: RARITY_COLORS[q.rarity] }}
            />
            {/* Тултип */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#1e1b18] text-[#fdf5e6] text-xs p-2 rounded shadow-xl z-30 border border-[#3e2723] whitespace-nowrap">
              <div className="font-bold">{q.title}</div>
              <div className="opacity-80">{q.timeStr} • {q.rank} • {q.rarity}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#8b7355] pt-4">
        {/* Список квестов на день */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-[#5c4033] uppercase tracking-wider">Квесты на день</h3>
          {questsWithDeadlines.length === 0 ? (
            <p className="text-sm text-[#8b7355] italic">Нет квестов с дедлайном</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {questsWithDeadlines.map((q) => (
                <div key={q.id} className="flex items-center gap-2 bg-[#eaddc5] border border-[#8b7355] text-[#3b2f2f] px-2 py-1 rounded shadow-sm text-sm">
                  <span className="w-3 h-3 rounded-full border border-[#3b2f2f]" style={{ backgroundColor: RARITY_COLORS[q.rarity] }} />
                  <span className="font-bold">{q.title}</span>
                  <span className="opacity-75">({q.timeStr})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Список событий */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-[#5c4033] uppercase tracking-wider">События (напоминания)</h3>
          {events.length === 0 ? (
            <p className="text-sm text-[#8b7355] italic">Нет событий на этот день</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 bg-[#eaddc5] border border-[#8b7355] text-[#3b2f2f] px-3 py-1 rounded shadow-sm text-sm">
                  <span>★</span>
                  <span className="font-bold">{ev.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
