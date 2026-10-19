import { ProductSkeletonGrid } from "@/components/ProductSkeleton";

// Next.js tự động hiển thị file này khi page đang load (Streaming SSR)
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <div className="flex flex-col gap-1">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
        <ProductSkeletonGrid />
      </div>
    </div>
  );
}
