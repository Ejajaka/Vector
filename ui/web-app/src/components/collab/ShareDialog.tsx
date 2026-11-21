import React, { useMemo, useState } from 'react';
import { Check, Copy, Crown, Link2, Mail, ShieldCheck, UserPlus, X } from 'lucide-react';
import type { Invite, Peer } from '../../services/collab.ts';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  room: string;
  link: string;
  peers: Peer[];
  me: Peer;
  invites: Invite[];
  mode: 'cloud' | 'local';
  onInvite: (email: string, role: 'edit' | 'view') => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  room,
  link,
  peers,
  me,
  invites,
  mode,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'edit' | 'view'>('edit');
  const [copied, setCopied] = useState<'link' | 'room' | null>(null);

  const everyone = useMemo(() => {
    const list: Array<{ id: string; name: string; colour: string; online: boolean; role: string }> = [
      { id: me.id, name: `${me.name} (you)`, colour: me.colour, online: true, role: 'Owner' },
      ...peers.map((peer) => ({ id: peer.id, name: peer.name, colour: peer.colour, online: true, role: 'Editing' })),
      ...invites.map((invite) => ({
        id: invite.id,
        name: invite.email,
        colour: '#64626F',
        online: false,
        role: invite.role === 'edit' ? 'Can edit' : 'Can view',
      })),
    ];
    return list;
  }, [me, peers, invites]);

  if (!open) return null;

  const copy = async (value: string, kind: 'link' | 'room') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    onInvite(value, role);
    setEmail('');
    // Hand the invite to the mail app with the live link already in the body,
    // so the person actually receives access instead of a silent local entry.
    const subject = encodeURIComponent('Edit this project with me on Vector');
    const body = encodeURIComponent(`Open this project in Vector and sign in with this link:\n\n${link}`);
    window.location.href = `mailto:${value}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-[480px] overflow-hidden rounded-xl border border-white/10 bg-[#2C2C2C] text-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)]">
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <h2 className="text-[14px] font-semibold">Share this project</h2>
            <p className="mt-0.5 text-[11px] text-white/45">Everyone in the room sees the same canvas, live.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-white/50 hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invite */}
        <form onSubmit={submit} className="mt-3 px-4">
          <div className="flex items-center gap-1.5">
            <div className="relative min-w-0 flex-1">
              <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Add people by email"
                className="h-9 w-full rounded-md border border-white/10 bg-[#383838] pl-8 pr-2 text-[11.5px] outline-none placeholder:text-white/30 focus:border-[#0D99FF]"
              />
            </div>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as 'edit' | 'view')}
              className="h-9 rounded-md border border-white/10 bg-[#383838] px-2 text-[11px] outline-none"
            >
              <option value="edit">Can edit</option>
              <option value="view">Can view</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[11.5px] font-semibold text-white"
              style={{ background: '#0D99FF' }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
          <p className="mt-1.5 text-[9.5px] leading-relaxed text-white/40">
            Invite opens your mail app with the share link. Only Pro members can join the room.
          </p>
        </form>

        {/* People */}
        <div className="mt-4 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">People with access</p>
          <div className="mt-1.5 max-h-[190px] space-y-1 overflow-y-auto v-scroll pr-1">
            {everyone.map((person) => (
              <div key={person.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-white/5">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                  style={{ background: person.colour, color: '#fff' }}
                >
                  {person.name.replace(/\(you\)/, '').trim().slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] text-white/85">{person.name}</span>
                  <span className="block text-[9.5px] text-white/40">{person.role}</span>
                </span>
                {person.online ? (
                  <span className="flex items-center gap-1 text-[9.5px] font-semibold text-[#6ea8fe]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6ea8fe]" /> Online
                  </span>
                ) : (
                  <span className="text-[9.5px] text-white/30">Invited</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Link */}
        <div className="mt-4 border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <input readOnly value={link} className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-[#383838] px-2 text-[10.5px] text-white/70 outline-none" />
            <button
              type="button"
              onClick={() => void copy(link, 'link')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/15 px-2.5 text-[10.5px] font-semibold text-white/85 hover:bg-white/5"
            >
              {copied === 'link' ? <Check className="h-3 w-3 text-[#6ea8fe]" /> : <Copy className="h-3 w-3" />} Copy
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-md bg-[#383838] px-2 py-1.5">
            <span className="text-[10px] text-white/45">Room ID</span>
            <button type="button" onClick={() => void copy(room, 'room')} className="font-mono text-[10px] text-white/70 hover:text-white">
              {copied === 'room' ? 'copied' : room}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 border-t border-white/10 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
          <div className="min-w-0">
            {mode === 'cloud' ? (
              <>
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#6ea8fe]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6ea8fe]" /> Live across devices
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/45">
                  Anyone who opens this link edits the same canvas in real time — cursors, selections and pages included.
                  They will be asked to sign in first.
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#FFC53D]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFC53D]" /> This device only
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/45">
                  Real-time is running on a local channel: open the link in another tab or window and you will see live
                  cursors. For other people on other machines, connect Supabase (see below) and the same link becomes a
                  shared room.
                </p>
              </>
            )}
          </div>
        </div>

        {peers.length > 0 && (
          <div className="flex items-center gap-1.5 border-t border-white/10 px-4 py-2.5">
            <Crown className="h-3 w-3 text-[#FFC53D]" />
            <span className="text-[10px] text-white/45">
              {peers.length} collaborator{peers.length === 1 ? '' : 's'} editing right now
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
