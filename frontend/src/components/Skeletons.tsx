const shimmer = 'animate-pulse bg-black/10 rounded';

export function QuestCardSkeleton() {
  return (
    <div className="parchment-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`${shimmer} h-6 w-8`} />
        <div className={`${shimmer} h-4 w-20`} />
      </div>
      <div className={`${shimmer} h-5 w-3/4`} />
      <div className={`${shimmer} h-4 w-full`} />
      <div className="flex gap-2 pt-2">
        <div className={`${shimmer} h-8 flex-1`} />
        <div className={`${shimmer} h-8 w-8`} />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="parchment-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className={`${shimmer} h-8 w-8 rounded-full`} />
        <div className={`${shimmer} h-5 w-16`} />
      </div>
      <div className={`${shimmer} h-5 w-3/4`} />
      <div className={`${shimmer} h-4 w-32`} />
      <div className="flex gap-2 border-t pt-3">
        <div className={`${shimmer} h-6 flex-1`} />
        <div className={`${shimmer} h-6 flex-1`} />
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="parchment-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`${shimmer} h-8 w-8`} />
          <div className={`${shimmer} h-7 w-48`} />
          <div className={`${shimmer} h-8 w-8`} />
        </div>
        <div className={`${shimmer} h-9 w-24`} />
      </div>
      <div className={`${shimmer} h-64 w-full`} />
    </div>
  );
}

export function ModuleSkeleton() {
  return (
    <div className="parchment-card p-6 h-64 flex flex-col">
      <div className={`${shimmer} h-6 w-1/2 mb-4`} />
      <div className="flex-1 space-y-3">
        <div className={`${shimmer} h-4 w-full`} />
        <div className={`${shimmer} h-4 w-5/6`} />
        <div className={`${shimmer} h-4 w-4/6`} />
        <div className={`${shimmer} h-4 w-full`} />
      </div>
    </div>
  );
}

// Скелетон для всей страницы персонажа
export function CharacterSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className={`${shimmer} h-10 w-64 mb-2`} />

      {/* ВЕРХНИЙ РЯД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 parchment-card p-6 h-[340px] flex flex-col items-center">
          <div className={`${shimmer} h-6 w-1/2 mb-4 self-start`} />
          <div className={`${shimmer} h-48 w-48 rounded-full mt-4`} />
        </div>

        <div className="lg:col-span-2 parchment-card p-4 md:p-8 flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className={`${shimmer} h-36 w-36 rounded-full`} />
            <div className={`${shimmer} h-6 w-32`} />
            <div className={`${shimmer} h-4 w-20`} />
          </div>
          <div className="flex-1 w-full space-y-6">
            <div className={`${shimmer} h-16 w-full`} />
            <div className="grid grid-cols-2 gap-4">
              <div className={`${shimmer} h-16`} />
              <div className={`${shimmer} h-16`} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`${shimmer} h-10 w-10`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* НИЖНИЙ РЯД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <div className={`${shimmer} h-[340px] w-full`} />
          <div className={`${shimmer} h-48 w-full`} />
        </div>
        <div className="lg:col-span-2 parchment-card p-4 flex flex-col xl:flex-row gap-4 h-[550px]">
          <div className="w-full xl:w-1/2 flex flex-col">
             <div className={`${shimmer} h-6 w-1/3 mb-4`} />
             <div className={`${shimmer} flex-1 w-full`} />
          </div>
          <div className="hidden xl:block w-px bg-black/10 self-stretch my-2" />
          <div className="w-full xl:w-1/2 flex flex-col">
             <div className={`${shimmer} h-6 w-1/3 mb-4`} />
             <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`${shimmer} aspect-square`} />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Скелетон для Дерева Талантов
export function TalentsSkeleton() {
  return (
    <div className="absolute inset-0 bg-[#1a1512] flex flex-col items-center justify-center z-50">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-t-2 border-amber-600 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        <div className="absolute inset-2 border-b-2 border-emerald-500 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
        <div className="absolute inset-0 flex items-center justify-center text-amber-600 text-2xl">★</div>
      </div>
      <p className="text-amber-600 font-fantasy tracking-[0.2em] animate-pulse uppercase">
        Плетение созвездий...
      </p>
    </div>
  );
}

export function HexSkeleton() {
  return (
    <div className="parchment-card p-6 h-[340px] flex flex-col items-center">
      <div className={`${shimmer} h-6 w-1/2 mb-4 self-start`} />
      <div className={`${shimmer} h-48 w-48 rounded-full mt-4`} />
    </div>
  );
}
