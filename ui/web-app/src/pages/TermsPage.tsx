import React from 'react';
import type { ActiveTab } from '../types/analysis.ts';

interface LegalPageProps {
  onNavigate: (tab: ActiveTab) => void;
}

const SECTIONS = [
  { id: 'acceptance', title: '1. Accepting these terms' },
  { id: 'accounts', title: '2. Accounts and workspaces' },
  { id: 'use', title: '3. Acceptable use' },
  { id: 'content', title: '4. Your content' },
  { id: 'billing', title: '5. Plans, billing and refunds' },
  { id: 'availability', title: '6. Availability and changes' },
  { id: 'liability', title: '7. Liability' },
  { id: 'contact', title: '8. Contact' },
];

export const TermsPage: React.FC<LegalPageProps> = ({ onNavigate }) => (
  <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
    <p className="v-eyebrow">Legal</p>
    <h1 className="v-display mt-2 text-[32px] text-[var(--v-ink)] sm:text-[40px]">Terms of service</h1>
    <p className="mt-3 text-[13px] text-[var(--v-muted)]">Last updated 19 November 2026. Plain language on purpose.</p>

    <nav className="mt-6 flex flex-wrap gap-1.5" aria-label="Sections">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="rounded-full border border-[var(--v-line)] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
        >
          {section.title.replace(/^\d+\.\s/, '')}
        </a>
      ))}
    </nav>

    <div className="mt-8 space-y-7 text-[13px] leading-relaxed text-[var(--v-muted)]">
      <section id="acceptance">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[0].title}</h2>
        <p className="mt-1.5">
          By creating an account or using Vector you agree to these terms. If you use Vector for an organisation, you
          confirm you are allowed to accept them on its behalf.
        </p>
      </section>

      <section id="accounts">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[1].title}</h2>
        <p className="mt-1.5">
          You are responsible for keeping your credentials safe and for activity under your account. Workspace
          administrators control membership: design systems, private templates and canvases belong to the workspace,
          not to an individual, and remain with it when a member leaves.
        </p>
      </section>

      <section id="use">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[2].title}</h2>
        <p className="mt-1.5">You agree not to:</p>
        <ul className="mt-1.5 space-y-1 pl-4">
          <li className="list-disc">upload unlawful content, or content you do not have rights to;</li>
          <li className="list-disc">attempt to access another workspace&apos;s private design systems or templates;</li>
          <li className="list-disc">probe, scan or overload the service, or bypass usage limits;</li>
          <li className="list-disc">resell access without a written agreement.</li>
        </ul>
      </section>

      <section id="content">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[3].title}</h2>
        <p className="mt-1.5">
          You keep ownership of everything you create — prompts, canvases, design systems and templates. We store it to
          run the product for you, and we do not train models on your private content. Public library templates are
          licensed for use inside Vector.
        </p>
      </section>

      <section id="billing">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[4].title}</h2>
        <p className="mt-1.5">
          Every new account gets two free projects. Paid plans are billed in INR through Razorpay, monthly or annually,
          exclusive of GST. You can cancel at any time and keep access until the end of the paid period. The first paid
          month is refundable within 7 days — write to us before the period ends.
        </p>
      </section>

      <section id="availability">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[5].title}</h2>
        <p className="mt-1.5">
          We aim for continuous availability but do not guarantee it. Features may change or be withdrawn; if a paid
          feature is removed we will prorate the remaining period. Local-only features (rules engine, canvas history)
          keep working offline.
        </p>
      </section>

      <section id="liability">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[6].title}</h2>
        <p className="mt-1.5">
          Vector is a design aid. You are responsible for reviewing generated interfaces before shipping them. To the
          extent permitted by law, our liability is limited to the amount you paid in the twelve months before a claim.
        </p>
      </section>

      <section id="contact">
        <h2 className="text-[15px] font-semibold text-[var(--v-ink)]">{SECTIONS[7].title}</h2>
        <p className="mt-1.5">
          Questions about these terms?{' '}
          <button type="button" onClick={() => onNavigate('contact')} className="font-semibold text-[var(--v-violet)] hover:underline">
            Contact us
          </button>
          . See also our{' '}
          <button type="button" onClick={() => onNavigate('privacy')} className="font-semibold text-[var(--v-violet)] hover:underline">
            privacy policy
          </button>
          .
        </p>
      </section>
    </div>
  </div>
);
