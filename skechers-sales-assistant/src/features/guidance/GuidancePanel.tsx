// "Sales Guidance" panel (DEMO MODE ONLY). Renders the four-step framework as
// touch-friendly cards with copy-to-clipboard, and a clear DEMO indicator.
import { useState } from 'react';
import type { GuidanceContent } from './types';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${label}`}
      className="flex-none rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function Section({ icon, title, primary, copyText, children }: {
  icon: string;
  title: string;
  primary: string;
  copyText: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span aria-hidden>{icon}</span> {title}
        </span>
        <CopyButton text={copyText} label={title} />
      </div>
      <p className="mt-1 text-sm text-slate-800">{primary}</p>
      {children}
    </div>
  );
}

export function GuidancePanel({ guidance }: { guidance: GuidanceContent }) {
  return (
    <section
      aria-label="Sales guidance"
      data-testid="guidance-panel"
      className="mt-2 flex flex-col gap-2 rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-2"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-700">Sales guidance</span>
        <span
          className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
          title="Synthetic demo guidance — not official Skechers content"
        >
          DEMO
        </span>
      </div>

      <Section icon="❓" title="Discovery question" primary={guidance.discovery_question} copyText={guidance.discovery_question} />

      <Section icon="💡" title="Selling point" primary={guidance.customer_friendly_explanation} copyText={guidance.customer_friendly_explanation}>
        <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Why:</span> {guidance.stored_reason}</p>
        <p className="text-xs text-slate-600"><span className="font-medium">Benefit:</span> {guidance.customer_benefit}</p>
      </Section>

      <Section icon="🛡️" title="Objection handling" primary={guidance.suggested_response} copyText={guidance.suggested_response}>
        <p className="mt-1 text-xs italic text-slate-500">If they say: {guidance.common_objection}</p>
      </Section>

      <Section icon="🎯" title="Closing question" primary={guidance.closing_question} copyText={guidance.closing_question} />

      <p className="px-1 text-[10px] text-slate-400">Demo guidance — synthetic content, for practice only.</p>
    </section>
  );
}
