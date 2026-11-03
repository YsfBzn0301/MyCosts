import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { CategoryId } from '../domain/categories';
import { parseAmountToCents } from '../domain/money';
import { formatEUR } from '../domain/money';
import { formatDate } from '../domain/format';
import { computeCashflow } from '../domain/cashflow';
import type { FixedCost, FixedCostValues, Income, IncomeValues } from '../domain/types';
import { validateIncome, type IncomeDraft } from '../agents/budgetRouter';
import { validateDraft, type FormDraft } from '../agents/uiDataWorker';
import { useI18n } from '../i18n';
import { fieldClass, ghostButton, primaryButton } from './fieldStyles';

export interface SetupResult {
  incomes: IncomeValues[];
  costs: FixedCostValues[];
  balanceCents: number;
  monthlySpendCents: number;
}

interface Props {
  onFinish: (r: SetupResult) => void;
  onClose: () => void;
}

const TEMPLATES: Array<{ key: string; category: CategoryId }> = [
  { key: 'rent', category: 'housing' },
  { key: 'electricity', category: 'housing' },
  { key: 'internet', category: 'telecom' },
  { key: 'phone', category: 'telecom' },
  { key: 'insurance', category: 'insurance' },
  { key: 'subscription', category: 'subscriptions' },
];

const STEPS = 4;

interface Pending {
  name: string;
  category: CategoryId;
  amount: string;
  day: string;
}

