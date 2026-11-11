import { useAuth } from '../contexts/AuthContext';
import { useCharacter, useUpdateCharacter } from '../api/character';
import { Emblem } from '../components/Emblem';
import { XPBar } from '../components/XPBar';
import { RANK_COLORS } from '../constants';
import type { CharacterRank } from '../api/character';
import { CharacterSkeleton } from '../components/Skeletons';
import { SkillStats } from '../components/SkillStats';
import { HexStatsChart } from '../components/HexStatsChart';
import { Achievements } from '../components/Achievements';
import { Equipment } from '../components/Equipment';
import { Inventory } from '../components/Inventory';

export function Character() {
  const { updateUser } = useAuth();
  const { data, isLoading, isError } = useCharacter();
  const { mutate: updateCharacter, isPending: isUpdating } = useUpdateCharacter();

  const handleNicknameChange = () => {
    if (!data) return;
    const newName = prompt('Введите новый ник:', data.user.nickname);

    if (newName && newName !== data.user.nickname) {
      updateCharacter({ nickname: newName }, {
        onSuccess: (res) => updateUser(res.user),
        onError: (err: any) => alert(err.response?.data?.detail || 'Ошибка при смене ника')
      });
    }
  };

  const handleEmblemChange = () => {
    if (!data) return;
    const newSeed = Math.random().toString(36).substring(2, 10);
    updateCharacter({ emblem_seed: newSeed }, {
      onSuccess: (res) => updateUser(res.user),
      onError: () => alert('Ошибка при смене герба'),
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Карточка персонажа</h1>
        <CharacterSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-center py-20 text-red-500">Ошибка загрузки персонажа.</div>;
  }

  const { user, level, xp_into_level, xp_for_next_level, stats, xp_bonus_percent } = data;
  const ranks: CharacterRank[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold text-parchment-light drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-2">
        Карточка персонажа
      </h1>

      {/* ВЕРХНИЙ РЯД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HexStatsChart />
        </div>
        <div className="lg:col-span-2 parchment-card p-4 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="relative group cursor-pointer" onClick={handleEmblemChange}>
              <Emblem seed={user.emblem_seed} size={140} />
              <div className="absolute inset-0 bg-black bg-opacity-60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center font-bold text-sm">
                {isUpdating ? '...' : 'Сменить'}
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">{user.nickname}</h2>
              <p className="text-amber-600 font-semibold text-lg">Уровень {level}</p>
              <button onClick={handleNicknameChange} disabled={isUpdating} className="text-sm text-blue-500 hover:underline mt-1 disabled:opacity-50">
                Изменить ник
              </button>
            </div>
          </div>
          <div className="flex-1 w-full space-y-6">
            <div className="bg-parchment-dark p-4 border-2 border-tavern-wood">
              <XPBar current={xp_into_level} max={xp_for_next_level} />
              {xp_bonus_percent > 0 && (
                <p className="text-sm text-green-700 mt-2 font-semibold text-center">
                  Бонус к опыту: +{xp_bonus_percent}%
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-center">
                <p className="text-xs text-green-700 font-medium">Выполнено</p>
                <p className="text-2xl font-bold text-green-800">{stats.completed_total}</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-center">
                <p className="text-xs text-red-700 font-medium">Провалено</p>
                <p className="text-2xl font-bold text-red-800">{stats.failed_total}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">По рангам</h3>
              <div className="flex gap-2 flex-wrap">
                {ranks.map(rank => (
                  <div key={rank} className="flex flex-col items-center justify-center w-10 h-10 rounded-lg text-white font-bold shadow-sm text-sm" style={{ backgroundColor: RANK_COLORS[rank] }}>
                    <span className="text-[10px] opacity-80">{rank}</span>
                    <span>{stats.by_rank[rank]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* НИЖНИЙ РЯД: 2 КОЛОНКИ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Левая колонка: Статы + Достижения */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <SkillStats />
          <Achievements />
        </div>

        {/* Правая колонка: Объединенный блок (Экипировка + Инвентарь) */}
        <div className="lg:col-span-2 parchment-card p-4 flex flex-col xl:flex-row gap-4 items-stretch">

          <div className="w-full xl:w-1/2 flex flex-col">
            <Equipment noCard={true} />
          </div>

          {/* Вертикальный разделитель */}
          <div className="hidden xl:block w-px bg-[#5c4033]/30 self-stretch my-2"></div>

          <div className="w-full xl:w-1/2 flex flex-col">
            <Inventory noCard={true} />
          </div>

        </div>

      </div>
    </div>
  );
}
