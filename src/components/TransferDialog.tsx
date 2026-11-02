import { useEffect, useRef, useState } from 'react';
import type { SavingsAccount } from '../domain/types';
import { formatEUR } from '../domain/money';
import { useI18n } from '../i18n';
import { fieldClass, ghostButton, primaryButton } from './fieldStyles';

interface Props {
  amountCents: number;
  savings: SavingsAccount[];
  onClose: () => void;
  onConfirm: (savingsId: string) => void;
}

export function TransferDialog({ amountCents, savings, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState(savings[0]?.id ?? '');

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-[28px] bg-surface p-0 text-ink shadow-lift"
    >
      <div className="space-y-5 p-6">
        <h2 className="text-lg font-semibold">{t('fixed.transferTitle')}</h2>
        <p className="text-3xl font-semibold tabular-nums text-accent">{formatEUR(amountCents)}</p>
        {savings.length === 0 ? (
          <p className="text-sm text-muted">{t('fixed.transferNoSavings')}</p>
        ) : (
          <label className="block text-sm text-muted">
            {t('fixed.transferTarget')}
            <select className={fieldClass} value={target} onChange={(e) => setTarget(e.target.value)}>
              {savings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={ghostButton}>
            {t('common.cancel')}
          </button>
          {savings.length > 0 && (
            <button onClick={() => onConfirm(target)} className={primaryButton}>
              {t('common.save')}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
