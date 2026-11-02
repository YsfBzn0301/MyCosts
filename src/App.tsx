import { useCallback, useMemo, useState } from 'react';
import type { FixedCost, FixedCostValues } from './domain/types';
import { nextDueDate } from './domain/schedule';
import { routeBudget } from './agents/budgetRouter';
import { predictWarnings } from './agents/cashflowPredictor';
import { computeTotals, exportBackup, parseBackup, totalsByCategory } from './agents/uiDataWorker';
import { monthOverview } from './domain/cashflow';
import { useCosts } from './hooks/useCosts';
import { useFinance } from './hooks/useFinance';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { CashflowPanel } from './components/CashflowPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { IncomePanel } from './components/IncomePanel';
import { CostList, type ListItem } from './components/CostList';
import { CostFormDialog } from './components/CostFormDialog';
import { Splash } from './components/Splash';
import { Logo } from './components/Logo';
import { primaryButton } from './components/fieldStyles';

export default function App() {
  const costsState = useCosts();
  const finance = useFinance();
  const { costs, upsert, remove } = costsState;
  const { incomes, settings } = finance;
  const online = useOnlineStatus();
  const { canInstall, install } = useInstallPrompt();
  const [dialog, setDialog] = useState<{ cost: FixedCost | null } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  const today = useMemo(() => new Date(), [costs, incomes, settings]);

  const result = useMemo(() => routeBudget({ today, costs, incomes, settings }), [today, costs, incomes, settings]);
  const warnings = useMemo(() => predictWarnings(result), [result]);
  const monthEntries = useMemo(
    () => monthOverview(costs, today, result.windowEnd),
    [costs, today, result.windowEnd],
  );

  const items: ListItem[] = useMemo(
    () =>
      costs
        .map((cost) => ({ cost, next: nextDueDate(cost, today) }))
        .sort((a, b) => a.next.getTime() - b.next.getTime()),
    [costs, today],
  );
  const totals = useMemo(() => computeTotals(costs), [costs]);
  const groups = useMemo(() => totalsByCategory(costs), [costs]);

  const handleSave = (values: FixedCostValues) => {
    upsert(dialog?.cost?.id ?? null, values);
    setDialog(null);
  };

  const handleDelete = (cost: FixedCost) => {
    if (window.confirm(`„${cost.name}“ wirklich löschen?`)) remove(cost.id);
  };

  const handleExport = () => {
    const blob = new Blob([exportBackup({ costs, incomes, settings })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixkosten-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const backup = parseBackup(await file.text());
    if (!backup) {
      setNotice('Die Datei konnte nicht importiert werden.');
      return;
    }
    if (
      window.confirm(
        `${backup.costs.length} Fixkosten und ${backup.incomes.length} Einnahmen importieren? Aktuelle Daten werden ersetzt.`,
      )
    ) {
      costsState.replaceAll(backup.costs);
      finance.replaceAll(backup.incomes, backup.settings);
      setNotice('Import abgeschlossen.');
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-20 pt-8 sm:px-6">
      {!splashDone && <Splash onDone={finishSplash} />}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Fixkosten & Sparen</h1>
            <p className="text-sm text-slate-500">Was bleibt nach Gehalt und Fixkosten?</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canInstall && (
            <button onClick={install} className="text-sm text-slate-600 hover:text-slate-900">
              App installieren
            </button>
          )}
          <button onClick={() => setDialog({ cost: null })} className={primaryButton}>
            + Fixkosten
          </button>
        </div>
      </header>

      <div className="mt-4 space-y-2 text-sm">
        {!online && <p role="status" className="text-amber-700">Offline. Deine Daten sind weiterhin verfügbar.</p>}
        {(costsState.saveFailed || finance.saveFailed) && (
          <p role="alert" className="text-rose-700">
            Speicher blockiert. Änderungen werden nicht dauerhaft gesichert. Bitte exportiere deine Daten.
          </p>
        )}
        {notice && <p role="status" className="text-emerald-700">{notice}</p>}
      </div>

      <main className="mt-14 space-y-20">
        <CashflowPanel result={result} warnings={warnings} monthEntries={monthEntries} />
        <SettingsPanel settings={settings} onSave={finance.setSettings} />
        <IncomePanel incomes={incomes} onAdd={finance.addIncomeItem} onRemove={finance.removeIncomeItem} />

        <section aria-label="Fixkosten" className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Fixkosten</h2>
          <CostList
            items={items}
            totals={totals}
            groups={groups}
            onCreate={() => setDialog({ cost: null })}
            onEdit={(cost) => setDialog({ cost })}
            onDelete={handleDelete}
          />
        </section>

        <section aria-label="Daten" className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-sm">
          <span className="text-slate-500">Nur auf diesem Gerät gespeichert.</span>
          <button onClick={handleExport} className="text-emerald-700 hover:text-emerald-800">
            Exportieren
          </button>
          <label className="cursor-pointer text-emerald-700 hover:text-emerald-800">
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
