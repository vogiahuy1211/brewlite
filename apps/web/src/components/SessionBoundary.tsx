'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { safeReturnPath, useSession, verifySession } from '@/services/session';

export default function SessionBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, identity, logoutError } = useSession();
  const protectedPage = pathname === '/checkout' || pathname === '/orders' || pathname.startsWith('/orders/');

  useEffect(() => { void verifySession(); }, [identity.id]);
  useEffect(() => {
    if (protectedPage && status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(safeReturnPath(pathname))}`);
    }
  }, [pathname, protectedPage, router, status]);

  if (!protectedPage) return children;
  if (status === 'unavailable') return (
    <div role="alert" className="p-8 text-center">
      <p>{logoutError ?? 'Chưa thể xác minh phiên đăng nhập. Vui lòng kiểm tra kết nối.'}</p>
      {!logoutError && <button className="mt-4 underline" onClick={() => void verifySession(true)}>Thử xác minh lại</button>}
    </div>
  );
  if (status !== 'authenticated') return <p role="status" className="p-8 text-center">Đang xác minh phiên đăng nhập…</p>;
  return <div key={identity.id}>{children}</div>;
}
