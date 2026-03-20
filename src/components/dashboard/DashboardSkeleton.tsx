export function DashboardSkeleton() {
  return (
    <div
      data-testid="dashboard-skeleton"
      className="p-6 space-y-8 animate-pulse"
    >
      {/* Profile skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* Section title skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-muted rounded" />
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Products skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Partners skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
