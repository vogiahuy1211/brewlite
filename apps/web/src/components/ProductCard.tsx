import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(product.price);

  const isOutOfStock = product.stock === 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 transition-all duration-200 active:scale-95 ${
        isOutOfStock ? "opacity-60 pointer-events-none" : "hover:shadow-md"
      }`}
    >
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            ☕
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-base font-bold text-amber-600">{formattedPrice}</p>
      </div>

      {/* Add button overlay */}
      {!isOutOfStock && (
        <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          +
        </div>
      )}
    </Link>
  );
}
