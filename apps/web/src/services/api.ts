import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('brewlite_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export async function getProducts() {
  const res = await apiClient.get('/products');
  return res.data;
}

export async function getProduct(id: string) {
  const res = await apiClient.get(`/products/${id}`);
  return res.data;
}

export async function getToppings() {
  const res = await apiClient.get('/toppings');
  return res.data;
}

export async function validatePromotion(code: string) {
  const res = await apiClient.get(`/promotions/validate?code=${encodeURIComponent(code)}`);
  return res.data;
}

export async function register(data: { email: string; password: string }) {
  const res = await apiClient.post('/auth/register', data);
  return res.data;
}

export async function login(data: { email: string; password: string }) {
  const res = await apiClient.post('/auth/login', data);
  return res.data;
}

export async function createOrder(data: {
  items: Array<{ productId: string; size: string; qty: number; toppingIds?: string[] }>;
  promoCode?: string;
}) {
  const res = await apiClient.post('/orders', data);
  return res.data;
}

export async function processPayment(data: {
  orderId: string;
  idempotencyKey: string;
  method: 'WALLET' | 'CARD';
  simulateFailure?: boolean;
}) {
  const res = await apiClient.post('/payments', data);
  return res.data;
}

export async function getMyOrders() {
  const res = await apiClient.get('/orders/me');
  return res.data;
}

export async function getOrder(id: string) {
  const res = await apiClient.get(`/orders/${id}`);
  return res.data;
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await apiClient.patch(`/orders/${id}/status`, { status });
  return res.data;
}
