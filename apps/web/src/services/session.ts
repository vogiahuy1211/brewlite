import axios, { CanceledError } from 'axios';
import { create } from 'zustand';
import type { User } from '@/types/product';

export type SessionIdentity = Readonly<{ id: string; token: string | null }>;
type SessionState = {
  identity: SessionIdentity;
  user: User | null;
  status: 'checking' | 'authenticated' | 'anonymous' | 'unavailable';
  revalidating: boolean;
  logoutError: string | null;
};

export const useSession = create<SessionState>(() => ({
  identity: { id: '', token: null }, user: null, status: 'checking', revalidating: false, logoutError: null,
}));

const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api`;
const verifier = axios.create({ baseURL, timeout: 10000 });
let storageFailed = false;
let pending: { id: string; promise: Promise<void> } | undefined;
const same = (a: SessionIdentity, b: SessionIdentity) => a.id === b.id && a.token === b.token;

// Dữ liệu lưu trữ cung cấp thông tin đăng nhập, không chứng minh đã xác thực.
// Dữ liệu cũ của main được cấp ID phiên; mỗi lần đăng nhập/đăng xuất sau đó tạo ID mới.
export function captureSession(): SessionIdentity {
  if (typeof window === 'undefined' || storageFailed) return useSession.getState().identity;
  try {
    const token = localStorage.getItem('brewlite_token');
    let id = localStorage.getItem('brewlite_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('brewlite_session_id', id);
    }
    const identity = { id, token };
    if (!same(identity, useSession.getState().identity)) {
      useSession.setState({ identity, user: null, status: token ? 'checking' : 'anonymous', revalidating: false });
    }
  } catch {
    storageFailed = true;
    useSession.setState({ identity: { id: crypto.randomUUID(), token: null }, user: null, status: 'unavailable' });
  }
  return useSession.getState().identity;
}

export function isSessionCurrent(identity: SessionIdentity) {
  return same(captureSession(), identity);
}

export function assertSession(identity: SessionIdentity) {
  if (!isSessionCurrent(identity)) {
    const error = new CanceledError('Phiên đăng nhập đã thay đổi. Vui lòng kiểm tra trạng thái đơn.');
    error.code = 'ERR_AUTH_SESSION_CHANGED';
    throw error;
  }
}

function replaceSession(token: string | null) {
  const identity = { id: crypto.randomUUID(), token };
  try {
    localStorage.setItem('brewlite_session_id', identity.id);
    localStorage.removeItem('brewlite_user');
    if (token) localStorage.setItem('brewlite_token', token);
    else localStorage.removeItem('brewlite_token');
    storageFailed = false;
    useSession.setState({ identity, user: null, status: token ? 'checking' : 'anonymous', revalidating: false, logoutError: null });
  } catch {
    storageFailed = true;
    useSession.setState({ identity: { ...identity, token: null }, user: null, status: 'unavailable' });
  }
  return useSession.getState().identity;
}

export function logout() {
  const identity = { id: crypto.randomUUID(), token: null };
  let credentialsRemoved = false;
  let metadataFailed = false;
  // Luôn thử xóa token; lỗi dọn dữ liệu phụ không được bỏ qua bước này.
  try { localStorage.removeItem('brewlite_token'); } catch { /* Đọc lại để xác minh bên dưới. */ }
  try { credentialsRemoved = localStorage.getItem('brewlite_token') === null; } catch { /* Chưa xác minh được việc xóa token. */ }
  try { localStorage.removeItem('brewlite_user'); } catch { metadataFailed = true; }
  try { localStorage.setItem('brewlite_session_id', identity.id); } catch { metadataFailed = true; }
  const error = credentialsRemoved ? null
    : 'Đăng xuất chưa hoàn tất: chưa xác nhận được việc xóa thông tin đăng nhập khỏi trình duyệt. Tải lại trang có thể khôi phục phiên cũ.';
  // Chặn sử dụng credential còn sót; không tự đọc lại thành phiên đã xác thực.
  storageFailed = !credentialsRemoved || metadataFailed;
  useSession.setState({
    identity, user: null, status: credentialsRemoved ? 'anonymous' : 'unavailable',
    revalidating: false, logoutError: error,
  });
  return { success: credentialsRemoved, error };
}

export function invalidateSession(identity: SessionIdentity) {
  if (isSessionCurrent(identity)) logout();
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string' && !!user.id && typeof user.email === 'string'
    && typeof user.loyalty_points === 'number' && Number.isFinite(user.loyalty_points);
}

export function verifySession(force = false): Promise<void> {
  const identity = captureSession();
  const state = useSession.getState();
  if (storageFailed || !identity.token) return Promise.resolve();
  if (pending?.id === identity.id) return pending.promise;
  if (!force && state.status === 'authenticated') return Promise.resolve();
  const background = state.status === 'authenticated';
  useSession.setState({ status: background ? 'authenticated' : 'checking', revalidating: background });
  const task = (async () => {
    try {
      const { data } = await verifier.get<unknown>('/auth/me', {
        headers: { Authorization: `Bearer ${identity.token}` },
      });
      if (!isSessionCurrent(identity)) return;
      if (!isUser(data)) throw new Error('Phản hồi xác minh tài khoản không hợp lệ.');
      useSession.setState({ user: data, status: 'authenticated' });
    } catch (error) {
      if (!isSessionCurrent(identity)) return;
      if (axios.isAxiosError(error) && error.response?.status === 401) invalidateSession(identity);
      else useSession.setState({ status: background ? 'authenticated' : 'unavailable' });
    } finally {
      if (isSessionCurrent(identity)) useSession.setState({ revalidating: false });
    }
  })();
  const promise = task.finally(() => {
    if (pending?.promise === promise) pending = undefined;
  });
  pending = { id: identity.id, promise };
  return promise;
}

export async function acceptLogin(response: unknown, origin: SessionIdentity) {
  assertSession(origin);
  if (!response || typeof response !== 'object'
    || !('access_token' in response) || typeof response.access_token !== 'string' || !response.access_token) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }
  const identity = replaceSession(response.access_token);
  await verifySession();
  assertSession(identity);
  if (useSession.getState().status !== 'authenticated') {
    throw new Error('Chưa xác minh được phiên đăng nhập. Vui lòng thử xác minh lại.');
  }
}

export function safeReturnPath(value: string | null) {
  return value === '/checkout' || value === '/orders' || value === '/cart'
    || /^\/orders\/[a-f0-9-]{36}$/i.test(value ?? '') ? value! : '/';
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key?.startsWith('brewlite_')) {
      captureSession();
      void verifySession();
    }
  });
}
