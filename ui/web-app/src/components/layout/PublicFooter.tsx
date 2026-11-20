import React from 'react';
import { ArrowUp, Mail } from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { Logo } from '../ui/Logo.tsx';

interface PublicFooterProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

const COLUMNS: Array<{ title: string; links: Array<{ label: string; tab: ActiveTab }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', tab: 'about' },
      { label: 'Templates', tab: 'templates' },
      { label: 'Design systems', tab: 'design' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Guides', tab: 'learn' },
      { label: 'Documentation', tab: 'manual' },
      { label: 'Plans and pricing', tab: 'pricing' },
      { label: 'Contact', tab: 'contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', tab: 'privacy' },
      { label: 'Terms of service', tab: 'terms' },
    ],
  },
];

export const PublicFooter: React.FC<PublicFooterProps> = ({ activeTab, onNavigate }) => {
  const go = (tab: ActiveTab) => {
    onNavigate(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-24 border-t border-[var(--v-line)] bg-[var(--v-bg)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <button type="button" onClick={() => go('about')} className="flex items-center gap-2" aria-label="Vector home">
              <Logo size={24} />
              <span className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--v-ink)]">Vector</span>
            </button>
            <p className="mt-3 max-w-[240px] text-[12px] leading-relaxed text-[var(--v-muted)]">
              Requirement engineering for UI teams. Turn an under-specified prompt into a complete, reviewed brief.
            </p>
            <a
              href="mailto:hello@vector.is-a.dev"
              className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--v-violet)] hover:underline"
            >
              <Mail className="h-3 w-3" /> hello@vector.is-a.dev
            </a>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] font-medium text-[var(--v-faint)]">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => go(link.tab)}
                      className={`text-[12px] transition-colors hover:text-[var(--v-ink)] ${
                        activeTab === link.tab ? 'font-semibold text-[var(--v-ink)]' : 'text-[var(--v-muted)]'
                      }`}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--v-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10.5px] text-[var(--v-faint)]">
            © 2026 Vector. All rights reserved. · Bengaluru, India
          </p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => go('contact')} className="text-[10.5px] text-[var(--v-muted)] hover:text-[var(--v-ink)]">
              Contact
            </button>
            <button type="button" onClick={() => go('terms')} className="text-[10.5px] text-[var(--v-muted)] hover:text-[var(--v-ink)]">
              Terms
            </button>
            <button type="button" onClick={() => go('privacy')} className="text-[10.5px] text-[var(--v-muted)] hover:text-[var(--v-ink)]">
              Privacy
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[var(--v-ink)]"
            >
              <ArrowUp className="h-3 w-3" /> Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

