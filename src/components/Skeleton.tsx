export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-surface-container-highest rounded-xl animate-shimmer ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-container-highest rounded-xl p-6 space-y-4 animate-fadeSlideUp">
      <div className="h-3 w-24 bg-surface-dim rounded animate-shimmer" />
      <div className="h-8 w-32 bg-surface-dim rounded animate-shimmer" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <div className="w-10 h-10 rounded-lg bg-surface-dim animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-surface-dim rounded animate-shimmer" />
        <div className="h-3 w-28 bg-surface-dim/60 rounded animate-shimmer" />
      </div>
      <div className="h-8 w-20 bg-surface-dim rounded-xl animate-shimmer" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-surface-dim rounded animate-shimmer" />
        <div className="h-8 w-56 bg-surface-dim rounded animate-shimmer" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
      <div className="bg-surface-container-highest rounded-xl overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
