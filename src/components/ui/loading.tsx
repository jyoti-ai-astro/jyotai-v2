// src/components/ui/loading.tsx

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 border-opacity-50"></div>
    </div>
  );
}
