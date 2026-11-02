import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FixedCost, FixedCostValues, GoalKind, Transaction, Theme } from './domain/types';
import { nextDueDate } from './domain/schedule';
import { computeNetWorth } from './domain/portfolio';
import { monthOverview } from './domain/cashflow';
import { routeBudget } from './agents/budgetRouter';
import { predictWarnings } from './agents/cashflowPredictor';
import { computeTotals, exportBackup, parseBackup, totalsByCategory } from './agents/uiDataWorker';
import { CHECKING_ID, type NewAsset } from './agents/portfolioWorker';
import { isDue, plannedGoals, stateFor, sumPlans, type ReminderState } from './agents/reminderAgent';
import { useCosts } from './hooks/useCosts';
import { useFinance } from './hooks/useFinance';
import { usePortfolio } from './hooks/usePortfolio';
import { useFx } from './hooks/useFx';
import { usePrefs } from './hooks/usePrefs';
import { useReminder, showSystemNotification } from './hooks/useReminder';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { I18nProvider, useI18n } from './i18n';
import { formatEUR } from './domain/money';
import { Logo } from './components/Logo';
import { Intro, introAlreadyShown } from './components/Intro';
import { BottomNav, type Tab } from './components/BottomNav';
import { CostFormDialog } from './components/CostFormDialog';
import { TransferDialog } from './components/TransferDialog';
import { ReminderBanner } from './components/ReminderBanner';
import { DashboardPage } from './pages/DashboardPage';
import { FixedPage } from './pages/FixedPage';
import { AssetsPage } from './pages/AssetsPage';
import { SettingsPage } from './pages/SettingsPage';
import { primaryButton } from './components/fieldStyles';
import type { ListItem } from './components/CostList';

