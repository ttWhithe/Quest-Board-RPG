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
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-12 min-w-[600px] overflow-x-auto">
      <div className="relative h-24 mt-6">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 -translate-y-1/2 rounded-full" />
        {[0, 6, 12, 18, 24].map((h) => (
          <div key={h} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${(h / 24) * 100}%` }}>
            <div className="w-0.5 h-3 bg-gray-400" />
            <span className="text-xs font-medium text-gray-500 mt-1">{h.toString().padStart(2, '0')}:00</span>
          </div>
        ))}
        {isToday && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 -translate-x-1/2" style={{ left: `${nowPercent}%` }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
              Сейчас {formatTime(now)}
            </div>
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}
        {questsWithDeadlines.map((q) => (
          <div key={q.id} className="absolute top-1/2 -translate-y-1/2 -ml-2.5 z-20 group cursor-pointer" style={{ left: `${q.percent}%` }}>
            <div className="w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-125" style={{ backgroundColor: RARITY_COLORS[q.rarity] }} />
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap shadow-lg z-30">
              <div className="font-bold">{q.title}</div>
              <div className="text-gray-300">{q.timeStr} • {q.rank} • {q.rarity}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">События дня</h3>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">Нет событий на этот день</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-800 px-3 py-1.5 rounded text-sm shadow-sm">
                <span>★</span>
                <span className="font-medium">{ev.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
