import React, { useEffect } from 'react';
import { Download, Monitor, ShieldCheck, X } from 'lucide-react';
import { WINDOWS_INSTALLER_URL, WINDOWS_INSTALLER_VERSION } from '../../data/downloads.ts';

interface WindowsDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

const RELEASE_PAGE = `https://github.com/Ejajaka/Vector/releases/tag/desktop-v${WINDOWS_INSTALLER_VERSION}`;

/**
 * Confirmation before the 121 MB installer starts. Browsers decide on their own
 * whether to prompt for a download, so the app shows the file details here and
 * makes the download an explicit action instead of a surprise menu click.
 */
export const WindowsDownloadDialog: React.FC<WindowsDownloadDialogProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="windows-download-title">
      <div className="absolute inset-0 bg-[#05060A]/72 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#2B2E3A] bg-[linear-gradient(180deg,#17181E,#0D0E14)] shadow-[0_50px_120px_-30px_#000]">
        <div className="flex items-start gap-3 border-b border-[#24262E] p-5 pb-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#3A3D4A] bg-[#11131A] text-[var(--v-violet2)]">
            <Monitor className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--v-faint)]">Windows desktop app</p>
            <h2 id="windows-download-title" className="mt-1 text-[21px] font-extrabold tracking-[-0.04em] text-[var(--v-ink)]">
              Vector for Windows
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--v-muted)]">
              The full workspace, offline. Same projects, canvas and prompt review, without a browser tab.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#2E313D] text-[var(--v-faint)] hover:bg-[#22252E] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-5 pb-3">
          <div className="rounded-lg border border-[#282B36] bg-[#101218] px-3 py-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--v-faint)]">Version</p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--v-ink)]">{WINDOWS_INSTALLER_VERSION}</p>
          </div>
          <div className="rounded-lg border border-[#282B36] bg-[#101218] px-3 py-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--v-faint)]">Download</p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--v-ink)]">121 MB</p>
          </div>
          <div className="rounded-lg border border-[#282B36] bg-[#101218] px-3 py-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--v-faint)]">System</p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--v-ink)]">Win 10/11</p>
          </div>
        </div>

        <div className="mx-5 flex items-start gap-2 rounded-lg border border-[#2B2E3A] bg-[#0F1117] px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--v-violet2)]" />
          <p className="text-[10px] leading-relaxed text-[var(--v-muted)]">
            Signed installer. Your browser will start a 121 MB download. Windows may ask you to confirm the publisher the
            first time you run it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-5 pt-4">
          <a
            href={WINDOWS_INSTALLER_URL}
            download={`Vector-Setup-${WINDOWS_INSTALLER_VERSION}.exe`}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--violet)] px-4 text-[12px] font-bold text-white shadow-[0_12px_30px_-12px_rgba(113,112,255,.9)] hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Download installer
          </a>
          <a
            href={RELEASE_PAGE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#30333F] px-3.5 text-[11px] font-semibold text-[var(--v-muted)] hover:bg-[#1A1C24] hover:text-white"
          >
            Release page
          </a>
        </div>

        <p className="px-5 pb-4 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
          If the download does not start, use the release page and choose <span className="text-[var(--v-muted)]">Vector-Setup-{WINDOWS_INSTALLER_VERSION}.exe</span>.
        </p>
      </div>
    </div>
  );
};
