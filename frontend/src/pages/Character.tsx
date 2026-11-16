import { useState } from 'react';
import { useCharacter, useUpdateCharacter } from '../api/character';
import type { InventoryItem } from '../api/character';
import { CharacterSkeleton } from '../components/Skeletons';
import { SkillStats } from '../components/SkillStats';
import { HexStatsChart } from '../components/HexStatsChart';
import { Achievements } from '../components/Achievements';
import { Equipment } from '../components/Equipment';
import { Inventory } from '../components/Inventory';
import { DailyRewardModal } from '../components/DailyRewardModal';
import { QuestStats } from '../components/QuestStats';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import { EmblemModal } from '../components/EmblemModal';
import { NicknameModal } from '../components/NicknameModal';
import { TitlesModal } from '../components/TitlesModal';
import { AdventurerLicense } from '../components/AdventurerLicense';
import { useAchievements } from '../api/achievements';

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
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);

  const pinnedAchievements = allAchievements
    .filter((a) => data?.user.pinned_achievements?.includes(a.id))
    .slice(0, 5);

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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <DailyRewardModal forceOpen={isDailyRewardOpen} onClose={() => setIsDailyRewardOpen(false)} />
      {isAvatarModalOpen && <AvatarUploadModal onClose={() => setIsAvatarModalOpen(false)} />}
      {isEmblemModalOpen && <EmblemModal currentSeed={user.emblem_seed} onClose={() => setIsEmblemModalOpen(false)} />}
      {isNicknameModalOpen && <NicknameModal currentNickname={user.nickname} onClose={() => setIsNicknameModalOpen(false)} />}
      {isTitlesModalOpen && <TitlesModal currentLevel={level} onClose={() => setIsTitlesModalOpen(false)} />}

      <h1 className="text-3xl md:text-4xl font-bold text-parchment-light drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-2">
        Карточка персонажа
      </h1>

      {/* ВЕРХНИЙ РЯД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HexStatsChart />
        </div>
        <div className="lg:col-span-2">
          <AdventurerLicense
            user={user}
            level={level}
            xp_into_level={xp_into_level}
            xp_for_next_level={xp_for_next_level}
            xp_bonus_percent={xp_bonus_percent}
            pinnedAchievements={pinnedAchievements}
            onOpenAvatar={() => setIsAvatarModalOpen(true)}
            onOpenEmblem={() => setIsEmblemModalOpen(true)}
            onOpenNickname={() => setIsNicknameModalOpen(true)}
            onOpenTitles={() => setIsTitlesModalOpen(true)}
            onOpenDailyReward={() => setIsDailyRewardOpen(true)}
            isUpdating={isUpdating}
          />
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
