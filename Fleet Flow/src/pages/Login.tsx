import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthService from '@/services/AuthService';

export default function Login() {
  const [serial, setSerial] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = AuthService.login(serial);

    if (result.valid) {
      navigate(from, { replace: true });
    } else {
      setError(result.error ?? t('auth.error'));
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-[#1F3B61]">
            {t('app.title')}
          </CardTitle>
          <CardDescription>{t('app.subtitle')}</CardDescription>

          {/* Language toggle */}
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => i18n.changeLanguage('ar')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                i18n.language === 'ar'
                  ? 'bg-[#1F3B61] text-white border-[#1F3B61]'
                  : 'text-slate-500 border-slate-300 hover:border-[#1F3B61] hover:text-[#1F3B61]'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => i18n.changeLanguage('en')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                i18n.language === 'en'
                  ? 'bg-[#1F3B61] text-white border-[#1F3B61]'
                  : 'text-slate-500 border-slate-300 hover:border-[#1F3B61] hover:text-[#1F3B61]'
              }`}
            >
              English
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serial">{t('auth.serialLabel')}</Label>
              <Input
                id="serial"
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                required
                autoComplete="off"
                dir="ltr"
                className="tracking-widest text-center font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground text-center">
                {t('auth.serialHint')}
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#1F3B61] hover:bg-[#152a47]"
              disabled={loading}
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}