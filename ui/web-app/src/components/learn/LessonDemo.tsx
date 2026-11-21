import React, { useEffect } from 'react';

export type DemoKind = 'project' | 'prompt' | 'elements' | 'templates' | 'billing';

const TITLES: Record<DemoKind, string> = {
  project: 'vector — project setup',
  prompt: 'vector — prompt mode',
  elements: 'vector — canvas',
  templates: 'vector — templates',
  billing: 'vector — plans',
};

const LABELS: Record<DemoKind, string[]> = {
  project: ['Open Projects', 'Pick a template', 'Write one sentence', 'Answer and generate'],
  prompt: ['Open Prompt mode', 'Describe the screen', 'Answer the questions', 'Copy the prompt'],
  elements: ['Open the canvas', 'Choose an element', 'Set label and action', 'Check the states'],
  templates: ['Open Templates', 'Preview a template', 'Open a project', 'Edit the blocks'],
  billing: ['Open plans', 'Choose Pro', 'Pay with Razorpay', 'Receipts in Settings'],
};

interface LessonDemoProps {
  kind: DemoKind;
  activeStep: number;
  onStep: (step: number) => void;
}

const Chip: React.FC<{ children: React.ReactNode; active?: boolean; tone?: 'plain' | 'violet' | 'warm' }> = ({
  children,
  active,
  tone = 'plain',
}) => (
  <span
    className={`inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[7.5px] font-semibold ${
      tone === 'violet'
        ? 'border-[var(--v-violet)]/40 bg-[var(--v-violet)]/12 text-[var(--v-violet)]'
        : tone === 'warm'
          ? 'border-[#FFC53D]/30 bg-[#FFC53D]/10 text-[#e0ab3a]'
          : 'border-[var(--v-line)] bg-[var(--v-surface-2)] text-[var(--v-muted)]'
    } ${active ? 'demo-focus' : ''}`}
  >
    {children}
  </span>
);

const Bar: React.FC<{ w?: string; dim?: boolean }> = ({ w = 'w-full', dim }) => (
  <span className={`block h-1.5 rounded-full ${w} ${dim ? 'bg-[var(--v-line)]' : 'bg-[var(--v-surface-2)]'}`} />
);

