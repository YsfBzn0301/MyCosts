import { useState } from 'react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../i18n';
import { formatEUR } from '../domain/money';
import type { Slice } from '../domain/portfolio';
import type { NetWorthPoint } from '../domain/types';

const PALETTE = ['#2f6a58', '#a8702a', '#7b8fb8', '#b5657d', '#8aa35a', '#6b6456', '#d1a34a'];

interface Props {
  slices: Slice[];
  labels: Record<string, string>;
  history: NetWorthPoint[];
}

/** Umschalter zwischen Verteilung (Kreis) und Verlauf (Linie). */
export function NetWorthChart({ slices, labels, history }: Props) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'allocation' | 'history'>('allocation');
  const total = slices.reduce((s, x) => s + x.cents, 0);

  return (
    <div>
      <div role="tablist" aria-label={t('dash.chart')} className="inline-flex rounded-2xl bg-canvas p-1 ring-1 ring-line/60">
        {(['allocation', 'history'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === m ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink'
            }`}
          >
            {t(m === 'allocation' ? 'dash.chartAllocation' : 'dash.chartHistory')}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {mode === 'allocation' ? (
          total <= 0 ? (
            <div className="h-56"><Empty text={t('dash.chartAllocationEmpty')} /></div>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={slices} dataKey="cents" nameKey="key" innerRadius="58%" outerRadius="92%" paddingAngle={3} cornerRadius={8} isAnimationActive stroke="none">
                      {slices.map((s, i) => (
                        <Cell key={s.key} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatEUR(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {slices.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="min-w-0 flex-1 truncate text-muted">{labels[s.key] ?? s.key}</span>
                    <span className="tabular-nums text-ink">{Math.round((s.cents / total) * 100)} %</span>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : history.length < 2 ? (
          <div className="h-56"><Empty text={t('dash.chartHistoryEmpty')} /></div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.map((p) => ({ date: p.date, value: p.cents / 100 }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip formatter={(v) => formatEUR(Math.round(Number(v) * 100))} labelFormatter={(d) => String(d)} />
                <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={3} dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-canvas px-6 text-center text-sm text-muted">{text}</div>
  );
}
