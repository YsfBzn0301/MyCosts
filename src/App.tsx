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
import { SummaryCards } from './components/SummaryCards';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { CostList, type ListItem } from './components/CostList';
import { CostFormDialog } from './components/CostFormDialog';
import { Splash } from './components/Splash';
import { Logo } from './components/Logo';

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

  const result = useMemo(
    () => routeBudget({ today, costs, incomes, settings }),
    [today, costs, incomes, settings],
  );
  const warnings = useMemo(() => predictWarnings(result), [result]);
  const monthEntries = useMemo(() => monthOverview(costs, today, result.windowEnd), [costs, today, result.windowEnd]);

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
    if (window.confirm(`${backup.costs.length} Fixkosten und ${backup.incomes.length} Einnahmen importieren? Aktuelle Daten werden ersetzt.`)) {
      costsState.replaceAll(backup.costs);
      finance.replaceAll(backup.incomes, backup.settings);
      setNotice('Import abgeschlossen.');
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      {!splashDone && <Splash onDone={finishSplash} />}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo className="h-11 w-11 shrink-0 drop-shadow-sm" />
          <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fixkosten & Sparen</h1>
          <p className="text-sm text-slate-500">Was du heute sicher sparen kannst – und was bis zum Gehalt bleiben muss</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canInstall && (
            <button onClick={install} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">
              App installieren
            </button>
          )}
          <button onClick={() => setDialog({ cost: null })} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700">
            + Fixkosten
          </button>
        </div>
      </header>

      <div className="mt-4 space-y-2">
        {!online && (
          <p role="status" className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Offline – deine Daten sind verfügbar.
          </p>
        )}
        {(costsState.saveFailed || finance.saveFailed) && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            Speicher blockiert – Änderungen werden nicht dauerhaft gesichert. Bitte exportiere deine Daten.
          </p>
        )}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{notice}</p>}
      </div>

      <main className="mt-6 space-y-6">
          <CashflowPanel result={result} warnings={warnings} monthEntries={monthEntries} />
          <SettingsPanel settings={settings} onSave={finance.setSettings} />
          <IncomePanel incomes={incomes} onAdd={finance.addIncomeItem} onRemove={finance.removeIncomeItem} />
        <section aria-label="Fixkosten" className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Fixkosten</h2>
          <SummaryCards totals={totals} next={next} />
          <CategoryBreakdown groups={groups} />
          <CostList
            items={items}
            onCreate={() => setDialog({ cost: null })}
            onEdit={(cost) => setDialog({ cost })}
            onDelete={handleDelete}
          />
        </section>
        <section aria-label="Daten" className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">Daten liegen nur auf diesem Gerät.</span>
          <button onClick={handleExport} className="rounded-lg px-3 py-1.5 text-emerald-700 hover:bg-emerald-50">Exportieren</button>
          <label className="cursor-pointer rounded-lg px-3 py-1.5 text-emerald-700 hover:bg-emerald-50">
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
