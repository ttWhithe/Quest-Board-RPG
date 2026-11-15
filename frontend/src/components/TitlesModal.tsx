import { LEVEL_TITLES, getLevelTitle } from '../constants';

interface Props {
  currentLevel: number;
  onClose: () => void;
}

export function TitlesModal({ currentLevel, onClose }: Props) {
  const currentTitle = getLevelTitle(currentLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-xl font-bold font-fantasy text-[#3b2f2f]">Должности гильдии</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {LEVEL_TITLES.map((t, index) => {
            const isCurrent = t.title === currentTitle;
            const isUnlocked = currentLevel >= t.minLevel;
            const nextTitle = LEVEL_TITLES[index + 1];

            return (
              <div
                key={t.title}
                className={`flex justify-between items-center p-3 rounded border-2 transition-all ${
                  isCurrent
                    ? 'border-amber-700 bg-amber-700/20 shadow-md transform scale-[1.02]'
                    : isUnlocked
                    ? 'border-[#5c4033]/30 bg-[#e8dac1]/50'
                    : 'border-[#5c4033]/10 bg-transparent opacity-60 grayscale'
                }`}
              >
                <div>
                  <span className={`font-bold ${isCurrent ? 'text-amber-900 text-lg' : 'text-[#3b2f2f]'}`}>
                    {t.title}
                  </span>
                  {isCurrent && <span className="ml-2 text-xs font-bold text-amber-700 uppercase">(Текущая)</span>}
                </div>
                <div className="text-sm font-bold text-[#5c4033]">
                  Ур. {t.minLevel}
                  {nextTitle && <span className="text-xs font-normal text-[#5c4033]/60"> (до {nextTitle.minLevel - 1})</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t-2 border-[#5c4033] bg-[#e8dac1] text-center">
          <button onClick={onClose} className="w-full px-4 py-2 bg-amber-700 text-white font-bold rounded shadow hover:bg-amber-800 transition-colors">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
