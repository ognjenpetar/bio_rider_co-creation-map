export function CommentSkeleton() {
  return (
    <div className="bg-gray-50 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-3.5 w-20 bg-gray-200 rounded-full" />
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded-sm" />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-gray-200 rounded-full" />
        <div className="h-3 w-3/4 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

export function CommentSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}
