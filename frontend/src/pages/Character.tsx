import { useAuth } from '../contexts/AuthContext';
import { useCharacter, useUpdateCharacter } from '../api/character';
import { Emblem } from '../components/Emblem';
import { XPBar } from '../components/XPBar';
import { RANK_COLORS } from '../constants';
import type { CharacterRank } from '../api/character';
import { CharacterSkeleton } from '../components/Skeletons';

export function Character() {
  const { updateUser } = useAuth();
  const { data, isLoading, isError } = useCharacter();
  const { mutate: updateCharacter, isPending: isUpdating } = useUpdateCharacter();

  const handleNicknameChange = () => {
    if (!data) return;
    const newName = prompt('Введите новый ник:', data.user.nickname);

    if (newName && newName !== data.user.nickname) {
      updateCharacter({ nickname: newName }, {
        onSuccess: (res) => {
          // Обновляем контекст, чтобы хедер сразу показал новый ник
          updateUser(res.user);
        },
        onError: (err: any) => {
          const detail = err.response?.data?.detail || 'Ошибка при смене ника';
          alert(detail);
        }
      });
    }
  };

  const handleEmblemChange = () => {
    if (!data) return;
    // Генерируем случайный seed для нового герба
    const newSeed = Math.random().toString(36).substring(2, 10);
    updateCharacter({ emblem_seed: newSeed }, {
      onSuccess: (res) => {
        updateUser(res.user);
      },
      onError: () => alert('Ошибка при смене герба'),
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Карточка персонажа</h1>
        <CharacterSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-center py-20 text-red-500">Ошибка загрузки персонажа.</div>;
  }

  const { user, level, xp_into_level, xp_for_next_level, stats } = data;
  const ranks: CharacterRank[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Карточка персонажа</h1>

      <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col md:flex-row gap-10 items-center md:items-start">

        {/* Левая колонка: Герб и профиль */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="relative group cursor-pointer" onClick={handleEmblemChange}>
            <Emblem seed={user.emblem_seed} size={160} />
            <div className="absolute inset-0 bg-black bg-opacity-60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center font-bold text-sm">
              {isUpdating ? '...' : 'Сменить'}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">{user.nickname}</h2>
            <p className="text-amber-600 font-semibold text-lg">Уровень {level}</p>
            <button
              onClick={handleNicknameChange}
              disabled={isUpdating}
              className="text-sm text-blue-500 hover:underline mt-1 disabled:opacity-50"
            >
              Изменить ник
            </button>
          </div>
        </div>

        {/* Правая колонка: XP и статистика */}
        <div className="flex-1 w-full space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <XPBar current={xp_into_level} max={xp_for_next_level} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-center">
              <p className="text-sm text-green-700 font-medium">Выполнено</p>
              <p className="text-3xl font-bold text-green-800">{stats.completed_total}</p>
            </div>
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
              <p className="text-sm text-red-700 font-medium">Провалено</p>
              <p className="text-3xl font-bold text-red-800">{stats.failed_total}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Выполнено по рангам
            </h3>
            <div className="flex gap-2 flex-wrap">
              {ranks.map(rank => (
                <div
                  key={rank}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-lg text-white font-bold shadow-sm"
                  style={{ backgroundColor: RANK_COLORS[rank] }}
                >
                  <span className="text-xs opacity-80">{rank}</span>
                  <span>{stats.by_rank[rank]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
