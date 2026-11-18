import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  LogIn,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Logo } from '../ui/Logo.tsx';

interface PublicHeaderProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onRequestSignIn: () => void;
}

const SECTION_LINKS = [
  { id: 'hero', label: 'Overview' },
  { id: 'problem-section', label: 'Why Vector' },
  { id: 'workflow-section', label: 'How it works' },
  { id: 'advantages-section', label: 'Benefits' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activeTab,
  onNavigate,
  onRequestSignIn,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const pendingSection = useRef<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'about' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: '-42% 0px -48% 0px', threshold: 0 },
    );

    SECTION_LINKS.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (activeTab !== 'about' || !pendingSection.current) return;
    const id = pendingSection.current;
    pendingSection.current = null;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeTab]);

  const goToSection = (id: string) => {
    setMobileOpen(false);
    if (activeTab !== 'about') {
      pendingSection.current = id;
      onNavigate('about');
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`marketing-header sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? 'is-scrolled border-[#E5E2D8]/80 dark:border-[#29383A]/80'
          : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => goToSection('hero')}
          className="group flex min-w-0 items-center gap-2.5"
          aria-label="Vector home"
        >
          <Logo
            size={24}
            className="shrink-0 transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-105"
          />
          <span className="truncate text-[13px] font-extrabold tracking-tight text-[#22312F] dark:text-[#F2F5F3] sm:hidden">
            Vector
          </span>
          <span className="hidden truncate text-[13px] font-extrabold tracking-tight text-[#22312F] dark:text-[#F2F5F3] sm:inline lg:hidden">
            Vector — Requirement engineering
          </span>
          <span className="hidden truncate text-[13px] font-extrabold tracking-tight text-[#22312F] dark:text-[#F2F5F3] lg:inline xl:hidden">
            Vector
          </span>
          <span className="hidden truncate text-[13px] font-extrabold tracking-tight text-[#22312F] dark:text-[#F2F5F3] xl:inline">
            Vector — Requirement engineering for UI teams
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Page sections">
          {SECTION_LINKS.map((link) => {
            const active = activeTab === 'about' && activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => goToSection(link.id)}
                aria-current={active ? 'true' : undefined}
                className={`relative rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? 'text-[#283638] dark:text-[#F2F5F3]'
                    : 'text-[#66716C] hover:text-[#283638] dark:text-[#9AA6A2] dark:hover:text-[#F2F5F3]'
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[#D1B653] transition-all duration-300 ${
                    active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#66716C] transition-colors hover:bg-[#283638]/5 hover:text-[#283638] dark:text-[#9AA6A2] dark:hover:bg-white/5 dark:hover:text-white"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#D1B653]" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onRequestSignIn}
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#49686C] transition-colors hover:bg-[#49686C]/10 dark:text-[#B9D1D4] dark:hover:bg-white/5 sm:inline-flex"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#283638] transition-colors hover:bg-[#283638]/5 dark:text-[#F2F5F3] dark:hover:bg-white/5 lg:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden" aria-hidden="true">
        <div
          className="h-full origin-left bg-gradient-to-r from-[#49686C] via-[#D1B653] to-[#688E5E] transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {mobileOpen && (
        <div
          id="public-mobile-nav"
          className="mobile-panel-in border-t border-[#E5E2D8] bg-[#FBF9F2]/95 px-4 pb-5 pt-2 shadow-xl backdrop-blur-xl dark:border-[#29383A] dark:bg-[#101718]/95 lg:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobile page sections">
            {SECTION_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => goToSection(link.id)}
                className="flex items-center justify-between border-b border-[#E5E2D8]/70 py-3 text-left text-sm font-semibold text-[#283638] dark:border-[#29383A]/70 dark:text-[#F2F5F3]"
              >
                {link.label}
                <ArrowRight className="h-4 w-4 text-[#8A938C]" />
              </button>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onRequestSignIn();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E2D8] bg-white/70 px-4 py-3 text-sm font-semibold text-[#283638] dark:border-[#33403F] dark:bg-white/5 dark:text-[#F2F5F3]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
