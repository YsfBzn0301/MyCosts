import { Check } from 'lucide-react';
import type { SavingsAccount } from '../domain/types';
import { formatEUR } from '../domain/money';
import { sumPlans } from '../agents/reminderAgent';
import { useI18n } from '../i18n';
import { ghostButton, primaryButton } from './fieldStyles';

interface Props {
  goals: SavingsAccount[];
  safeCents: number;
  checked: string[];
  onToggle: (id: string) => void;
  onBook: () => void;
  onLater: () => void;
}

/** Erinnerung im Dashboard. Ausgewählte Töpfe werden mit ihrem Monatsbetrag gebucht. */
export function ReminderBanner({ goals, safeCents, checked, onToggle, onBook, onLater }: Props) {
  const { t } = useI18n();
  const selected = sumPlans(goals, checked);
  const exceeds = selected > safeCents;
  const canBook = selected > 0 && !exceeds;

  return (
    <section aria-label={t('reminder.bannerTitle')} className="animate-pop rounded-[28px] bg-accent-soft p-6 shadow-soft">
      <p className="text-sm font-medium text-accent">{t('reminder.title')}</p>
      <h2 className="mt-1 text-xl font-semibold">{t('reminder.bannerTitle')}</h2>
      <p className="mt-2 text-sm text-ink/80">
        {safeCents > 0 ? t('reminder.bannerBody', { amount: formatEUR(safeCents) }) : t('reminder.bannerNone')}
      </p>

      {goals.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('reminder.bannerNoGoals')}</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {goals.map((g) => {
            const on = checked.includes(g.id);
            return (
              <li key={g.id}>
                <button
                  onClick={() => onToggle(g.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                    on ? 'bg-surface shadow-soft' : 'bg-surface/50 hover:bg-surface'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      on ? 'scale-105 border-accent bg-accent text-surface' : 'border-line'
                    }`}
                    aria-hidden
                  >
                    {on && <Check size={14} strokeWidth={3} className="animate-pop" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{g.name}</span>
                    <span className="block text-xs text-muted">{t(`goal.kind.${g.kind ?? 'savings'}`)}</span>
                  </span>
                  <span className="tabular-nums">{formatEUR(g.planCents ?? 0)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {goals.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="tabular-nums">{t('reminder.selected', { amount: formatEUR(selected) })}</p>
            {exceeds && <p className="text-danger">{t('reminder.exceeds', { amount: formatEUR(selected - safeCents) })}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onLater} className={ghostButton}>
              {t('reminder.later')}
            </button>
            <button onClick={onBook} disabled={!canBook} className={primaryButton}>
              {t('reminder.book')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

