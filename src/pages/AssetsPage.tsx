import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { CURRENCY_CODES, METAL_CODES, assetValueCents, type RateTable } from '../domain/assets';
import { formatEUR } from '../domain/money';
import type { Asset } from '../domain/types';
import { emptyAssetDraft, validateAsset, type AssetDraft, type NewAsset } from '../agents/portfolioWorker';
import { useI18n } from '../i18n';
import { RatesStatus } from '../components/RatesStatus';
import { card, fieldClass, ghostButton, primaryButton } from '../components/fieldStyles';
import type { FxError } from '../agents/fxConverter';

interface Props {
  assets: Asset[];
  rates: RateTable | null;
  apiKey: string | null;
  fetchedAt: number | null;
  loading: boolean;
  error: FxError | null;
  fromCache: boolean;
  onRefresh: () => void;
  onAdd: (value: NewAsset) => void;
  onRemove: (id: string) => void;
  onGoSettings: () => void;
}

export function AssetsPage(p: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AssetDraft>(emptyAssetDraft());
  const [error, setError] = useState<string | null>(null);

  const label = (a: Asset) => (a.kind === 'metal' ? t(`assets.metal.${a.code}`) : a.code);

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = validateAsset(draft);
    if (!r.ok) return setError(t(r.error));
    p.onAdd(r.value);
    setDraft(emptyAssetDraft());
    setError(null);
    setOpen(false);
  }

  const total = p.assets.reduce((s, a) => s + (assetValueCents(a, p.rates) ?? 0), 0);

  return (
    <div className="space-y-6">
      <section aria-label={t('assets.rates')} className={card}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('assets.rates')}</h2>
          <button onClick={p.onGoSettings} className={ghostButton}>
            {t('nav.settings')}
          </button>
        </div>
        <div className="mt-4">
          <RatesStatus hasKey={Boolean(p.apiKey)} fetchedAt={p.fetchedAt} loading={p.loading} error={p.error} fromCache={p.fromCache} onRefresh={p.onRefresh} />
        </div>
        <p className="mt-4 text-xs text-muted">{t('assets.note')}</p>
      </section>

      <section aria-label={t('assets.title')} className={card}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t('assets.title')}</h2>
            {p.rates && p.assets.length > 0 && <p className="mt-1 text-2xl font-semibold tabular-nums text-accent">{formatEUR(total)}</p>}
          </div>
          <button onClick={() => setOpen((v) => !v)} className={ghostButton} aria-expanded={open}>
            {t('assets.addTitle')}
          </button>
        </div>

        {p.assets.length === 0 ? (
          <p className="mt-5 text-sm text-muted">{t('assets.empty')}</p>
        ) : (
          <ul className="mt-5 divide-y divide-line">
            {p.assets.map((a) => {
              const value = assetValueCents(a, p.rates);
              const unit = a.kind === 'metal' ? t(`assets.unit.${a.unit === 'g' ? 'g' : 'oz'}`) : a.code;
              return (
                <li key={a.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p>{label(a)}</p>
                    <p className="text-xs text-muted">
                      {String(a.quantity).replace('.', ',')} {unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">{value === null ? '–' : formatEUR(value)}</span>
                    <button onClick={() => p.onRemove(a.id)} aria-label={t('assets.delete')} className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger">
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {open && (
          <form onSubmit={submit} noValidate className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm text-muted">
              {t('assets.kind')}
              <select className={fieldClass} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as 'metal' | 'currency', code: e.target.value === 'metal' ? 'XAU' : 'USD' })}>
                <option value="metal">{t('assets.kind.metal')}</option>
                <option value="currency">{t('assets.kind.currency')}</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              {draft.kind === 'metal' ? t('assets.metal') : t('assets.currency')}
              <select className={fieldClass} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })}>
                {(draft.kind === 'metal' ? METAL_CODES : CURRENCY_CODES).map((c) => (
                  <option key={c} value={c}>
                    {draft.kind === 'metal' ? t(`assets.metal.${c}`) : c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-muted">
              {t('assets.quantity')}
              <input className={fieldClass} inputMode="decimal" value={draft.quantity} placeholder="10" onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
            </label>
            {draft.kind === 'metal' && (
              <label className="block text-sm text-muted">
                {t('assets.unit')}
                <select className={fieldClass} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as 'g' | 'oz' })}>
                  <option value="g">{t('assets.unit.g')}</option>
                  <option value="oz">{t('assets.unit.oz')}</option>
                </select>
              </label>
            )}
            {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" className={primaryButton}>
                {t('common.add')}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
