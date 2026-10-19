export default function ProductSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-square bg-gray-200" />
      {/* Text placeholders */}
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

export function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
