import { useState } from 'react';
import { useUpdateCharacter } from '../api/character';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RARITY_COLORS } from '../constants';
import { Emblem } from './Emblem';

interface Props {
  currentSeed: string;
  onClose: () => void;
}

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#eab308', '#64748b', '#ffffff'];
const SYMBOLS = ['dragon-head', 'griffin-symbol', 'viking-shield', 'mounted-knight', 'gladius', 'thor-hammer', 'fleur-de-lys', 'heraldic-sun', 'crossed-sabres', 'wyvern', 'rosa-shield', 'sverd-i-fjell'];
const SHAPES = [
  { id: 'shield', label: 'Щит' },
  { id: 'circle', label: 'Круг' },
  { id: 'diamond', label: 'Ромб' },
  { id: 'pointed', label: 'Острый' },
];

export function EmblemModal({ currentSeed, onClose }: Props) {
  const { updateUser } = useAuth();
  const { mutate: updateCharacter, isPending } = useUpdateCharacter();
  const { addToast } = useToast();

  // Пытаемся загрузить текущие настройки или ставим дефолтные
  let initialData = { borderColor: COLORS[0], iconColor: COLORS[1], shape: 'shield', symbol: 'dragon-head' };
  try {
    const parsed = JSON.parse(currentSeed);
    if (parsed && parsed.symbol) initialData = { ...initialData, ...parsed };
  } catch {
    // Игнорируем ошибку парсинга, используем дефолтные значения
  }

  const [borderColor, setBorderColor] = useState(initialData.borderColor);
  const [iconColor, setIconColor] = useState(initialData.iconColor);
  const [shape, setShape] = useState(initialData.shape);
  const [symbol, setSymbol] = useState(initialData.symbol);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentJson = JSON.stringify({ borderColor, iconColor, shape, symbol });

  const handleSave = () => {
    setErrorMsg(null);
    updateCharacter({ emblem_seed: currentJson }, {
      onSuccess: (res) => {
        updateUser(res.user);

        // Показываем тосты
        res.new_achievements?.forEach((ach) => {
          addToast({
            title: ach.name,
            description: ach.description,
            icon: ach.icon,
            color: RARITY_COLORS[ach.rarity] || '#f59e0b',
          });
        });

        onClose();
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.detail?.detail || 'Ошибка при сохранении герба');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#f4ebd8] border-4 border-[#5c4033] rounded-lg shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b-2 border-[#5c4033] bg-[#e8dac1]">
          <h2 className="text-xl font-bold font-fantasy text-[#3b2f2f]">Настройка герба</h2>
          <button onClick={onClose} className="text-2xl text-[#5c4033] hover:text-red-700 font-bold">✕</button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          {/* Превью герба */}
          <div className="relative">
            <Emblem seed={currentJson} size={140} />
          </div>

          {/* Выбор формы */}
          <div className="w-full">
            <p className="text-sm font-bold text-[#5c4033] mb-2">Форма:</p>
            <div className="flex gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShape(s.id)}
                  className={`px-4 py-1 rounded border-2 transition-all ${shape === s.id ? 'border-amber-700 bg-amber-700 text-white' : 'border-[#5c4033] text-[#5c4033] hover:bg-[#e8dac1]'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Выбор цвета рамки */}
          <div className="w-full">
            <p className="text-sm font-bold text-[#5c4033] mb-2">Цвет рамки:</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={`border-${c}`}
                  onClick={() => setBorderColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${borderColor === c ? 'border-black scale-110 shadow-md' : 'border-gray-400/50'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Выбор цвета иконки */}
          <div className="w-full">
            <p className="text-sm font-bold text-[#5c4033] mb-2">Цвет символа:</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={`icon-${c}`}
                  onClick={() => setIconColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${iconColor === c ? 'border-black scale-110 shadow-md' : 'border-gray-400/50'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Выбор символа */}
          <div className="w-full">
            <p className="text-sm font-bold text-[#5c4033] mb-2">Символ гильдии:</p>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border-2 border-[#5c4033]/40 rounded-md bg-[#e8dac1]/30 shadow-inner">
              {SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  className={`p-1.5 rounded border-2 flex items-center justify-center aspect-square transition-all ${
                    symbol === sym
                      ? 'border-amber-700 bg-amber-700 shadow-md scale-105'
                      : 'border-[#5c4033]/30 hover:border-[#5c4033] hover:bg-[#e8dac1]'
                  }`}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      WebkitMaskImage: `url(/icons/${sym}.svg)`,
                      maskImage: `url(/icons/${sym}.svg)`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      backgroundColor: symbol === sym ? '#fff' : '#5c4033',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Плашка с ошибкой */}
        {errorMsg && (
          <div className="mx-6 mb-2 p-2 bg-red-100 border border-red-400 text-red-700 text-sm font-bold rounded text-center">
            {errorMsg}
          </div>
        )}

        <div className="p-4 border-t-2 border-[#5c4033] flex justify-end gap-2 bg-[#e8dac1]">
          <button onClick={onClose} className="px-4 py-2 font-bold text-[#5c4033] hover:text-black">Отмена</button>
          <button onClick={handleSave} disabled={isPending} className="px-6 py-2 bg-amber-700 text-white font-bold rounded shadow hover:bg-amber-800 disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
