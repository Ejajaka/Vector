import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  Linkedin,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth, type OAuthProvider } from '../../context/AuthContext.tsx';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '../../services/supabase/client.ts';
import { Logo } from '../ui/Logo.tsx';

type Mode = 'login' | 'register' | 'reset';

interface AuthPageProps {
  onBack?: () => void;
  initialMode?: 'login' | 'register';
}

const HIGHLIGHTS = [
  'Traceable requirements from PDF, DOCX and text',
  'Ambiguity, conflict and dependency detection',
  'Approved, audited acceptance criteria',
  'Six-section design briefs with design tokens',
];

const OAUTH_PROVIDERS: Array<{ id: OAuthProvider; label: string }> = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'github', label: 'GitHub' },
  { id: 'azure', label: 'Microsoft' },
  { id: 'linkedin_oidc', label: 'LinkedIn' },
];

const ProviderIcon: React.FC<{ provider: OAuthProvider }> = ({ provider }) => {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.27Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96L6.4 13.9Z" />
        <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z" />
      </svg>
    );
  }
  if (provider === 'apple') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M16.36 12.8c.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.65 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.39 2.06-1.45 2.51-.37 6.22 1.04 8.26.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.01 2.51-2 .79-1.15 1.12-2.26 1.14-2.32-.03-.01-2.18-.84-2.2-3.36ZM14.3 6.77c.57-.69.96-1.65.85-2.6-.82.03-1.82.55-2.41 1.23-.53.61-1 1.59-.87 2.52.92.07 1.86-.47 2.43-1.15Z" />
      </svg>
    );
  }
  if (provider === 'github') return <Github className="h-4 w-4" aria-hidden="true" />;
  if (provider === 'azure') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#F25022" d="M3 3h8v8H3z" />
        <path fill="#7FBA00" d="M13 3h8v8h-8z" />
        <path fill="#00A4EF" d="M3 13h8v8H3z" />
        <path fill="#FFB900" d="M13 13h8v8h-8z" />
      </svg>
    );
  }
  return <Linkedin className="h-4 w-4" aria-hidden="true" />;
};

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, initialMode = 'login' }) => {
  const { signIn, signInWithProvider, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [providers, setProviders] = useState<Array<{ id: OAuthProvider; label: string }>>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Only show providers that are actually enabled in Supabase, so nobody
  // clicks a button that dead-ends on the provider setup page.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return;
    let active = true;
    fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!active) return;
        const external = body?.external || {};
        setProviders(OAUTH_PROVIDERS.filter((provider) => external[provider.id]));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const oauth = async (provider: OAuthProvider) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await signInWithProvider(provider);
    } catch (e: any) {
      setError(e?.message || 'Could not start that sign-in. Try email instead.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else if (mode === 'register') {
        const result = await signUp(email.trim(), password, displayName);
        if (result.needsConfirmation) {
          setNotice('Account created. Check your email to confirm it, then sign in.');
          setMode('login');
          setPassword('');
        }
      } else {
        await resetPassword(email.trim());
        setNotice('Password reset email sent. Check your inbox.');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F6F4EC] dark:bg-[#141C1D] px-4 py-8 sm:py-12 flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(73,104,108,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(73,104,108,0.055) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    >
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-[#49686C]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[30rem] h-[30rem] rounded-full bg-[#D1B653]/18 blur-3xl" />

      <div className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#49686C] dark:text-[#B9D1D4] hover:text-[#283638] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to overview
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#737A72] dark:text-[#8E9A93]">
            Require · Review · Generate
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_1fr] rounded-lg overflow-hidden border border-[#E5E2D8] dark:border-[#33403F] shadow-2xl bg-white dark:bg-[#1B2526]">
          {/* Brand / product panel */}
          <aside className="relative hidden lg:flex flex-col justify-between p-9 bg-[var(--v-surface)] text-[var(--v-ink)] overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
                backgroundSize: '22px 22px',
              }}
            />
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/15" />
            <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full border border-white/10" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <Logo size={42} />
                <div>
                  <div className="text-lg font-semibold tracking-tight leading-none">Vector</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-1">
                    Vector — Requirement engineering for UI teams
                  </div>
                </div>
              </div>

              <h1 className="mt-10 text-[2rem] leading-[1.15] font-semibold tracking-tight">
                Requirements in.
                <br />
                Interfaces that hold up.
              </h1>
              <p className="mt-3 text-sm text-white/70 leading-relaxed max-w-sm">
                Turn product documents into traceable requirements, reviewed edge cases and a
                build-ready specification — before anyone writes UI code.
              </p>

              <ul className="mt-7 space-y-2.5">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/85">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-white/12 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-[var(--v-accent-hover)]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Floating product mock */}
            <div className="relative mt-8">
              <div className="rounded-xl bg-white/8 border border-white/15 backdrop-blur-sm p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-white/50 font-semibold">
                    Generated brief
                  </span>
                  <span className="rounded border border-[var(--v-accent)]/25 bg-[var(--v-accent-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-accent-hover)]">
                    Ready
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-white/25" />
                  <div className="h-1.5 w-full rounded-full bg-white/15" />
                  <div className="h-1.5 w-5/6 rounded-full bg-white/15" />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {['#7170ff', '#5e6ad2', '#2a2b2f'].map((color) => (
                    <span key={color} className="w-4 h-4 rounded-full border border-white/30" style={{ background: color }} />
                  ))}
                  <span className="text-[9px] text-white/55 font-mono ml-1">tokens injected</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {['REQ-01', 'REQ-02', 'REQ-03'].map((code) => (
                    <span key={code} className="text-[8px] font-mono text-white/70 bg-white/8 border border-white/10 rounded px-1.5 py-1">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <section className="p-6 sm:p-9">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <Logo size={38} />
              <div>
                <div className="text-base font-semibold text-[#283638] dark:text-[#E7E4D9] leading-none">Vector</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-[#737A72] dark:text-[#8E9A93] mt-1">
                  Vector — Requirement engineering for UI teams
                </div>
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-[#F6F4EC] dark:bg-[#141C1D] rounded-xl mb-6">
              {[
                { id: 'login' as Mode, label: 'Sign in' },
                { id: 'register' as Mode, label: 'Create account' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setMode(item.id); setError(''); setNotice(''); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === item.id
                      ? 'bg-white dark:bg-[#263335] text-[#283638] dark:text-white shadow-xs'
                      : 'text-[#737A72] dark:text-[#8E9A93] hover:text-[#283638] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#283638] dark:text-[#E7E4D9] tracking-tight">
                {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your workspace' : 'Reset your password'}
              </h2>
              <p className="text-xs text-[#737A72] dark:text-[#8E9A93] mt-1">
                {mode === 'login'
                  ? 'Sign in to continue to your projects and specifications.'
                  : mode === 'register'
                    ? 'Your projects, documents and approvals stay private to your workspace.'
                    : 'We will email you a secure link to set a new password.'}
              </p>
            </div>

            {providers.length > 0 && mode !== 'reset' && (
              <div className="mb-5">
                <div className={`grid gap-2 ${providers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => void oauth(provider.id)}
                      disabled={busy}
                      aria-label={`Continue with ${provider.label}`}
                      className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-[#E5E2D8] dark:border-[#33403F] bg-white dark:bg-[#1B2526] px-3 py-2.5 text-[13px] font-semibold text-[#283638] dark:text-[#E7E4D9] transition-colors hover:border-[#49686C]/50 hover:bg-[#FAFAF8] dark:hover:bg-[#223031] disabled:opacity-60"
                    >
                      <ProviderIcon provider={provider.id} />
                      <span className="truncate">{provider.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[#E5E2D8] dark:bg-[#33403F]" />
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#737A72] dark:text-[#8E9A93]">
                    or with email
                  </span>
                  <span className="h-px flex-1 bg-[#E5E2D8] dark:bg-[#33403F]" />
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <label className="block">
                  <span className="text-xs font-semibold text-[#283638] dark:text-[#E7E4D9] block mb-1">Name</span>
                  <div className="relative">
                    <UserPlus className="w-4 h-4 text-[#737A72] absolute left-3 top-3" />
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E5E2D8] dark:border-[#33403F] bg-[#FAFAF8] dark:bg-[#141C1D] text-sm text-[#283638] dark:text-[#E7E4D9] focus:bg-white dark:focus:bg-[#1B2526] focus:outline-none focus:border-[#49686C] focus:ring-2 focus:ring-[#49686C]/15"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-[#283638] dark:text-[#E7E4D9] block mb-1">Email</span>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#737A72] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E5E2D8] dark:border-[#33403F] bg-[#FAFAF8] dark:bg-[#141C1D] text-sm text-[#283638] dark:text-[#E7E4D9] focus:bg-white dark:focus:bg-[#1B2526] focus:outline-none focus:border-[#49686C] focus:ring-2 focus:ring-[#49686C]/15"
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              {mode !== 'reset' && (
                <label className="block">
                  <span className="text-xs font-semibold text-[#283638] dark:text-[#E7E4D9] block mb-1">Password</span>
                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 text-[#737A72] absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#E5E2D8] dark:border-[#33403F] bg-[#FAFAF8] dark:bg-[#141C1D] text-sm text-[#283638] dark:text-[#E7E4D9] focus:bg-white dark:focus:bg-[#1B2526] focus:outline-none focus:border-[#49686C] focus:ring-2 focus:ring-[#49686C]/15"
                      placeholder="At least 8 characters"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2.5 top-2.5 p-1 text-[#737A72] hover:text-[#283638] dark:hover:text-white rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>
              )}

              {error && (
                <div role="alert" className="text-xs text-[#B94D42] bg-[#FDF2F0] dark:bg-[#3A2523] border border-[#F0C4BF] dark:border-[#5C3532] rounded-lg p-2.5">
                  {error}
                </div>
              )}
              {notice && (
                <div className="text-xs text-[#3E6B33] bg-[#F4F9F1] dark:bg-[#23301F] border border-[#CFE2C8] dark:border-[#3D5236] rounded-lg p-2.5">
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#49686C] hover:bg-[#30494B] disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'reset' ? (
                  <KeyRound className="w-4 h-4" />
                ) : mode === 'register' ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'reset' ? 'login' : 'reset')}
                className="text-[11px] font-semibold text-[#49686C] dark:text-[#9DBEC1] hover:text-[#30494B] dark:hover:text-white"
              >
                {mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
              </button>
              <span className="text-[10px] text-[#737A72] dark:text-[#8E9A93]">
                Secured by Supabase Auth
              </span>
            </div>

            <p className="mt-6 pt-4 border-t border-[#E5E2D8] dark:border-[#33403F] text-[10px] text-[#737A72] dark:text-[#8E9A93] leading-relaxed">
              Your projects and documents stay private to your workspace. Vector never invents a
              requirement you did not provide.
            </p>
          </section>
        </div>

        <p className="text-center text-[10px] text-[#737A72] dark:text-[#8E9A93] mt-5">
              Vector — Requirement engineering for UI teams
        </p>
      </div>
    </div>
  );
};
