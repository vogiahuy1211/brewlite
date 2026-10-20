'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, User } from 'lucide-react';
import { logout, useSession, verifySession } from '@/services/session';

const itemClass = 'flex min-h-11 w-full items-center rounded-xl px-3 py-2 text-left text-sm text-orange-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-300';

export default function AccountMenu() {
  const { status, user, identity, logoutError } = useSession();
  // Đổi phiên hoặc trạng thái sẽ đóng bảng chọn và bỏ dữ liệu trình bày cũ.
  return <AccountDropdown key={`${identity.id}:${status}`} status={status} email={status === 'authenticated' ? user?.email : undefined} logoutError={logoutError} />;
}

function AccountDropdown({ status, email, logoutError }: {
  status: ReturnType<typeof useSession.getState>['status'];
  email?: string;
  logoutError: string | null;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={container} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} type="button" aria-label="Tài khoản" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm text-orange-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-300 sm:px-3">
        <User size={18} aria-hidden="true" />
        <span className="max-w-36 truncate">{status === 'authenticated' && email ? email : 'Tài khoản'}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {logoutError && <p role="alert" className="absolute left-0 top-full z-10 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-red-300/30 bg-[#38201c] p-3 text-sm text-red-100 sm:left-auto sm:right-0">{logoutError}</p>}
      {open && (
        <div id={panelId} aria-label="Lựa chọn tài khoản" className="absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-orange-200/20 bg-[#2d1d16] p-2 shadow-xl sm:left-auto sm:right-0">
          {status === 'checking' && <p role="status" className="p-3 text-sm text-orange-100/80">Đang xác minh tài khoản…</p>}
          {status === 'anonymous' && <>
            <Link href="/login" className={itemClass} onClick={() => setOpen(false)}>Đăng nhập</Link>
            <Link href="/login?mode=register" className={itemClass} onClick={() => setOpen(false)}>Đăng ký</Link>
          </>}
          {status === 'authenticated' && <>
            <p className="break-all border-b border-orange-100/10 px-3 py-3 text-sm text-orange-200">{email}</p>
            <Link href="/orders" className={itemClass} onClick={() => setOpen(false)}>Lịch sử đơn hàng</Link>
            <button type="button" className={itemClass} onClick={() => { logout(); }}>Đăng xuất</button>
          </>}
          {status === 'unavailable' && <>
            <p className="p-3 text-sm text-orange-100/80">{logoutError ?? 'Chưa thể xác minh tài khoản. Vui lòng kiểm tra kết nối.'}</p>
            {!logoutError && <button type="button" className={itemClass} onClick={() => void verifySession(true)}>Thử xác minh lại</button>}
          </>}
        </div>
      )}
    </div>
  );
}
