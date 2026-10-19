'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coffee, Lock, Mail } from 'lucide-react';
import { login, register } from '@/services/api';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login({ email, password });
        localStorage.setItem('brewlite_token', res.access_token);
        localStorage.setItem('brewlite_user', JSON.stringify(res.user));
      } else {
        const res = await register({ email, password });
        localStorage.setItem('brewlite_token', res.access_token);
        localStorage.setItem('brewlite_user', JSON.stringify(res.user));
      }
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Thao tác không thành công';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-black mb-6">
          <ArrowLeft size={16} />
          Về menu
        </Link>

        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md">
            <Coffee size={28} />
          </div>
        </div>

        <h2 className="mt-4 text-center text-xl font-black text-gray-900">
          {isLogin ? 'Đăng nhập BrewLite' : 'Tạo tài khoản mới'}
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          {isLogin ? 'Đăng nhập để đặt nước và tích điểm thành viên' : 'Đăng ký nhận ngay mã giảm giá cho đơn đầu tiên'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-sm border border-gray-100 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs text-amber-600 hover:underline font-semibold"
            >
              {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