const ProjectScene: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex h-full gap-2">
    <div className="w-[40%] shrink-0 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
      <p className="text-[6.5px] font-semibold uppercase tracking-wider text-[var(--v-faint)]">Projects</p>
      <div
        className={`mt-1 rounded px-1.5 py-1 text-[7.5px] font-semibold ${
          step === 0
            ? 'demo-focus bg-[var(--v-violet)]/15 text-[var(--v-ink)]'
            : 'bg-[var(--v-surface-2)] text-[var(--v-muted)]'
        }`}
      >
        + New project
      </div>
      <div className="mt-1.5 space-y-1">
        {['Checkout', 'Dashboard'].map((name) => (
          <div key={name} className="flex items-center gap-1 rounded bg-[var(--v-surface-2)] px-1.5 py-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--v-violet)]/25" />
            <span className="truncate text-[7px] text-[var(--v-muted)]">{name}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="min-w-0 flex-1 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
      {step === 0 && (
        <>
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Start a new project</p>
          <p className="mt-0.5 text-[6.5px] leading-relaxed text-[var(--v-faint)]">Blank canvas or a template</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((cell) => (
              <div key={cell} className="h-7 rounded border border-[var(--v-line)] bg-[var(--v-surface-2)]" />
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Choose a starting point</p>
          <div className="mt-1.5 space-y-1">
            {['SaaS dashboard', 'Checkout flow', 'Customer portal'].map((name, index) => (
              <div
                key={name}
                className={`flex items-center gap-1 rounded border px-1.5 py-1 ${
                  index === 1
                    ? 'demo-focus border-[var(--v-violet)]/60 bg-[var(--v-violet)]/10'
                    : 'border-[var(--v-line)] bg-[var(--v-surface-2)]'
                }`}
              >
                <span className="h-4 w-5 rounded-sm bg-[var(--v-violet)]/20" />
                <span className="truncate text-[7px] text-[var(--v-muted)]">{name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Describe the screen</p>
          <div className="mt-1.5 rounded border border-[var(--v-line)] bg-[var(--v-surface-2)] p-1.5 text-[7px] leading-relaxed text-[var(--v-muted)]">
            A checkout page with a red “Pay now” button
            <span className="demo-caret" />
          </div>
          <div className="mt-1.5 flex items-center justify-end">
            <Chip active tone="violet">Analyse</Chip>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Answer the questions</p>
          <div className="mt-1 space-y-1">
            <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface-2)] p-1">
              <p className="text-[6.5px] text-[var(--v-muted)]">What should “Continue” do?</p>
              <p className="mt-0.5 text-[6.5px] font-semibold text-[var(--v-violet)]">Go to confirmation</p>
            </div>
            <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface-2)] p-1">
              <p className="text-[6.5px] text-[var(--v-muted)]">Which state is missing?</p>
              <p className="mt-0.5 text-[6.5px] font-semibold text-[var(--v-violet)]">Error</p>
            </div>
          </div>
          <div className="mt-1.5 flex justify-end">
            <Chip active tone="violet">Generate prompt</Chip>
          </div>
        </>
      )}
    </div>
  </div>
);

const PromptScene: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex h-full flex-col">
    <div className="flex gap-1 border-b border-[var(--v-line)] pb-1.5">
      <Chip>Canvas</Chip>
      <Chip active={step === 0} tone="violet">Prompt</Chip>
      <span className="ml-auto text-[6.5px] text-[var(--v-faint)]">checkout</span>
    </div>

    <div className="mt-1.5 flex-1">
      {step === 0 && (
        <div className="flex h-full flex-col">
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Describe the screen</p>
          <div className="mt-1 flex-1 rounded border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5 text-[7px] text-[var(--v-faint)]">
            Write what should appear, what it does and when it changes…
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex h-full flex-col">
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Describe the screen</p>
          <div className="demo-focus mt-1 flex-1 rounded border border-[var(--v-violet)]/40 bg-[var(--v-surface)] p-1.5 text-[7px] leading-relaxed text-[var(--v-ink)]">
            A checkout page with a red “Pay now” button and a total.
            <span className="demo-caret" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-1">
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">One quick question</p>
          <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
            <p className="text-[6.5px] leading-relaxed text-[var(--v-muted)]">
              What should “Continue” do after payment?
            </p>
            <div className="mt-1 rounded border border-[var(--v-violet)]/40 bg-[var(--v-violet)]/10 px-1 py-0.5 text-[6.5px] text-[var(--v-violet)]">
              Go to the confirmation screen
            </div>
          </div>
          <div className="flex justify-end">
            <Chip tone="violet">Answer</Chip>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-1">
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Your finished prompt</p>
          <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
            <Bar w="w-11/12" />
            <span className="mt-1 block" />
            <Bar w="w-10/12" dim />
            <span className="mt-1 block" />
            <Bar w="w-7/12" dim />
          </div>
          <div className="flex justify-end">
            <Chip active tone="violet">Copy prompt</Chip>
          </div>
        </div>
      )}
    </div>
  </div>
);

const ElementsScene: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex h-full gap-2">
    <div className="w-[32%] shrink-0 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
      <p className="text-[6.5px] font-semibold uppercase tracking-wider text-[var(--v-faint)]">Elements</p>
      <div className="mt-1 space-y-1">
        {['Button', 'Card', 'Input'].map((name) => (
          <div
            key={name}
            className={`rounded px-1.5 py-0.5 text-[7px] font-semibold ${
              step === 1 && name === 'Button'
                ? 'demo-focus bg-[var(--v-violet)]/15 text-[var(--v-ink)]'
                : 'bg-[var(--v-surface-2)] text-[var(--v-muted)]'
            }`}
          >
            {name}
          </div>
        ))}
      </div>
    </div>

    <div className="min-w-0 flex-1 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
      {(step === 0 || step === 1) && (
        <div className="h-full rounded bg-white p-1.5">
          {step === 0 ? (
            <p className="text-center text-[6.5px] text-[#9aa0a8]">Drag an element here</p>
          ) : (
            <div className="space-y-1.5">
              <div className="h-1.5 w-2/3 rounded-full bg-[#e6e8ec]" />
              <div className="demo-focus inline-flex rounded bg-[#5E6AD2] px-1.5 py-0.5 text-[6.5px] font-semibold text-white">
                Pay now
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-1">
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Inspector</p>
          {[
            ['Label', 'Pay now'],
            ['Action', 'Submit order'],
            ['Colour', '#5E6AD2'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded bg-[var(--v-surface-2)] px-1.5 py-0.5">
              <span className="text-[6.5px] text-[var(--v-faint)]">{label}</span>
              <span className="text-[6.5px] font-semibold text-[var(--v-ink)]">{value}</span>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-1">
          <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">States</p>
          <div className="flex flex-wrap gap-1">
            {['Default', 'Hover', 'Empty', 'Loading', 'Error'].map((name) => (
              <Chip key={name} active={name === 'Error'} tone={name === 'Error' ? 'warm' : 'plain'}>
                {name}
              </Chip>
            ))}
          </div>
          <p className="mt-1 text-[6.5px] leading-relaxed text-[var(--v-faint)]">
            Every state needs a label and a next action.
          </p>
        </div>
      )}
    </div>
  </div>
);

const TemplatesScene: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex h-full flex-col">
    {step === 0 && (
      <>
        <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Template library</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {['Marketing', 'Checkout', 'Portal'].map((name, index) => (
            <div
              key={name}
              className={`rounded border p-1 ${
                index === 1
                  ? 'demo-focus border-[var(--v-violet)]/60 bg-[var(--v-violet)]/10'
                  : 'border-[var(--v-line)] bg-[var(--v-surface-2)]'
              }`}
            >
              <div className="h-7 rounded bg-[var(--v-surface)]" />
              <p className="mt-1 truncate text-[6.5px] text-[var(--v-muted)]">{name}</p>
            </div>
          ))}
        </div>
      </>
    )}

    {step === 1 && (
      <div className="flex-1 rounded border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
        <div className="flex items-center gap-1 border-b border-[var(--v-line)] pb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--v-line-strong)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--v-line-strong)]" />
          <span className="ml-1 text-[6.5px] text-[var(--v-faint)]">preview — checkout</span>
        </div>
        <div className="mt-1.5 space-y-1">
          <Bar w="w-1/2" />
          <div className="grid grid-cols-2 gap-1">
            <div className="h-5 rounded border border-[var(--v-line)] bg-[var(--v-surface-2)]" />
            <div className="h-5 rounded border border-[var(--v-line)] bg-[var(--v-surface-2)]" />
          </div>
          <div className="h-2 w-1/3 rounded bg-[var(--v-violet)]/40" />
        </div>
      </div>
    )}

    {step === 2 && (
      <div className="space-y-1">
        <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Open a project</p>
        <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
          <div className="flex items-center gap-1">
            <span className="h-5 w-5 rounded bg-[var(--v-violet)]/20" />
            <div>
              <p className="text-[7px] font-semibold text-[var(--v-ink)]">Checkout flow</p>
              <p className="text-[6px] text-[var(--v-faint)]">1 page · 6 blocks</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Chip active tone="violet">Use template</Chip>
        </div>
      </div>
    )}

    {step === 3 && (
      <div className="space-y-1">
        <p className="text-[7.5px] font-semibold text-[var(--v-ink)]">Edit what you need</p>
        {['Header', 'Summary', 'Payment'].map((name, index) => (
          <div
            key={name}
            className={`flex items-center justify-between rounded border px-1.5 py-1 ${
              index === 1
                ? 'demo-focus border-[var(--v-violet)]/50 bg-[var(--v-violet)]/10'
                : 'border-[var(--v-line)] bg-[var(--v-surface-2)]'
            }`}
          >
            <span className="text-[6.5px] text-[var(--v-muted)]">{name}</span>
            <span className="text-[6px] text-[var(--v-faint)]">edit</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const BillingScene: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex h-full flex-col">
    <div className="grid grid-cols-2 gap-1.5">
      <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface)] p-1.5">
        <p className="text-[7px] font-semibold text-[var(--v-ink)]">Free</p>
        <p className="text-[6px] text-[var(--v-faint)]">2 projects</p>
        <p className="mt-1 text-[7px] font-semibold text-[var(--v-muted)]">₹0</p>
      </div>
      <div
        className={`rounded border p-1.5 ${
          step >= 1
            ? 'demo-focus border-[var(--v-violet)]/60 bg-[var(--v-violet)]/10'
            : 'border-[var(--v-line)] bg-[var(--v-surface)]'
        }`}
      >
        <p className="text-[7px] font-semibold text-[var(--v-ink)]">Pro</p>
        <p className="text-[6px] text-[var(--v-faint)]">Unlimited</p>
        <p className="mt-1 text-[7px] font-semibold text-[var(--v-violet)]">₹199 / month</p>
      </div>
    </div>

    <div className="mt-1.5 flex-1">
      {step === 0 && (
        <p className="text-[6.5px] leading-relaxed text-[var(--v-faint)]">
          Monthly or yearly. Cancel any time.
        </p>
      )}
      {step === 1 && (
        <div className="flex items-center gap-1 rounded border border-[var(--v-line)] bg-[var(--v-surface)] px-1.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--v-violet)]" />
          <span className="text-[6.5px] text-[var(--v-muted)]">Pro monthly · ₹199</span>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded border border-[var(--v-line)] bg-[var(--v-surface)] px-1.5 py-1">
            <span className="text-[6.5px] text-[var(--v-muted)]">Razorpay</span>
            <span className="text-[6px] text-[var(--v-faint)]">UPI · cards</span>
          </div>
          <div className="demo-focus rounded bg-[#5E6AD2] py-1 text-center text-[7px] font-semibold text-white">
            Pay ₹199
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 rounded border border-[var(--v-violet)]/40 bg-[var(--v-violet)]/10 px-1.5 py-1">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--v-violet)]/20 text-[8px] text-[var(--v-violet)]">
              ✓
            </span>
            <div>
              <p className="text-[6.5px] font-semibold text-[var(--v-ink)]">Pro is active</p>
              <p className="text-[6px] text-[var(--v-faint)]">₹199 · monthly</p>
            </div>
          </div>
          <div className="rounded border border-[var(--v-line)] bg-[var(--v-surface)] px-1.5 py-1">
            <div className="flex items-center justify-between">
              <span className="text-[6.5px] text-[var(--v-muted)]">Receipt saved</span>
              <span className="text-[6.5px] font-semibold text-[var(--v-ink)]">₹199</span>
            </div>
            <p className="mt-0.5 text-[6px] text-[var(--v-faint)]">Settings → Purchase history</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const LessonDemo: React.FC<LessonDemoProps> = ({ kind, activeStep, onStep }) => {
  const labels = LABELS[kind];
  const count = labels.length;
  const step = Math.min(activeStep, count - 1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => onStep((step + 1) % count), 3000);
    return () => window.clearInterval(timer);
  }, [count, onStep, step]);

  const scene =
    kind === 'project' ? (
      <ProjectScene step={step} />
    ) : kind === 'prompt' ? (
      <PromptScene step={step} />
    ) : kind === 'elements' ? (
      <ElementsScene step={step} />
    ) : kind === 'templates' ? (
      <TemplatesScene step={step} />
    ) : (
      <BillingScene step={step} />
    );

  return (
    <div className="lesson-demo relative overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-bg)] p-3">
      <div className="flex items-center gap-1.5 border-b border-[var(--v-line)] pb-2">
        <span className="h-2 w-2 rounded-full bg-[#3a3d44]" />
        <span className="h-2 w-2 rounded-full bg-[#3a3d44]" />
        <span className="h-2 w-2 rounded-full bg-[#3a3d44]" />
        <span className="ml-1 truncate text-[8.5px] text-[var(--v-faint)]">{TITLES[kind]}</span>
        <span className="ml-auto shrink-0 text-[8px] tabular-nums text-[var(--v-faint)]">
          {step + 1}/{count}
        </span>
      </div>

      <div className="mt-2.5 h-[186px]" aria-hidden="true">
        <div key={`${kind}-${step}`} className="lesson-scene h-full">
          {scene}
        </div>
      </div>

      <p className="mt-2 truncate text-[9px] font-medium text-[var(--v-muted)]">
        Step {step + 1} · {labels[step]}
      </p>

      <div className="mt-2 flex items-center gap-1">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => onStep(index)}
            aria-label={`Show step ${index + 1}: ${label}`}
            className={`h-1.5 rounded-full transition-all ${
              index === step ? 'w-5 bg-[var(--v-violet)]' : 'w-1.5 bg-[var(--v-line-strong)] hover:bg-[var(--v-muted)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
