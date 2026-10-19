export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export type ItemSize = 'S' | 'M' | 'L';

export interface CartItem {
  id: string; // unique ID in cart: `${productId}-${size}-${sortedToppingIds}`
  productId: string;
  name: string;
  price: number; // base unit price with size and toppings
  imageUrl: string | null;
  size: ItemSize;
  toppings: Topping[];
  qty: number;
}

export interface User {
  id: string;
  email: string;
  loyalty_points: number;
}
