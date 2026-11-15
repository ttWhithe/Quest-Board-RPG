import { useState } from 'react';
import { useCharacter, useUpdateCharacter } from '../api/character';
import type { InventoryItem } from '../api/character';
import { Emblem } from '../components/Emblem';
import { XPBar } from '../components/XPBar';
import { CharacterSkeleton } from '../components/Skeletons';
import { SkillStats } from '../components/SkillStats';
import { HexStatsChart } from '../components/HexStatsChart';
import { Achievements } from '../components/Achievements';
import { Equipment } from '../components/Equipment';
import { Inventory } from '../components/Inventory';
import { DailyRewardModal } from '../components/DailyRewardModal';
import { QuestStats } from '../components/QuestStats';
import { getLevelTitle } from '../constants';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import { EmblemModal } from '../components/EmblemModal';
import { useAchievements } from '../api/achievements';
import { API_BASE_URL } from '../api/client';
import { NicknameModal } from '../components/NicknameModal';
import { TitlesModal } from '../components/TitlesModal';

export function Character() {
  const { data, isLoading, isError } = useCharacter();
  const { isPending: isUpdating } = useUpdateCharacter();
  const { data: allAchievements = [] } = useAchievements();

  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [filterSlot, setFilterSlot] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEmblemModalOpen, setIsEmblemModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isTitlesModalOpen, setIsTitlesModalOpen] = useState(false);

  // Закрепленные достижения (максимум 5)
  const pinnedAchievements = allAchievements.filter((a) =>
    data?.user.pinned_achievements?.includes(a.id)
  ).slice(0, 5);

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

  const getStreakText = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
    return 'дней';
  };

  const joinDate = new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <DailyRewardModal />
      {isAvatarModalOpen && <AvatarUploadModal onClose={() => setIsAvatarModalOpen(false)} />}
      {isEmblemModalOpen && <EmblemModal currentSeed={user.emblem_seed} onClose={() => setIsEmblemModalOpen(false)} />}
      {isNicknameModalOpen && <NicknameModal currentNickname={user.nickname} onClose={() => setIsNicknameModalOpen(false)} />}
      {isTitlesModalOpen && <TitlesModal currentLevel={level} onClose={() => setIsTitlesModalOpen(false)} />}

      {/* ВЕРХНИЙ РЯД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HexStatsChart />
        </div>

        {/* УДОСТОВЕРЕНИЕ ИСКАТЕЛЯ */}
        <div className="lg:col-span-2 relative border-4 border-[#5c4033] rounded-md shadow-2xl bg-[#f4ebd8] overflow-hidden flex flex-col">
          {/* Водяной знак */}
          <div className="absolute inset-y-0 right-0 pointer-events-none flex items-center justify-end opacity-10 z-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 13.95" className="h-[120%] w-auto fill-[#3b2f2f]">
              <path d="M2.922,12.219c.108.055.181.092.253.13a7.943,7.943,0,0,0,3.891.963,3.753,3.753,0,0,0,.486-7.464,3.6,3.6,0,0,0-1.691.132.938.938,0,0,1-.716-1.732,4.3,4.3,0,0,1,1.481-.366,4.912,4.912,0,0,1,5.048,3.446,4.933,4.933,0,0,1-2.517,5.764c4.218-1.543,4.723-7.809.812-10.017a5.342,5.342,0,0,0-3.437-.829A5.506,5.506,0,0,0,2.883,4.021a6.606,6.606,0,0,0-.417.524.873.873,0,0,1-.927.337.929.929,0,0,1-.781-.638.881.881,0,0,1,.1-.684A6.158,6.158,0,0,1,2.221,1.839,7.091,7.091,0,0,1,6.135.055a6.933,6.933,0,0,1,6.848,3.359c2.683,4.1-.263,9.987-5.094,10.472a6.838,6.838,0,0,1-3.241-.343A3.994,3.994,0,0,1,2.922,12.219ZM8.438,12.1a2.044,2.044,0,0,1-2.35.064,1.5,1.5,0,0,1-.007-2.613.949.949,0,0,1,1.433.505c.77,2.06,2.637.147,1.424-1.246a2.385,2.385,0,0,0-2.17-.95,2.486,2.486,0,1,0,.784,4.891A2.393,2.393,0,0,0,9.073,11.6C8.862,11.766,8.663,11.951,8.438,12.1ZM2.21,9.495a.663.663,0,1,0,.663.663A.663.663,0,0,0,2.21,9.495ZM.958,6.107a.958.958,0,1,0,.957.957A.958.958,0,0,0,.958,6.107Z"/>
            </svg>
          </div>

          <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-stretch relative z-10 w-full flex-1">
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#5c4033]/40 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#5c4033]/40 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#5c4033]/40 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#5c4033]/40 pointer-events-none" />

            {/* ЛЕВАЯ ЧАСТЬ: ФОТО */}
            <div className="relative w-full sm:w-44 shrink-0 flex flex-col">
              <div
                className="w-full h-full min-h-[220px] bg-[#d5c3a5] border-2 border-[#5c4033] rounded shadow-md overflow-hidden relative cursor-pointer group/avatar"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Сменить аватар"
              >
                {user.avatar_url ? (
                  <img
                    // Добавляем ?v=... чтобы сбросить кэш браузера, если картинка обновилась
                    src={`${API_BASE_URL}${user.avatar_url}?v=${Date.now()}`}
                    alt="Аватар"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <img
                    src="/images/character_placeholder.png"
                    alt="Аватар"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                )}
                {/* Оверлей аватара */}
                <div className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center font-bold text-sm">
                  Сменить фото
                </div>
              </div>

              {/* Стикер: Герб (отдельный group/emblem) */}
              <div
                className="absolute -top-6 -left-6 z-20 cursor-pointer group/emblem"
                onClick={() => setIsEmblemModalOpen(true)}
                title="Настроить герб"
              >
                <div className="drop-shadow-2xl">
                  <Emblem seed={user.emblem_seed} guildSymbol={user.guild_symbol} size={96} />
                </div>
                <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover/emblem:opacity-100 transition-opacity rounded-full flex items-center justify-center font-bold text-sm">
                  {isUpdating ? '...' : '✎'}
                </div>
              </div>

              {/* Стикер: Уровень */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-700 text-white rounded-full border-4 border-[#f4ebd8] flex items-center justify-center font-bold text-2xl shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-20">
                {level}
              </div>
            </div>

            {/* ПРАВАЯ ЧАСТЬ: ИНФОРМАЦИЯ */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-3 mb-4">
                <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#5c4033]/20 pb-3 w-full">
                  <div className="relative inline-block pr-3">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#3b2f2f] font-fantasy tracking-wide drop-shadow-sm">
                      {user.nickname}
                    </h2>
                    <button
                      onClick={() => setIsNicknameModalOpen(true)}
                      disabled={isUpdating}
                      className="absolute -top-1 -right-1 text-blue-500 hover:text-blue-700 disabled:opacity-50 text-sm"
                      title="Изменить имя"
                    >
                      ✎
                    </button>
                  </div>

                  <span className="text-4xl text-[#5c4033]/40 font-bold leading-none">•</span>

                  <button
                    onClick={() => setIsTitlesModalOpen(true)}
                    className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-sm uppercase tracking-wider transition-colors cursor-pointer"
                    title="Посмотреть все должности"
                  >
                    {getLevelTitle(level)}
                  </button>

                  {user.login_streak > 0 && (
                    <>
                      <span className="text-4xl text-[#5c4033]/40 font-bold leading-none">•</span>
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-900 border border-orange-300 px-3 py-1 rounded-md text-sm font-bold shadow-sm uppercase tracking-wider">
                        <span className="text-sm leading-none">🔥</span>
                        {user.login_streak} {getStreakText(user.login_streak)}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-sm text-[#5c4033] italic">
                  В гильдии с {joinDate}
                </p>

                {/* Закрепленные достижения */}
                {pinnedAchievements.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {pinnedAchievements.map((ach) => (
                      <div key={ach.id} className="w-8 h-8 rounded-full border border-[#5c4033] bg-[#e8dac1] flex items-center justify-center" title={ach.name}>
                        <img
                          src={`/icons/${ach.icon}.svg`}
                          alt={ach.name}
                          className="w-5 h-5"
                          style={{
                            WebkitMaskImage: `url(/icons/${ach.icon}.svg)`,
                            maskImage: `url(/icons/${ach.icon}.svg)`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                            backgroundColor: '#5c4033',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {xp_bonus_percent > 0 && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    <div className="inline-flex items-center gap-1 bg-green-100 border border-green-300 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                      <span className="text-sm leading-none">✨</span>
                      <span>+{xp_bonus_percent}% к опыту</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto bg-parchment-dark p-3 border-2 border-tavern-wood rounded">
                <XPBar current={xp_into_level} max={xp_for_next_level} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* НИЖНИЙ РЯД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <SkillStats />
          <QuestStats stats={stats} />
          <Achievements />
        </div>

        <div className="lg:col-span-2 parchment-card p-4 flex flex-col xl:flex-row gap-4 items-stretch">
          <div className="w-full xl:w-1/2 flex flex-col">
            <Equipment noCard={true} draggedItem={draggedItem} onSlotClick={setFilterSlot} activeFilter={filterSlot} />
          </div>
          <div className="hidden xl:block w-px bg-[#5c4033]/30 self-stretch my-2"></div>
          <div className="w-full xl:w-1/2 flex flex-col">
            <Inventory noCard={true} onDragStartItem={setDraggedItem} filterSlot={filterSlot} onResetFilter={() => setFilterSlot(null)} />
          </div>
        </div>
      </div>
    </div>
  );
}
