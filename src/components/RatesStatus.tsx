import { RefreshCw } from 'lucide-react';
import type { FxError } from '../agents/fxConverter';
import { useI18n } from '../i18n';
import { ghostButton } from './fieldStyles';

interface Props {
  hasKey: boolean;
  fetchedAt: number | null;
  loading: boolean;
  error: FxError | null;
  fromCache: boolean;
  onRefresh: () => void;
}

export function RatesStatus({ hasKey, fetchedAt, loading, error, fromCache, onRefresh }: Props) {
  const { t } = useI18n();
  let message = t('assets.ratesNone');
  let tone = 'text-muted';

  if (!hasKey) {
    message = t('assets.ratesNoKey');
  } else if (error) {
    message = t(`assets.ratesError.${error === 'noKey' ? 'invalidKey' : error}`);
    tone = 'text-danger';
  } else if (fetchedAt) {
    message = t('assets.ratesUpdated', { time: new Date(fetchedAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) });
    if (fromCache) message += ` · ${t('assets.ratesCached')}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className={`text-sm ${tone}`}>{message}</p>
      {hasKey && (
        <button onClick={onRefresh} disabled={loading} title={t('assets.refreshHint')} className={`${ghostButton} inline-flex items-center gap-2`}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
          {t('assets.ratesRefresh')}
        </button>
      )}
    </div>
  );
}
