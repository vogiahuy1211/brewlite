import { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Không thể tải danh sách sản phẩm (${res.status})`);
  }

  return res.json() as Promise<Product[]>;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Không tìm thấy sản phẩm (${res.status})`);
  }

  return res.json() as Promise<Product>;
}
