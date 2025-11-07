export default function PredictionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse border border-white/10 p-4 rounded-xl bg-white/5">
          <div className="h-3 w-40 bg-white/10 rounded mb-3" />
          <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
          <div className="h-4 w-2/3 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}
