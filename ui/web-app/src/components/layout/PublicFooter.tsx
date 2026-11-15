import React from 'react';
import { ArrowUp } from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { Logo } from '../ui/Logo.tsx';

interface PublicFooterProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  activeTab,
  onNavigate,
}) => {
  const goToSection = (id: string) => {
    if (activeTab !== 'about') {
      onNavigate('about');
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollTop = () => {
    if (activeTab !== 'about') onNavigate('about');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPrivacy = () => {
    onNavigate('privacy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="marketing-footer mt-16 border-t border-[#E5E2D8] dark:border-[#29383A]">
      <div className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <div>
              <div className="text-[13px] font-extrabold tracking-tight text-[#283638] dark:text-[#F2F5F3]">
                Vector — Requirement engineering for UI teams
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Footer">
            <button
              type="button"
              onClick={scrollTop}
              className="text-[12px] font-medium text-[#626B66] transition-colors hover:text-[#283638] dark:text-[#9AA6A2] dark:hover:text-[#F2F5F3]"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => goToSection('workflow-section')}
              className="text-[12px] font-medium text-[#626B66] transition-colors hover:text-[#283638] dark:text-[#9AA6A2] dark:hover:text-[#F2F5F3]"
            >
              How it works
            </button>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdFh_7ns4lEZiLmAUQDwLmPcgDEtFVHtzGbDCrdDRupEV4XzQ/closedform"
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-medium text-[#626B66] transition-colors hover:text-[#283638] dark:text-[#9AA6A2] dark:hover:text-[#F2F5F3]"
            >
              Feedback
            </a>
            <button
              type="button"
              onClick={openPrivacy}
              className="text-[12px] font-medium text-[#626B66] transition-colors hover:text-[#283638] dark:text-[#9AA6A2] dark:hover:text-[#F2F5F3]"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#49686C] transition-colors hover:text-[#283638] dark:text-[#B9D1D4] dark:hover:text-[#F2F5F3]"
              aria-label="Back to top"
            >
              <ArrowUp className="h-3 w-3" />
              Top
            </button>
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-[#E5E2D8]/80 pt-4 text-[11px] text-[#68706B] dark:border-[#29383A]/80 dark:text-[#9AA6A2] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © 2026 Vector. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">
            Bengaluru, India
          </p>
        </div>
      </div>
    </footer>
  );
};
