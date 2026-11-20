import React, { useEffect, useState } from 'react';
import { ArrowRight, LogIn, Menu, X } from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { Logo } from '../ui/Logo.tsx';

interface PublicHeaderProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onRequestSignIn: () => void;
  /** Present when the visitor already has a workspace. */
  onOpenApp?: () => void;
}

const LINKS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'about', label: 'Product' },
  { id: 'templates', label: 'Templates' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'learn', label: 'Learn' },
  { id: 'contact', label: 'Contact' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({ activeTab, onNavigate, onRequestSignIn, onOpenApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const go = (tab: ActiveTab) => {
    setMobileOpen(false);
    onNavigate(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled
          ? 'border-[var(--v-line)] bg-[color-mix(in_srgb,var(--v-bg)_86%,transparent)] backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-1 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => go('about')} className="flex shrink-0 items-center gap-2 pr-2" aria-label="Vector home">
          <Logo size={24} />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--v-ink)]">Vector</span>
        </button>

        <nav className="ml-3 hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {LINKS.map((link) => {
            const active = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active ? 'bg-[var(--v-surface-2)] text-[var(--v-ink)]'
                    : 'text-[var(--v-muted)] hover:text-[var(--v-ink)]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {onOpenApp ? (
            <button
              type="button"
              onClick={onOpenApp}
              className="hidden h-8 items-center gap-1.5 rounded-md bg-[#e8e8ea] px-3.5 text-[12.5px] font-medium text-[#08090a] transition-colors hover:bg-white sm:inline-flex"
              
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
                className="hidden h-8 items-center gap-1.5 rounded-md bg-[#e8e8ea] px-3.5 text-[12.5px] font-medium text-[#08090a] transition-colors hover:bg-white sm:inline-flex"
                
              >
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="v-icon-btn lg:!hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--v-line)] bg-[var(--v-bg)] px-4 pb-5 pt-2 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                className="flex items-center justify-between border-b border-[var(--v-line)] py-3 text-left text-[13px] font-semibold text-[var(--v-ink)]"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5 text-[var(--v-faint)]" />
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onRequestSignIn();
            }}
            className="mt-4 w-full v-btn v-btn-primary h-10 text-[12px]"
          >
            Start free
          </button>
        </div>
      )}
    </header>
  );
};


