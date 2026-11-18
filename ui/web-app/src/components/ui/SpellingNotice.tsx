import React from 'react';
import { SpellCheck } from 'lucide-react';
import { correctSpelling, findSpellingIssues, uniqueSpellingPairs } from '../../services/spelling.ts';

interface SpellingNoticeProps {
  text: string;
  onFix?: (corrected: string) => void;
  className?: string;
}

export const SpellingNotice: React.FC<SpellingNoticeProps> = ({ text, onFix, className = '' }) => {
  const issues = findSpellingIssues(text);
  if (!issues.length) return null;
  const pairs = uniqueSpellingPairs(issues);

  return (
    <div className={`rounded-lg border border-[#FEF08A] bg-[#FEFCE8] px-3 py-2 text-[11px] text-[#856C16] ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <SpellCheck className="w-3.5 h-3.5 shrink-0" />
        <b>{issues.length} possible spelling {issues.length === 1 ? 'issue' : 'issues'}</b>
        <div className="flex flex-wrap gap-1">
          {pairs.map((issue) => (
            <span key={`${issue.from}-${issue.to}`} className="font-mono rounded bg-white/70 border border-[#FEF08A] px-1.5 py-0.5">
              {issue.from} → {issue.to}
            </span>
          ))}
        </div>
        {onFix && (
          <button
            type="button"
            onClick={() => onFix(correctSpelling(text))}
            className="ml-auto rounded-md border border-[#FEF08A] bg-white px-2 py-1 text-[10px] font-bold text-[#856C16] hover:bg-[#FFFDF0]"
          >
            Fix all
          </button>
        )}
      </div>
    </div>
  );
};

export const SpellingHint: React.FC<{ text: string }> = ({ text }) => {
  const issues = findSpellingIssues(text);
  if (!issues.length) return null;
  const pairs = uniqueSpellingPairs(issues, 3);
  return (
    <p className="text-[10px] text-[#856C16] mt-2">
      Spelling: {pairs.map((issue) => `${issue.from} → ${issue.to}`).join(' · ')}
    </p>
  );
};
