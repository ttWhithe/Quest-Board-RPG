const shimmer = 'animate-pulse bg-gray-200 rounded';

export function QuestCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
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

export function CharacterSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col md:flex-row gap-10">
      <div className="flex flex-col items-center gap-4 shrink-0">
        <div className={`${shimmer} h-40 w-40 rounded-full`} />
        <div className={`${shimmer} h-6 w-32`} />
        <div className={`${shimmer} h-4 w-20`} />
      </div>
      <div className="flex-1 w-full space-y-8">
        <div className={`${shimmer} h-20 w-full`} />
        <div className="grid grid-cols-2 gap-4">
          <div className={`${shimmer} h-20`} />
          <div className={`${shimmer} h-20`} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`${shimmer} h-12 w-12`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-3">
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
      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`${shimmer} h-8 w-8`} />
          <div className={`${shimmer} h-7 w-48`} />
          <div className={`${shimmer} h-8 w-8`} />
        </div>
        <div className={`${shimmer} h-9 w-24`} />
      </div>
      <div className={`${shimmer} h-32 w-full`} />
    </div>
  );
}

export function ModuleSkeleton() {
  return (
    <div className="parchment-card p-6 h-64 animate-pulse flex flex-col">
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

export function HexSkeleton() {
  return (
    <div className="parchment-card p-6 h-[340px] animate-pulse flex flex-col items-center">
      <div className={`${shimmer} h-6 w-1/2 mb-4 self-start`} />
      <div className={`${shimmer} h-48 w-48 rounded-full mt-4`} />
    </div>
  );
}
