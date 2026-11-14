import { useState } from 'react';
import { motion } from 'framer-motion';
import { RARITY_COLORS } from '../constants';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: string;
}

interface Props {
  achievements: Achievement[];
  onClose: () => void;
}

export function FullAchievementsModal({ achievements, onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-2xl font-bold font-fantasy text-[#3b2f2f]">Книга деяний</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold transition-colors">✕</button>
        </div>

        <div className="flex gap-2 p-3 bg-[#f4ebd8] border-b border-[#5c4033]/30 flex-wrap">
          {[
            { id: 'all', label: 'Все' },
            { id: 'unlocked', label: 'Полученные' },
            { id: 'locked', label: 'В процессе' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-1 text-sm font-bold border rounded transition-colors ${
                filter === f.id ? 'bg-amber-700 text-white border-amber-900' : 'bg-transparent text-[#3b2f2f] border-[#5c4033] hover:bg-[#e8dac1]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((ach) => (
              <motion.div
                key={ach.id}
                whileHover={{ scale: 1.02 }}
                className={`relative p-4 rounded-lg border-2 flex flex-col items-center text-center transition-all bg-[#1a1512]
                  ${ach.unlocked ? 'shadow-md' : 'opacity-50 grayscale'}`}
                style={{ borderColor: ach.unlocked ? RARITY_COLORS[ach.rarity] : '#5c4033' }}
              >
                <div className="text-5xl mb-3 drop-shadow-md">{ach.icon}</div>
                <h3 className="font-bold leading-tight mb-1" style={{ color: ach.unlocked ? RARITY_COLORS[ach.rarity] : '#a8a29e' }}>
                  {ach.name}
                </h3>
                <p className="text-xs text-gray-400 leading-tight mb-3 flex-1">{ach.description}</p>

                {ach.unlocked ? (
                  <span className="mt-auto text-xs font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-800">
                    Получено
                  </span>
                ) : (
                  <span className="mt-auto text-xs font-bold text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700">
                    Закрыто
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-[#5c4033]/60 italic mt-10">Здесь пока пусто...</p>
          )}
        </div>
      </div>
    </div>
  );
}
