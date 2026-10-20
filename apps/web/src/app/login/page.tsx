'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coffee, Lock, Mail } from 'lucide-react';
import { apiErrorMessage, login, register } from '@/services/api';
import { acceptLogin, captureSession, safeReturnPath } from '@/services/session';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = searchParams.get('mode') !== 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    const generation = ++lifetime.current;
    return () => { lifetime.current = generation + 1; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;
    if (!isLogin && (!confirmPassword || confirmPassword !== password)) {
      setConfirmError(!confirmPassword ? 'Vui lòng nhập xác nhận mật khẩu.' : 'Mật khẩu xác nhận chưa khớp. Vui lòng nhập lại.');
      return;
    }
    setConfirmError(null);
    inFlight.current = true;
    const generation = lifetime.current;
    const origin = captureSession();
    setError(null);
    setLoading(true);

    try {
      const res = await (isLogin ? login : register)({ email, password });
      if (lifetime.current !== generation) return;
      await acceptLogin(res, origin);
      if (lifetime.current === generation) {
        router.replace(safeReturnPath(new URLSearchParams(window.location.search).get('next')));
      }
    } catch (err) {
      if (lifetime.current === generation) setError(apiErrorMessage(err, 'Thao tác không thành công'));
    } finally {
      inFlight.current = false;
      if (lifetime.current === generation) setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center bg-[radial-gradient(ellipse_at_8%_12%,#a857243d,transparent_55%),radial-gradient(ellipse_at_95%_85%,#c56c2526,transparent_50%),linear-gradient(135deg,#321c13,#1c1411_60%,#291c15)] px-5 py-8 sm:px-8 sm:py-12">
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Link href="/" className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-orange-100/80 transition-colors hover:text-white sm:mb-12">
          <ArrowLeft size={16} aria-hidden="true" />
          Về menu
        </Link>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <section className="mx-auto w-full max-w-md lg:mx-0" aria-label="BrewLite">
            <div className="mb-6 flex items-center gap-3">
              <div className="border border-orange-200/25 bg-[linear-gradient(145deg,#b65e28,#63321d)] shadow-[0_4px_16px_#160c0733,inset_0_1px_0_#ffe0bc33] flex h-12 w-12 items-center justify-center rounded-2xl text-orange-100">
                <Coffee size={26} aria-hidden="true" />
              </div>
              <span className="font-serif text-3xl font-bold tracking-tight text-orange-50">Brew<span className="text-orange-300">Lite</span></span>
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Coffee & Tea · Một chút thảnh thơi</p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-orange-50 sm:text-5xl lg:text-6xl">
              Một tách quen.<br />
              <span className="text-orange-300">Một ngày mới.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-orange-100/75 sm:text-base">
              Dành một khoảng nhỏ cho điều bạn thích. Chọn đồ uống yêu thích và bắt đầu cùng BrewLite.
            </p>
            <div aria-hidden="true" className="mt-8 hidden items-center gap-4 lg:flex">
              <span className="h-px w-16 bg-orange-300/50" />
              <span className="text-xs uppercase tracking-[0.2em] text-orange-100/60">Chậm một nhịp, thêm cảm hứng</span>
            </div>
          </section>

          <section aria-labelledby="auth-heading" className="rounded-[28px] border border-orange-200/15 bg-[linear-gradient(145deg,#ffffff0e,#ffffff05)] bg-[#291e19] p-6 shadow-[0_24px_70px_#09060455,inset_0_1px_0_#ffe1c014] sm:p-9 mx-auto w-full max-w-md">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              {isLogin ? 'Chào mừng trở lại' : 'Bắt đầu cùng BrewLite'}
            </p>
            <h2 id="auth-heading" className="text-2xl font-bold tracking-tight text-orange-50 sm:text-3xl">
              {isLogin ? 'Đăng nhập BrewLite' : 'Tạo tài khoản mới'}
            </h2>
            <p className="mt-3 mb-7 text-sm leading-6 text-orange-100/70">
              {isLogin ? 'Đăng nhập để tiếp tục chọn đồ uống yêu thích.' : 'Tạo tài khoản để đặt đồ uống.'}
            </p>
          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-300/30 bg-red-950/50 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} aria-busy={loading}>
            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-orange-100">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-200/60">
                  <Mail size={18} aria-hidden="true" />
                </div>
                <input
                  id="auth-email"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="block min-h-[50px] w-full rounded-xl border border-orange-100/20 bg-black/15 py-3 pr-4 pl-11 text-base text-orange-50 caret-orange-300 placeholder:text-[#d6c4b5] [color-scheme:dark] transition-shadow focus:border-orange-300 focus:outline-none focus:ring-3 focus:ring-orange-300/15 motion-reduce:transition-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-2 block text-sm font-medium text-orange-100">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-200/60">
                  <Lock size={18} aria-hidden="true" />
                </div>
                <input
                  id="auth-password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block min-h-[50px] w-full rounded-xl border border-orange-100/20 bg-black/15 py-3 pr-4 pl-11 text-base text-orange-50 caret-orange-300 placeholder:text-[#d6c4b5] [color-scheme:dark] transition-shadow focus:border-orange-300 focus:outline-none focus:ring-3 focus:ring-orange-300/15 motion-reduce:transition-none"
                />
              </div>
            </div>

            {!isLogin && <div>
              <label htmlFor="auth-confirm-password" className="mb-2 block text-sm font-medium text-orange-100">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-4 text-orange-200/60" />
                <input id="auth-confirm-password" type="password" autoComplete="new-password" required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(null); }}
                  onInvalid={() => setConfirmError('Vui lòng nhập xác nhận mật khẩu.')}
                  aria-invalid={!!confirmError} aria-describedby={confirmError ? 'confirm-password-error' : undefined}
                  placeholder="Nhập lại mật khẩu"
                  className="block min-h-[50px] w-full rounded-xl border border-orange-100/20 bg-black/15 py-3 pr-4 pl-11 text-base text-orange-50 placeholder:text-[#d6c4b5] [color-scheme:dark] focus:border-orange-300 focus:outline-none focus:ring-3 focus:ring-orange-300/15"
                />
              </div>
              {confirmError && <p id="confirm-password-error" role="alert" className="mt-2 text-sm text-red-200">{confirmError}</p>}
            </div>}

            <button
              type="submit"
              disabled={loading}
              className="min-h-[50px] w-full cursor-pointer rounded-xl border border-orange-200/40 bg-[linear-gradient(110deg,#f5a45d,#ed8541)] px-4 py-3 text-sm font-bold text-[#28150c] shadow-[0_6px_20px_#de782426] transition-[filter,box-shadow] enabled:hover:brightness-110 enabled:hover:shadow-[0_8px_24px_#de782440] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
            >
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
            </button>
          </form>

          <div className="mt-7 border-t border-orange-100/10 pt-5 text-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (isLogin) params.set('mode', 'register');
                else params.delete('mode');
                setPassword('');
                setConfirmPassword('');
                setConfirmError(null);
                setError(null);
                router.replace(`/login${params.size ? `?${params}` : ''}`, { scroll: false });
              }}
              className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 min-h-11 rounded-lg px-2 text-sm font-medium text-orange-200 underline-offset-4 hover:text-orange-100 hover:underline"
            >
              {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
          </section>
        </div>
        <p className="mt-10 text-center text-xs tracking-wide text-orange-100/60">BrewLite · Coffee & Tea</p>
      </div>
    </main>
  );
}
