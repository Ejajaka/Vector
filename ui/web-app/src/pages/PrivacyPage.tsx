import React from 'react';
import { ShieldCheck, Lock, Cpu, Clipboard, Users, Mail, Database, Trash2 } from 'lucide-react';

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-xl border border-[#E5E2D8] shadow-xs">
      <div className="flex items-center gap-2 pb-3 border-b border-[#E5E2D8]">
        {icon}
        <h2 className="text-base font-bold text-[#283638]">{title}</h2>
      </div>
      <div className="pt-3 text-sm text-[#283638] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-2 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#283638] tracking-tight">Privacy Policy</h1>
        <p className="text-xs sm:text-sm text-[#737A72] mt-1">
          Last updated: November 19, 2026 · Applies to the Vector web app.
        </p>
      </div>

      <Section icon={<ShieldCheck className="w-4 h-4 text-[#49686C]" />} title="What Vector stores">
        <p>
          You can browse the public site without an account. To create projects and save requirement work, you
          sign in with an email address and password.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account:</strong> your email address and authentication records. Passwords are handled and
            hashed by Supabase Auth; Vector never receives your password.
          </li>
          <li>
            <strong>Project data:</strong> project names and descriptions, uploaded requirement documents,
            extracted requirements, approvals, acceptance criteria, design systems and generated prompts.
          </li>
          <li>
            <strong>Files:</strong> uploaded PDF, DOCX, TXT and Markdown documents are stored in a private Supabase
            Storage bucket.
          </li>
        </ul>
        <p>
          Project data is visible only to your account. Row-level security and private storage policies keep one
          account's projects separate from another's.
        </p>
      </Section>

      <Section icon={<Cpu className="w-4 h-4 text-[#49686C]" />} title="How analysis works">
        <p>
          Prompt review runs in your browser. The BERT model is served from this site, and the prompt you type is
          not sent to an analysis server. Vector uses a local rule helper (Pyodide, downloaded from jsDelivr) to
          assemble the structured result.
        </p>
        <p>
          Prompt evaluation history is stored in your browser's local storage, scoped to the project you selected.
          It is not uploaded to Supabase. Clearing local history in Settings removes it from this browser.
        </p>
        <p>
          Requirement Intelligence and Review &amp; Acceptance read project records from Supabase so the same
          project appears on every device you sign in to.
        </p>
      </Section>

      <Section icon={<Users className="w-4 h-4 text-[#49686C]" />} title="Third parties">
        <p>Vector uses a small number of service providers to run the app:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Supabase</strong> — authentication, Postgres database and private file storage.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and delivery of the web app and BERT model files.
          </li>
          <li>
            <strong>Google Fonts</strong> — the Plus Jakarta Sans and JetBrains Mono typefaces.
          </li>
          <li>
            <strong>jsDelivr</strong> — the Pyodide runtime used by the local rule helper.
          </li>
          <li>
            <strong>Base44</strong> — only when you open the Base44 Workspace. The builder is embedded from
            app.base44.com and is governed by Base44's own terms and privacy policy.
          </li>
        </ul>
        <p>
          Vector does not sell data, run advertising trackers, or use analytics cookies. An optional
          AI-provider integration is not enabled in this deployment; if it is enabled later, only the requirement
          text you choose to review would be sent to that provider.
        </p>
      </Section>

      <Section icon={<Clipboard className="w-4 h-4 text-[#49686C]" />} title="Cookies and local storage">
        <p>
          Vector does not set advertising or analytics cookies. The browser stores your Supabase session token,
          theme preference and local analysis history in <code className="font-mono text-xs">localStorage</code> so
          you stay signed in and keep your preferences. Signing out removes the session token.
        </p>
      </Section>

      <Section icon={<Database className="w-4 h-4 text-[#49686C]" />} title="Your controls">
        <p>
          You can delete projects, design systems and uploaded documents from inside the app. You can clear local
          analysis history in Settings. To delete your account and all associated project data, contact us through
          the repository below.
        </p>
      </Section>

      <Section icon={<Lock className="w-4 h-4 text-[#49686C]" />} title="Security">
        <p>
          The browser receives only Supabase's publishable key. Service-role keys and database credentials stay on
          the server and are never included in the client bundle. Data in transit uses HTTPS.
        </p>
      </Section>

      <Section icon={<Mail className="w-4 h-4 text-[#49686C]" />} title="Contact">
        <p>
          For privacy questions, account deletion or security reports, open an issue on the project repository:{' '}
          <a
            className="text-[#49686C] underline"
            href="https://github.com/Ejajaka/Vector"
            target="_blank"
            rel="noreferrer"
          >
            github.com/Ejajaka/Vector
          </a>
          .
        </p>
      </Section>

      <div className="flex items-start gap-2.5 bg-[#F6F4EC] border border-[#E5E2D8] rounded-xl p-4">
        <Trash2 className="w-4 h-4 text-[#49686C] shrink-0 mt-0.5" />
        <p className="text-xs text-[#737A72] leading-relaxed">
          This policy describes the hosted Vector web app at vector-tau-five.vercel.app.
        </p>
      </div>
    </div>
  );
};
