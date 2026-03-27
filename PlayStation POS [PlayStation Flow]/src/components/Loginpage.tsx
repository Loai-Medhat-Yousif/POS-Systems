// components/LoginPage.tsx
import { useState, useRef, type KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import AuthService from '../services/AuthService';

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname ?? '/dashboard';

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

    navigate(from, { replace: true });
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors duration-300"
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-blue-950 dark:text-white">PlayStation Flow</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500/80 dark:text-blue-400 mt-1">
            Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            تفعيل النظام
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            أدخل الرقم التسلسلي للمنتج للوصول إلى لوحة التحكم.
          </p>

          {/* Label */}
          <label
            htmlFor="serial-input"
            className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2"
          >
            الرقم التسلسلي
          </label>

          {/* Input */}
          <div className={shake ? 'animate-shake' : ''}>
            <input
              id="serial-input"
              ref={inputRef}
              type="text"
              placeholder="مثال: A1B2-C3D4-E5F6"
              value={serial}
              onChange={(e) => { setSerial(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              autoComplete="off"
              autoFocus
              spellCheck={false}
              aria-describedby="serial-error"
              aria-invalid={Boolean(error)}
              className={[
                'w-full px-4 py-3 rounded-xl text-sm font-mono tracking-wider',
                'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
                'placeholder-slate-400 dark:placeholder-slate-600',
                'border outline-none transition-all duration-200',
                'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
                error
                  ? 'border-red-400 dark:border-red-500 focus:ring-red-400/20 focus:border-red-400'
                  : 'border-slate-200 dark:border-slate-700',
              ].join(' ')}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              id="serial-error"
              role="alert"
              className="flex items-center gap-2 mt-2 text-xs text-red-500 dark:text-red-400"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !serial.trim()}
            aria-busy={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-wide text-white bg-linear-to-r from-blue-500 to-purple-500 shadow-md shadow-blue-500/20 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ التحقق…
              </>
            ) : (
              'تفعيل الدخول ←'
            )}
          </button>
        </div>

        {/* Hint */}
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600 leading-relaxed">
          الرقم التسلسلي موجود في رسالة تأكيد الشراء.
          <br />
          تواصل مع الدعم إذا واجهت أي مشكلة.
        </p>

      </div>
    </div>
  );
}