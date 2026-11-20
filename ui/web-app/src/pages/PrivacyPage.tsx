import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

const SECTIONS = [
  ['overview', 'Overview'],
  ['collect', 'Information we collect'],
  ['use', 'How we use information'],
  ['legal-bases', 'Legal bases'],
  ['sharing', 'Sharing and processors'],
  ['retention', 'Data retention'],
  ['security', 'Security'],
  ['rights', 'Your rights'],
  ['cookies', 'Cookies and local storage'],
  ['transfers', 'International transfers'],
  ['children', 'Children'],
  ['changes', 'Changes to this policy'],
  ['contact', 'Contact'],
] as const;

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <header className="border-b border-[var(--v-line)] pb-8">
        <div className="flex items-center gap-2 text-[var(--v-accent-hover)]">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10.5px] font-medium uppercase tracking-[0.06em]">Legal</span>
        </div>
        <h1 className="v-display mt-2 text-[36px] text-[var(--v-ink)] sm:text-[42px]">Privacy Policy</h1>
        <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-[var(--v-muted)]">
          This policy explains what Vector collects, why we collect it, how it is stored and the
          choices you have. It applies to the Vector web application and the workspace behind it.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11.5px] text-[var(--v-faint)]">
          <span>Effective: 20 November 2026</span>
          <span>Last updated: 20 November 2026</span>
          <span>Version 2.0</span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--v-faint)]">On this page</p>
          <nav className="mt-3 space-y-1.5">
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="block text-[12px] leading-snug text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-5 py-6 sm:px-7 sm:py-8">
          <div className="space-y-8 text-[12.5px] leading-[1.75] text-[var(--v-muted)]">
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">1. Overview</h2>
              <p className="mt-2">
                Vector is a requirement-to-interface workspace. You can use parts of the public site
                without an account. An account is required to create and save projects, upload
                documents, review requirements and generate prompts.
              </p>
              <p className="mt-2">
                We collect the minimum information needed to operate the workspace. We do not sell
                personal information, and we do not use advertising trackers.
              </p>
            </section>

            <section id="collect" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">2. Information we collect</h2>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--v-ink)]">Account information</h3>
              <p className="mt-1">
                When you create an account we collect your email address, display name and the
                authentication records needed to keep you signed in. Passwords are handled and hashed
                by Supabase Auth. Vector does not receive your plain-text password.
              </p>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--v-ink)]">Project content</h3>
              <p className="mt-1">
                Projects you create, including names and descriptions, uploaded documents, extracted
                requirements, approvals, acceptance criteria, design systems, templates, prompts and
                generated outputs. This content is stored in your workspace so it is available when
                you sign in on another device.
              </p>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--v-ink)]">Payments</h3>
              <p className="mt-1">
                Paid plans are processed by Razorpay. We receive confirmation that a payment
                succeeded, the plan purchased and a payment identifier. We do not store full card,
                UPI or bank details on Vector servers.
              </p>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--v-ink)]">Technical information</h3>
              <p className="mt-1">
                Our hosting provider records standard request metadata such as IP address, browser
                type, requested URL, timestamp and error status for security and reliability. We do
                not run advertising or behavioural analytics.
              </p>
              <h3 className="mt-3 text-[13px] font-semibold text-[var(--v-ink)]">Local browser data</h3>
              <p className="mt-1">
                Some features keep data in your browser: the Supabase session token, interface
                preferences, onboarding state and prompt-analysis history. This data stays on the
                device unless a feature explicitly uploads it.
              </p>
            </section>

            <section id="use" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">3. How we use information</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Create and secure your account and keep you signed in.</li>
                <li>Store, sync and display your projects, documents and prompt history.</li>
                <li>Compile requirements, acceptance criteria and prompts from the content you provide.</li>
                <li>Process plan purchases and maintain entitlement records.</li>
                <li>Protect the service against abuse, debug failures and meet legal obligations.</li>
                <li>Respond to support, privacy and security requests.</li>
              </ul>
              <p className="mt-2">
                We do not use your project content to train a public model, and we do not sell it to
                third parties.
              </p>
            </section>

            <section id="legal-bases" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">4. Legal bases</h2>
              <p className="mt-2">
                Where data-protection law requires a legal basis, we rely on one or more of the
                following: performance of a contract with you (providing the workspace), your consent
                (optional features and communications), our legitimate interests (security,
                reliability and product improvement) and compliance with legal obligations.
              </p>
            </section>

            <section id="sharing" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">5. Sharing and processors</h2>
              <p className="mt-2">We share information only with service providers that help operate the product:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong className="text-[var(--v-ink)]">Supabase</strong> — authentication, Postgres database and private file storage.</li>
                <li><strong className="text-[var(--v-ink)]">Vercel</strong> — hosting, delivery and serverless functions.</li>
                <li><strong className="text-[var(--v-ink)]">Razorpay</strong> — payment processing for paid plans.</li>
                <li><strong className="text-[var(--v-ink)]">Base44</strong> — only when you choose to open the Base44 builder; the embedded page is governed by Base44&rsquo;s own terms.</li>
                <li><strong className="text-[var(--v-ink)]">AI providers</strong> — only if an AI-provider integration is enabled and you choose to send content for analysis.</li>
                <li><strong className="text-[var(--v-ink)]">Google Fonts and jsDelivr</strong> — static assets used to render the interface and the local analysis helper.</li>
              </ul>
              <p className="mt-2">
                We may disclose information if required by law, to protect the service or its users,
                or as part of a merger or acquisition. We do not sell personal information.
              </p>
            </section>

            <section id="retention" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">6. Data retention</h2>
              <p className="mt-2">
                Account and project data are kept while your account is active. If you delete a
                project, its documents and related records are removed from the active workspace.
                Backups and security logs may retain copies for a limited period before they are
                overwritten. Local browser history remains until you clear it or clear your browser
                storage.
              </p>
            </section>

            <section id="security" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">7. Security</h2>
              <p className="mt-2">
                Data is transmitted over HTTPS. Supabase row-level security keeps one account&rsquo;s
                projects separate from another&rsquo;s. The browser receives only the Supabase
                publishable key; service-role keys, payment secrets and signing secrets stay on the
                server and are never included in the client bundle.
              </p>
              <p className="mt-2">
                No method of storage or transmission is completely secure. If you believe your
                account has been compromised, contact us immediately.
              </p>
            </section>

            <section id="rights" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">8. Your rights</h2>
              <p className="mt-2">
                Depending on where you live, you may have the right to access, correct, export or
                delete your personal information, object to or restrict certain processing, or
                withdraw consent. You can delete projects and documents inside the app and clear
                local history from Settings. For account-level requests, contact us using the details
                below.
              </p>
              <p className="mt-2">
                You may also complain to your local data-protection authority.
              </p>
            </section>

            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">9. Cookies and local storage</h2>
              <p className="mt-2">
                Vector does not set advertising or analytics cookies. We use browser storage for the
                authenticated session, interface preferences, onboarding state and local analysis
                history. Signing out removes the session token; clearing site data removes the rest.
              </p>
            </section>

            <section id="transfers" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">10. International transfers</h2>
              <p className="mt-2">
                Our providers may process data in countries other than yours. Where required, we rely
                on appropriate safeguards such as standard contractual clauses offered by those
                providers.
              </p>
            </section>

            <section id="children" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">11. Children</h2>
              <p className="mt-2">
                Vector is a professional product and is not directed at children under 16. We do not
                knowingly collect personal information from children. If you believe a child has
                provided information, contact us and we will remove it.
              </p>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">12. Changes to this policy</h2>
              <p className="mt-2">
                We may update this policy as the product changes. The effective date at the top of
                the page shows the current version. Material changes will be announced in the app or
                by email where appropriate.
              </p>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--v-ink)]">13. Contact</h2>
              <p className="mt-2">
                For privacy questions, account deletion, data export or security reports, email us at{' '}
                <a href="mailto:hello@vector.is-a.dev" className="font-medium text-[var(--v-accent-hover)] hover:underline">
                  hello@vector.is-a.dev
                </a>
                . We aim to respond within a reasonable period.
              </p>
              <p className="mt-2">
                You can also open an issue on the project repository:{' '}
                <a
                  href="https://github.com/Ejajaka/Vector"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--v-accent-hover)] hover:underline"
                >
                  github.com/Ejajaka/Vector
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-4">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--v-accent-hover)]" />
            <p className="text-[11.5px] leading-relaxed text-[var(--v-muted)]">
              This policy applies to the hosted Vector web app. If you run Vector in a local or
              self-hosted environment, the operator of that environment is responsible for the data
              it stores.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};
