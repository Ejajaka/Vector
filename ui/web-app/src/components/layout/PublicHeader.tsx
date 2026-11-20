import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, LogIn } from 'lucide-react';
import { Logo } from '../ui/Logo.tsx';
import { WINDOWS_INSTALLER_URL } from '../../data/downloads.ts';

interface PublicHeaderProps {
  onRequestSignIn: () => void;
  /** Present when the visitor already has a workspace. */
  onOpenApp?: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onRequestSignIn, onOpenApp }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled
          ? 'border-[var(--v-line)] bg-[color-mix(in_srgb,var(--v-bg)_86%,transparent)] backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-1 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex shrink-0 items-center gap-2 pr-2"
          aria-label="Vector home"
        >
          <Logo size={24} />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--v-ink)]">Vector</span>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <a
            href={WINDOWS_INSTALLER_URL}
            className="hidden h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)] md:inline-flex"
          >
            <Download className="h-3.5 w-3.5" /> Windows
          </a>
          {onOpenApp ? (
            <button
              type="button"
              onClick={onOpenApp}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#e8e8ea] px-3.5 text-[12.5px] font-medium text-[#08090a] transition-colors hover:bg-white"
            >
              Open workspace <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onRequestSignIn}
                className="hidden h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)] sm:inline-flex"
              >
                <LogIn className="h-3.5 w-3.5" /> Log in
              </button>
              <button
                type="button"
                onClick={onRequestSignIn}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#e8e8ea] px-3.5 text-[12.5px] font-medium text-[#08090a] transition-colors hover:bg-white"
              >
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
