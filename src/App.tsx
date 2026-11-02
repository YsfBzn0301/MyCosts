import { useMemo, useState } from 'react';
import type { FixedCost, FixedCostValues } from './domain/types';
import { nextDueDate } from './domain/schedule';
import { useCosts } from './hooks/useCosts';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { computeTotals, exportCostsJson, parseImport, totalsByCategory } from './agents/uiDataWorker';
import { SummaryCards } from './components/SummaryCards';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { CostList, type ListItem } from './components/CostList';
import { CostFormDialog } from './components/CostFormDialog';

export default function App() {
  const { costs, upsert, remove, replaceAll, saveFailed } = useCosts();
  const online = useOnlineStatus();
  const { canInstall, install } = useInstallPrompt();
  const [dialog, setDialog] = useState<{ cost: FixedCost | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const today = useMemo(() => new Date(), [costs]);
  const items: ListItem[] = useMemo(
    () =>
      costs
        .map((cost) => ({ cost, next: nextDueDate(cost, today) }))
        .sort((a, b) => a.next.getTime() - b.next.getTime()),
    [costs, today],
  );
  const totals = useMemo(() => computeTotals(costs), [costs]);
  const groups = useMemo(() => totalsByCategory(costs), [costs]);
  const next = items[0] ? { cost: items[0].cost, date: items[0].next } : null;

  const handleSave = (values: FixedCostValues) => {
    upsert(dialog?.cost?.id ?? null, values);
    setDialog(null);
  };

  const handleDelete = (cost: FixedCost) => {
    if (window.confirm(`„${cost.name}“ wirklich löschen?`)) remove(cost.id);
  };

  const handleExport = () => {
    const blob = new Blob([exportCostsJson(costs)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixkosten-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const list = parseImport(await file.text());
    if (!list) {
      setNotice('Die Datei konnte nicht importiert werden.');
      return;
    }
    if (window.confirm(`${list.length} Posten importieren? Aktuelle Daten werden ersetzt.`)) {
      replaceAll(list);
      setNotice(`${list.length} Posten importiert.`);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fixkosten</h1>
          <p className="text-sm text-slate-500">Deine monatlichen Verpflichtungen auf einen Blick</p>
        </div>
        <div className="flex items-center gap-2">
          {canInstall && (
            <button onClick={install} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">
              App installieren
            </button>
          )}
          <button
            onClick={() => setDialog({ cost: null })}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + Neu
          </button>
        </div>
      </header>

      <div className="mt-4 space-y-2">
        {!online && (
          <p role="status" className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Offline – deine Daten sind weiterhin verfügbar.
          </p>
        )}
        {saveFailed && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            Speicher voll oder blockiert – Änderungen werden nicht dauerhaft gesichert. Bitte exportiere deine Daten.
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-800">
            {notice}
          </p>
        )}
      </div>

      <main className="mt-6 space-y-6">
        <SummaryCards totals={totals} next={next} />
        <CategoryBreakdown groups={groups} />

        <section aria-label="Fixkosten-Liste">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Alle Posten (nach Fälligkeit)</h2>
          <CostList
            items={items}
            onCreate={() => setDialog({ cost: null })}
            onEdit={(cost) => setDialog({ cost })}
            onDelete={handleDelete}
          />
        </section>

        <section aria-label="Daten" className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">Daten liegen nur auf diesem Gerät.</span>
          <button onClick={handleExport} className="rounded-lg px-3 py-1.5 text-indigo-600 hover:bg-indigo-50">
            Exportieren
          </button>
          <label className="cursor-pointer rounded-lg px-3 py-1.5 text-indigo-600 hover:bg-indigo-50">
            Importieren
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </section>
      </main>

      {dialog && <CostFormDialog cost={dialog.cost} onClose={() => setDialog(null)} onSave={handleSave} />}
    </div>
  );
}
