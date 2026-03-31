// components/LoginPage.tsx
import { useState, useRef, type KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, AlertCircle, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import AuthService from '../services/AuthService';

interface LocationState {
  from?: { pathname: string };
}

interface LoginPageProps {
  onLogin?: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname ?? '/';

  const [serial, setSerial]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!serial.trim()) return;
    setError('');
    setLoading(true);

    // Swap setTimeout for a real API call if needed
    await new Promise((r) => setTimeout(r, 700));

    const result = AuthService.login(serial);
    setLoading(false);

    if (!result.valid) {
      setError(result.error ?? 'الرقم التسلسلي غير صحيح');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.select();
      return;
    }

    // Notify parent component of successful login and navigate
    if (onLogin) {
      onLogin();
    }
    // Always navigate after successful login
    navigate(from, { replace: true });
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 transition-colors duration-300"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 mb-5 transform hover:scale-105 transition-transform duration-300">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Full POS Flow
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              تفعيل النظام
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              أدخل الرقم التسلسلي للمنتج للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Input Group */}
          <div className="space-y-5">
            {/* Label */}
            <label
              htmlFor="serial-input"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              الرقم التسلسلي
            </label>

            {/* Input */}
            <div className={shake ? 'animate-shake' : ''}>
              <div className="relative">
                <input
                  id="serial-input"
                  ref={inputRef}
                  type="text"
                  placeholder="A1B2-C3D4-E5F6"
                  value={serial}
                  onChange={(e) => { setSerial(e.target.value); setError(''); }}
                  onKeyDown={handleKey}
                  autoComplete="off"
                  autoFocus
                  spellCheck={false}
                  aria-describedby="serial-error"
                  aria-invalid={Boolean(error)}
                  className={[
                    'w-full px-4 py-4 rounded-xl text-sm font-mono tracking-wider text-center',
                    'bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white',
                    'placeholder-slate-400 dark:placeholder-slate-600',
                    'border-2 outline-none transition-all duration-200',
                    'focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500',
                    error
                      ? 'border-red-400 dark:border-red-500 focus:ring-red-400/20 focus:border-red-400'
                      : 'border-slate-200 dark:border-slate-700',
                  ].join(' ')}
                />
                {serial && !error && (
                  <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                id="serial-error"
                role="alert"
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
              >
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !serial.trim()}
              aria-busy={loading}
              className={[
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold tracking-wide',
                'text-white bg-gradient-to-r from-blue-600 to-indigo-600',
                'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40',
                'hover:-translate-y-0.5 active:translate-y-0',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جارٍ التحقق...</span>
                </>
              ) : (
                <>
                  <span>تفعيل الدخول</span>
                  <Zap className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
            الرقم التسلسلي موجود في رسالة تأكيد الشراء
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
            تواصل مع الدعم إذا واجهت أي مشكلة
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-600">
          <Shield className="w-3.5 h-3.5" />
          <span>اتصال آمن ومشفّر</span>
        </div>

      </div>
    </div>
  );
}