export default function App() {
  const prefs = usePrefs();
  return (
    <I18nProvider lang={prefs.prefs.lang} setLang={prefs.setLang}>
      <Shell prefs={prefs} />
    </I18nProvider>
  );
}

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Shell({ prefs }: { prefs: ReturnType<typeof usePrefs> }) {
  const { t } = useI18n();
  const costsState = useCosts();
  const finance = useFinance();
  const portfolio = usePortfolio();
  const fx = useFx(useMemo(() => portfolio.assets.map((a) => a.code), [portfolio.assets]));
  const reminder = useReminder();
  const online = useOnlineStatus();
  const { canInstall, install } = useInstallPrompt();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [dialog, setDialog] = useState<{ cost: FixedCost | null } | null>(null);
  const [transfer, setTransfer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [splashDone, setSplashDone] = useState(() => introAlreadyShown());
  const [dismissed, setDismissed] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  // Uhr für die Erinnerung: jede Minute prüfen, ob sie fällig ist.
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { costs, upsert, remove } = costsState;
  const { incomes, settings } = finance;
  const today = useMemo(() => new Date(), [costs, incomes, settings]);

  const result = useMemo(() => routeBudget({ today, costs, incomes, settings }), [today, costs, incomes, settings]);
  const warnings = useMemo(() => predictWarnings(result), [result]);
  const monthEntries = useMemo(() => monthOverview(costs, today, result.windowEnd), [costs, today, result.windowEnd]);
  const items: ListItem[] = useMemo(
    () => costs.map((cost) => ({ cost, next: nextDueDate(cost, today) })).sort((a, b) => a.next.getTime() - b.next.getTime()),
    [costs, today],
  );
  const totals = useMemo(() => computeTotals(costs), [costs]);
  const groups = useMemo(() => totalsByCategory(costs), [costs]);

  const nw = useMemo(
    () => computeNetWorth({ checkingCents: settings.balanceCents, savings: portfolio.savings, assets: portfolio.assets, rates: fx.rates }),
    [settings.balanceCents, portfolio.savings, portfolio.assets, fx.rates],
  );
  const { recordNetWorth } = portfolio;
  useEffect(() => {
    if (nw.assetsKnown) recordNetWorth(nw.totalCents);
  }, [nw.totalCents, nw.assetsKnown, recordNetWorth]);

  // Erinnerung: fällig, nicht erledigt, und ggf. eine System-Benachrichtigung.
  const payDays = useMemo(() => incomes.map((i) => i.payDay), [incomes]);
  const due = isDue(reminder.config, clock, payDays);
  const remState: ReminderState = stateFor(reminder.state, clock);
  const goals = useMemo(() => plannedGoals(portfolio.savings), [portfolio.savings]);
  const showBanner = reminder.config.enabled && due && !remState.done && !dismissed;

  useEffect(() => {
    if (!due || !reminder.config.notify || remState.notified || reminder.permission !== 'granted') return;
    void showSystemNotification(t('reminder.notifyTitle'), t('reminder.notifyBody', { amount: formatEUR(result.safeSavingsCents) }));
    reminder.setState({ ...remState, notified: true });
    // Bewusst nur bei Fälligkeit und Berechtigung auslösen. `remState` wird über `notified` abgesichert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due, reminder.config.notify, remState.notified, reminder.permission]);

  const toggleGoal = (id: string) => {
    const checked = remState.checked.includes(id) ? remState.checked.filter((x) => x !== id) : [...remState.checked, id];
    reminder.setState({ ...remState, checked });
  };

  const bookGoals = () => {
    const ids = remState.checked.filter((id) => goals.some((g) => g.id === id));
    const total = sumPlans(goals, ids);
    if (total <= 0 || total > result.safeSavingsCents) return;
    const date = isoDate(new Date());
    const txs: Transaction[] = goals
      .filter((g) => ids.includes(g.id))
      .flatMap((g) => [
        { id: crypto.randomUUID(), date, accountId: CHECKING_ID, amountCents: -(g.planCents ?? 0), note: g.name },
        { id: crypto.randomUUID(), date, accountId: g.id, amountCents: g.planCents ?? 0, note: t('fixed.transfer') },
      ]);
    const r = portfolio.commitTransactions(txs, settings.balanceCents);
    finance.setSettings({ ...settings, balanceCents: r.checkingCents });
    reminder.setState({ ...remState, done: true, checked: ids });
    setNotice(t('reminder.booked', { amount: formatEUR(total) }));
    setTimeout(() => setNotice(null), 2600);
  };

  const recordEntry = (tx: Transaction) => {
    const r = portfolio.commitTransactions([tx], settings.balanceCents);
    finance.setSettings({ ...settings, balanceCents: r.checkingCents });
    setNotice(t('dash.entryDone'));
    setTimeout(() => setNotice(null), 2000);
  };

  const confirmTransfer = (savingsId: string) => {
    const amount = result.safeSavingsCents;
    const target = portfolio.savings.find((s) => s.id === savingsId);
    if (!target || amount <= 0) return setTransfer(false);
    const date = isoDate(new Date());
    const out: Transaction = { id: crypto.randomUUID(), date, accountId: CHECKING_ID, amountCents: -amount, note: target.name };
    const inn: Transaction = { id: crypto.randomUUID(), date, accountId: savingsId, amountCents: amount, note: t('fixed.transfer') };
    const r = portfolio.commitTransactions([out, inn], settings.balanceCents);
    finance.setSettings({ ...settings, balanceCents: r.checkingCents });
    setTransfer(false);
    setNotice(t('fixed.transferDone', { amount: formatEUR(amount), name: target.name }));
    setTimeout(() => setNotice(null), 2600);
  };

  const handleSaveCost = (values: FixedCostValues) => {
    upsert(dialog?.cost?.id ?? null, values);
    setDialog(null);
  };
  const handleDeleteCost = (cost: FixedCost) => {
    if (window.confirm(t('fixed.deleteConfirm', { name: cost.name }))) remove(cost.id);
  };
  const handleRemoveSavings = (id: string) => {
    const s = portfolio.savings.find((x) => x.id === id);
    if (s && window.confirm(t('goal.deleteConfirm', { name: s.name }))) portfolio.removeSavingsAccount(id);
  };

  const handleExport = () => {
    const blob = new Blob(
      [exportBackup({ costs, incomes, settings, savings: portfolio.savings, assets: portfolio.assets, transactions: portfolio.transactions, history: portfolio.history })],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixkosten-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const backup = parseBackup(await file.text());
    if (!backup) return setNotice(t('err.importFailed'));
    if (!window.confirm(t('fixed.importConfirm', { costs: backup.costs.length, incomes: backup.incomes.length }))) return;
    costsState.replaceAll(backup.costs);
    finance.replaceAll(backup.incomes, backup.settings);
    portfolio.replaceAll(backup.savings, backup.assets, backup.transactions, backup.history);
    setNotice(t('err.importDone'));
  };

  const storageFailed = costsState.saveFailed || finance.saveFailed;
  const banner = showBanner ? (
    <ReminderBanner
      goals={goals}
      safeCents={result.safeSavingsCents}
      checked={remState.checked}
      onToggle={toggleGoal}
      onBook={bookGoals}
      onLater={() => setDismissed(true)}
    />
  ) : null;

  return (
    <>
    {!splashDone && <Intro onDone={finishSplash} />}
    <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-36 pt-8 sm:px-6">

      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 shrink-0" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{t('app.title')}</h1>
            <p className="text-xs text-muted">{t('app.subtitle')}</p>
          </div>
        </div>
        {tab === 'fixed' && (
          <button onClick={() => setDialog({ cost: null })} className={primaryButton}>
            {t('common.add')}
          </button>
        )}
        {canInstall && tab === 'settings' && (
          <button onClick={install} className="text-sm font-medium text-accent">
            {t('app.install')}
          </button>
        )}
      </header>

      <div className="mt-4 space-y-2 text-sm">
        {!online && <p role="status" className="text-warm">{t('app.offline')}</p>}
        {storageFailed && <p role="alert" className="text-danger">{t('app.storageBlocked')}</p>}
        {notice && <p role="status" className="animate-pop rounded-2xl bg-accent-soft px-4 py-2 text-accent">{notice}</p>}
      </div>

      <main key={tab} className="mt-8 animate-fade-up">
        {tab === 'dashboard' && (
          <DashboardPage
            nw={nw}
            savings={portfolio.savings}
            assets={portfolio.assets}
            transactions={portfolio.transactions}
            history={portfolio.history}
            onRecord={recordEntry}
            onAddSavings={(name, cents, kind: GoalKind, plan) => portfolio.addSavingsAccount(name, cents, kind, plan)}
            onUpdateSavings={portfolio.updateSavingsBalance}
            onUpdatePlan={portfolio.updateSavingsPlan}
            onRemoveSavings={handleRemoveSavings}
            banner={banner}
          />
        )}
        {tab === 'fixed' && (
          <FixedPage
            result={result}
            warnings={warnings}
            monthEntries={monthEntries}
            incomes={incomes}
            settings={settings}
            items={items}
            totals={totals}
            groups={groups}
            hasSavings={portfolio.savings.length > 0}
            onTransfer={() => setTransfer(true)}
            onAddIncome={finance.addIncomeItem}
            onRemoveIncome={finance.removeIncomeItem}
            onSaveSettings={finance.setSettings}
            onCreateCost={() => setDialog({ cost: null })}
            onEditCost={(cost) => setDialog({ cost })}
            onDeleteCost={handleDeleteCost}
          />
        )}
        {tab === 'assets' && (
          <AssetsPage
            assets={portfolio.assets}
            rates={fx.rates}
            apiKey={fx.apiKey}
            fetchedAt={fx.fetchedAt}
            loading={fx.loading}
            error={fx.error}
            fromCache={fx.fromCache}
            onRefresh={() => void fx.refresh(true)}
            onAdd={(v: NewAsset) => portfolio.addAssetItem(v)}
            onRemove={(id: string) => portfolio.removeAssetItem(id)}
            onGoSettings={() => setTab('settings')}
          />
        )}
        {tab === 'settings' && (
          <SettingsPage
            lang={prefs.prefs.lang}
            onLang={prefs.setLang}
            theme={prefs.prefs.theme}
            onTheme={(th: Theme) => prefs.setTheme(th)}
            apiKey={fx.apiKey}
            onSaveKey={fx.setApiKey}
            onRemoveKey={fx.clearApiKey}
            reminder={reminder.config}
            onReminder={reminder.setConfig}
            permission={reminder.permission}
            onRequestPermission={() => void reminder.requestPermission()}
            onExport={handleExport}
            onImport={handleImport}
            notice={notice}
          />
        )}
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      {dialog && <CostFormDialog cost={dialog.cost} onClose={() => setDialog(null)} onSave={handleSaveCost} />}
      {transfer && (
        <TransferDialog amountCents={result.safeSavingsCents} savings={portfolio.savings} onClose={() => setTransfer(false)} onConfirm={confirmTransfer} />
      )}
    </div>
    </>
  );
}

