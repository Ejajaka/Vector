import React from 'react';
import { ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { Logo } from '../ui/Logo.tsx';

interface SignedOutPageProps {
  configured: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onContinueLocal: () => void;
}

/**
 * The screen shown immediately after sign-out. It keeps the product shell
 * language (dark canvas, hairline card, indigo primary) and gives a clear next
 * step instead of dropping people onto the marketing page.
 */
export const SignedOutPage: React.FC<SignedOutPageProps> = ({
  configured,
  onLogin,
  onRegister,
  onContinueLocal,
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--v-bg)] text-[var(--v-ink)]">
      <header className="flex h-16 items-center border-b border-[var(--v-line)] px-5 sm:px-8">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Vector</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px]">
          <div className="v-card p-6 sm:p-7">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] text-[var(--v-accent-hover)]">
              <LogIn className="h-4 w-4" />
            </span>

            <h1 className="v-display mt-4 text-[26px] text-[var(--v-ink)]">You're signed out.</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--v-muted)]">
              Your projects, requirements and prompt history are safe. Sign back in to continue
              where you left off, or create a new workspace.
            </p>

            <div className="mt-5 space-y-2">
              <button type="button" onClick={onLogin} className="v-btn v-btn-primary h-9 w-full text-[12.5px]">
                <LogIn className="h-4 w-4" /> Log in
              </button>
              <button type="button" onClick={onRegister} className="v-btn h-9 w-full text-[12.5px]">
                <UserPlus className="h-4 w-4" /> Create an account
              </button>
            </div>

            {!configured && (
              <div className="mt-4 rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
                <p className="text-[11px] leading-relaxed text-[var(--v-muted)]">
                  Accounts are not connected in this local build. You can continue into the
                  workspace without signing in.
                </p>
                <button
                  type="button"
                  onClick={onContinueLocal}
                  className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--v-accent-hover)] hover:underline"
                >
                  Continue in local mode <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            <p className="mt-4 text-center text-[10.5px] text-[var(--v-faint)]">
              Free includes two full projects. No card required.
            </p>
          </div>

          <p className="mt-4 text-center text-[10.5px] text-[var(--v-faint)]">
            Requirement engineering for UI teams.
          </p>
        </div>
      </main>
    </div>
  );
};
