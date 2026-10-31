import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Check,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { useUserAuth } from '../lib/userAuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { KolamMotif } from '../components/KolamMotif';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';

export const AuthPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { user, loginWithGoogle, loginWithFacebook, loginWithEmail, registerWithEmail, logout, loginAsGuest } = useUserAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingAction('google');
    try {
      const res = await loginWithGoogle();
      showToast(`${t('auth.loginSuccess')} (${res.displayName})`, 'success');
      navigate('/home');
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFacebookLogin = async () => {
    setLoadingAction('facebook');
    try {
      const res = await loginWithFacebook();
      showToast(`${t('auth.loginSuccess')} (${res.displayName})`, 'success');
      navigate('/home');
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast(t('common.error'), 'warning');
      return;
    }

    setLoadingAction('email');
    try {
      if (mode === 'signup') {
        const res = await registerWithEmail(email, password, name);
        showToast(`${t('auth.loginSuccess')} (${res.displayName})`, 'success');
      } else {
        const res = await loginWithEmail(email, password);
        showToast(`${t('auth.loginSuccess')} (${res.displayName})`, 'success');
      }
      navigate('/home');
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGuestContinue = () => {
    loginAsGuest();
    showToast(t('auth.guestDesc'), 'info');
    navigate('/home');
  };

  const handleSignOut = async () => {
    await logout();
    showToast(t('auth.logoutSuccess'), 'info');
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col relative select-none">
      <TopBar
        title={t('auth.title')}
        subtitle="Firebase Auth & Cloud Sync"
        showBack={true}
        onBack={() => navigate(-1)}
      />

      {/* Decorative Kolam Motifs */}
      <div className="absolute top-16 right-0 pointer-events-none opacity-15">
        <KolamMotif size={140} color="#C2185B" />
      </div>

      <div className="flex-1 pb-24 pt-3 px-4 flex flex-col gap-5 max-w-[420px] mx-auto w-full z-10">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-2 text-sm font-bold text-warmBrown hover:text-kumkum px-2 py-1 rounded-xl transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* ALREADY LOGGED IN CARD */}
        {user ? (
          <Card variant="surface" className="flex flex-col gap-4 text-center py-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-turmeric-light border-2 border-turmeric flex items-center justify-center text-3xl shadow-warm-sm">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>👩</span>
                )}
              </div>
              <h2 className="text-xl font-black text-warmBrown">{user.displayName}</h2>
              {user.email && (
                <span className="text-xs font-semibold text-warmBrown-subtle">{user.email}</span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cream-dark text-warmBrown mt-1 border border-[#EFEBE9]">
                <ShieldCheck className="w-3.5 h-3.5 text-leafGreen" />
                <span>{t('auth.connectedWith')} {user.providerId.toUpperCase()}</span>
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/home')}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t('notFound.goHome')}
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleSignOut}
                icon={<LogOut className="w-4 h-4" />}
              >
                {t('auth.signOut')}
              </Button>
            </div>
          </Card>
        ) : (
          /* LOGIN / SIGNUP VIEW */
          <div className="flex flex-col gap-4">
            {/* Mascot Banner */}
            <div className="flex items-center gap-3 bg-white/90 p-4 rounded-3xl border border-[#EFEBE9] shadow-warm-sm">
              <Mascot mood="happy" size={76} />
              <div>
                <h2 className="text-lg font-black text-warmBrown leading-snug">{t('auth.title')}</h2>
                <p className="text-xs font-medium text-warmBrown-subtle mt-0.5 leading-relaxed">
                  {t('auth.subtitle')}
                </p>
              </div>
            </div>

            {/* 1. Google One-Click Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingAction === 'google'}
              className="w-full min-h-[56px] px-5 py-3 rounded-2xl bg-white hover:bg-cream border-2 border-[#EFEBE9] hover:border-[#D7CCC8] shadow-warm-sm flex items-center justify-center gap-3 active:scale-[0.99] transition-all font-bold text-warmBrown text-base disabled:opacity-60"
            >
              {loadingAction === 'google' ? (
                <Sparkles className="w-5 h-5 animate-spin text-turmeric-dark" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{t('auth.googleSignIn')}</span>
            </button>

            {/* 2. Facebook One-Click Button */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loadingAction === 'facebook'}
              className="w-full min-h-[56px] px-5 py-3 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-warm-sm flex items-center justify-center gap-3 active:scale-[0.99] transition-all font-bold text-base disabled:opacity-60"
            >
              {loadingAction === 'facebook' ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              <span>{t('auth.facebookSignIn')}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#EFEBE9]" />
              <span className="text-xs font-bold text-warmBrown-subtle uppercase tracking-wider">
                {t('auth.or')}
              </span>
              <div className="flex-1 h-px bg-[#EFEBE9]" />
            </div>

            {/* 3. Email Form Card */}
            <Card variant="surface" className="flex flex-col gap-3.5">
              {/* Tab Selector */}
              <div className="flex p-1 bg-cream rounded-2xl border border-[#EFEBE9]">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === 'signin' ? 'bg-kumkum text-white shadow-warm-sm' : 'text-warmBrown-muted'
                  }`}
                >
                  {t('auth.signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === 'signup' ? 'bg-kumkum text-white shadow-warm-sm' : 'text-warmBrown-muted'
                  }`}
                >
                  {t('auth.signUp')}
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs font-bold text-warmBrown-subtle block mb-1">
                      {t('auth.nameLabel')}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-warmBrown-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('auth.namePlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-warmBrown-subtle block mb-1">
                    {t('auth.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-warmBrown-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-warmBrown-subtle block mb-1">
                    {t('auth.passwordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-warmBrown-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-[#EFEBE9] focus:border-kumkum focus:outline-none text-warmBrown text-sm font-semibold"
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={loadingAction === 'email'}
                >
                  {mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}
                </Button>
              </form>
            </Card>

            {/* 4. Continue as Guest (Offline Mode) */}
            <button
              type="button"
              onClick={handleGuestContinue}
              className="p-3.5 rounded-2xl bg-cream hover:bg-cream-dark border border-[#EFEBE9] text-center active:scale-[0.99] transition-all"
            >
              <span className="text-xs sm:text-sm font-extrabold text-warmBrown block">
                {t('auth.continueGuest')}
              </span>
              <span className="text-[11px] font-medium text-warmBrown-subtle mt-0.5 block">
                {t('auth.guestDesc')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