/** Geführte Ersteinrichtung in vier Schritten. Gespeichert wird erst beim Abschluss. */
export function SetupWizard({ onFinish, onClose }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [incomeDraft, setIncomeDraft] = useState<IncomeDraft>({ name: t('fixed.incomeNamePh'), amount: '', payDay: '1' });
  const [incomeError, setIncomeError] = useState<Partial<Record<keyof IncomeDraft, string>>>({});
  const [incomes, setIncomes] = useState<IncomeValues[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [costs, setCosts] = useState<FixedCostValues[]>([]);
  const [spend, setSpend] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState<string | null>(null);

  const spendCents = parseAmountToCents(spend || '0', { allowZero: true });
  const balanceCents = parseAmountToCents(balance || '0', { allowZero: true, allowNegative: true });

  // Vorschau mit den bisherigen Eingaben. Dieselbe Rechnung wie in der App.
  const preview = useMemo(() => {
    const today = new Date();
    const fakeIncomes: Income[] = incomes.map((v, i) => ({ ...v, id: `i${i}`, createdAt: '', updatedAt: '' }));
    const fakeCosts: FixedCost[] = costs.map((v, i) => ({ ...v, id: `c${i}`, createdAt: '', updatedAt: '' }));
    return computeCashflow({
      today,
      incomes: fakeIncomes,
      costs: fakeCosts,
      settings: { balanceCents: balanceCents ?? 0, monthlySpendCents: spendCents ?? 0, safetyCents: 0 },
    });
  }, [incomes, costs, balanceCents, spendCents]);

  function addIncome() {
    const r = validateIncome(incomeDraft);
    if (!r.ok) return setIncomeError(r.errors);
    setIncomes((prev) => [...prev, r.values]);
    setIncomeDraft({ name: t('fixed.incomeNamePh'), amount: '', payDay: '1' });
    setIncomeError({});
  }

  function addCost() {
    if (!pending) return;
    const draft: FormDraft = {
      name: pending.name,
      amount: pending.amount,
      category: pending.category,
      interval: 'monthly',
      dueDay: pending.day,
      dueMonth: '1',
    };
    const r = validateDraft(draft);
    if (!r.ok) return setPendingError(t(Object.values(r.errors)[0] ?? 'err.required'));
    setCosts((prev) => [...prev, r.values]);
    setPending(null);
    setPendingError(null);
  }

  function next() {
    setError(null);
    if (step === 2 && spendCents === null) return setError(t('err.amountZeroOk'));
    if (step === 3) {
      if (balanceCents === null) return setError(t('err.balance'));
      return onFinish({ incomes, costs, balanceCents, monthlySpendCents: spendCents ?? 0 });
    }
    setStep((s) => s + 1);
  }

  const sumCosts = costs.reduce((s, c) => s + c.amountCents, 0);

  return (
    <div role="dialog" aria-modal="true" aria-label={t('wizard.title')} className="fixed inset-0 z-40 overflow-y-auto bg-canvas">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-10 pt-8 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2" aria-label={t('wizard.step', { n: step + 1, total: STEPS })}>
            {Array.from({ length: STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-accent' : i < step ? 'w-2 bg-accent/60' : 'w-2 bg-line'}`}
              />
            ))}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted hover:bg-accent-soft hover:text-ink" aria-label={t('wizard.close')}>
            <X size={20} aria-hidden />
          </button>
        </header>

        <div key={step} className="animate-fade-up mt-10 flex-1 space-y-6">
          {step === 0 && (
            <>
              <Heading title={t('wizard.s1.title')} hint={t('wizard.s1.hint')} />
              {incomes.length > 0 && (
                <ul className="divide-y divide-line rounded-2xl bg-surface shadow-soft">
                  {incomes.map((i, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span>
                        {i.name} <span className="text-sm text-muted">· {t('fixed.incomeEvery', { day: i.payDay })}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-accent">{formatEUR(i.amountCents)}</span>
                        <button onClick={() => setIncomes((prev) => prev.filter((_, j) => j !== idx))} className="text-muted hover:text-danger" aria-label={t('common.delete')}>
                          <X size={16} aria-hidden />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-1 gap-4 rounded-[28px] bg-surface p-5 shadow-soft sm:grid-cols-[1fr_9rem_7rem]">
                <Field label={t('fixed.incomeName')} error={incomeError.name && t(incomeError.name)}>
                  <input className={fieldClass} value={incomeDraft.name} onChange={(e) => setIncomeDraft({ ...incomeDraft, name: e.target.value })} />
                </Field>
                <Field label={t('fixed.incomeAmount')} error={incomeError.amount && t(incomeError.amount)}>
                  <input className={fieldClass} inputMode="decimal" placeholder="2.850,00" value={incomeDraft.amount} onChange={(e) => setIncomeDraft({ ...incomeDraft, amount: e.target.value })} />
                </Field>
                <Field label={t('fixed.incomePayDay')} error={incomeError.payDay && t(incomeError.payDay)}>
                  <input className={fieldClass} inputMode="numeric" value={incomeDraft.payDay} onChange={(e) => setIncomeDraft({ ...incomeDraft, payDay: e.target.value })} />
                </Field>
                <button onClick={addIncome} className={`${ghostButton} sm:col-span-3`}>
                  {t('wizard.s1.add')}
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Heading title={t('wizard.s2.title')} hint={t('wizard.s2.hint')} />
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => setPending({ name: t(`template.${tpl.key}`), category: tpl.category, amount: '', day: '1' })}
                    className="rounded-full bg-surface px-4 py-2 text-sm font-medium shadow-soft ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-accent"
                  >
                    {t(`template.${tpl.key}`)}
                  </button>
                ))}
                <button
                  onClick={() => setPending({ name: '', category: 'other', amount: '', day: '1' })}
                  className="rounded-full bg-surface px-4 py-2 text-sm font-medium shadow-soft ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-accent"
                >
                  + {t('wizard.s2.custom')}
                </button>
              </div>

              {pending && (
                <div className="animate-pop grid grid-cols-1 gap-4 rounded-[28px] bg-surface p-5 shadow-soft sm:grid-cols-[1fr_8rem_6rem]">
                  <Field label={t('form.name')}>
                    <input className={fieldClass} value={pending.name} onChange={(e) => setPending({ ...pending, name: e.target.value })} />
                  </Field>
                  <Field label={t('form.amount')}>
                    <input className={fieldClass} inputMode="decimal" placeholder="12,99" value={pending.amount} onChange={(e) => setPending({ ...pending, amount: e.target.value })} />
                  </Field>
                  <Field label={t('wizard.s2.day')}>
                    <input className={fieldClass} inputMode="numeric" value={pending.day} onChange={(e) => setPending({ ...pending, day: e.target.value })} />
                  </Field>
                  {pendingError && <p className="text-sm text-danger sm:col-span-3">{pendingError}</p>}
                  <button onClick={addCost} className={`${primaryButton} sm:col-span-3`}>
                    {t('wizard.s2.add')}
                  </button>
                </div>
              )}

              {costs.length === 0 ? (
                <p className="text-sm text-muted">{t('wizard.s2.empty')}</p>
              ) : (
                <>
                  <ul className="divide-y divide-line rounded-2xl bg-surface shadow-soft">
                    {costs.map((c, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span>
                          {c.name} <span className="text-sm text-muted">· {t('fixed.due', { date: `${c.dueDay}.` })}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">{formatEUR(c.amountCents)}</span>
                          <button onClick={() => setCosts((prev) => prev.filter((_, j) => j !== idx))} className="text-muted hover:text-danger" aria-label={t('common.delete')}>
                            <X size={16} aria-hidden />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted">{t('wizard.s2.sum', { amount: formatEUR(sumCosts) })}</p>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Heading title={t('wizard.s3.title')} hint={t('wizard.s3.hint')} />
              <Field label={t('fixed.spend')} error={spend && spendCents === null ? t('err.amountZeroOk') : undefined}>
                <input className={`${fieldClass} text-2xl`} inputMode="decimal" placeholder={t('wizard.s3.example')} value={spend} onChange={(e) => setSpend(e.target.value)} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Heading title={t('wizard.s4.title')} hint={t('wizard.s4.hint')} />
              <Field label={t('fixed.balance')} error={balance && balanceCents === null ? t('err.balance') : undefined}>
                <input className={`${fieldClass} text-2xl`} inputMode="decimal" placeholder="1.500,00" value={balance} onChange={(e) => setBalance(e.target.value)} />
              </Field>
              <Preview
                incomesCount={incomes.length}
                keepCents={preview.restBufferCents}
                freeCents={preview.safeSavingsCents}
                nextDate={preview.nextIncome?.date ?? null}
              />
            </>
          )}
        </div>

        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

        <footer className="mt-10 flex items-center justify-between gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className={`${ghostButton} inline-flex items-center gap-1 disabled:opacity-0`}>
            <ChevronLeft size={16} aria-hidden />
            {t('wizard.back')}
          </button>
          <button onClick={next} className={`${primaryButton} inline-flex items-center gap-2`}>
            {step === STEPS - 1 ? <Check size={16} aria-hidden /> : null}
            {step === STEPS - 1 ? t('wizard.finish') : t('wizard.next')}
            {step < STEPS - 1 && <ChevronRight size={16} aria-hidden />}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Heading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-muted">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

function Preview({ incomesCount, keepCents, freeCents, nextDate }: { incomesCount: number; keepCents: number; freeCents: number; nextDate: Date | null }) {
  const { t } = useI18n();
  if (incomesCount === 0) {
    return <p className="rounded-2xl bg-warm-soft px-4 py-3 text-sm text-warm">{t('wizard.preview.noIncome')}</p>;
  }
  return (
    <div className="animate-pop space-y-4 rounded-[28px] bg-accent p-6 text-surface shadow-soft">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs opacity-80">{t('wizard.preview.keep')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatEUR(keepCents)}</p>
        </div>
        <div>
          <p className="text-xs opacity-80">{t('wizard.preview.free')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatEUR(freeCents)}</p>
        </div>
      </div>
      {nextDate && <p className="text-sm opacity-90">{t('wizard.preview.until', { date: formatDate(nextDate) })}</p>}
      <p className="text-xs opacity-80">{t('wizard.preview.hint')}</p>
    </div>
  );
}
