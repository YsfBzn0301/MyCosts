import { CashflowPanel } from '../components/CashflowPanel';
import { CostList, type ListItem } from '../components/CostList';
import { IncomePanel } from '../components/IncomePanel';
import { SettingsPanel } from '../components/SettingsPanel';
import type { CashflowResult, MonthEntry } from '../domain/cashflow';
import type { CategoryTotal, Totals } from '../agents/uiDataWorker';
import type { PredictorWarning } from '../agents/cashflowPredictor';
import type { CashSettings, FixedCost, Income, IncomeValues } from '../domain/types';

interface Props {
  result: CashflowResult;
  warnings: PredictorWarning[];
  monthEntries: MonthEntry[];
  incomes: Income[];
  settings: CashSettings;
  items: ListItem[];
  totals: Totals;
  groups: CategoryTotal[];
  hasSavings: boolean;
  onTransfer: () => void;
  onAddIncome: (v: IncomeValues) => void;
  onRemoveIncome: (id: string) => void;
  onSaveSettings: (s: CashSettings) => void;
  onCreateCost: () => void;
  onEditCost: (c: FixedCost) => void;
  onDeleteCost: (c: FixedCost) => void;
}

export function FixedPage(p: Props) {
  return (
    <div className="space-y-6">
      <CashflowPanel result={p.result} warnings={p.warnings} monthEntries={p.monthEntries} canTransfer={p.result.safeSavingsCents > 0} onTransfer={p.onTransfer} />
      <IncomePanel incomes={p.incomes} onAdd={p.onAddIncome} onRemove={p.onRemoveIncome} />
      <SettingsPanel settings={p.settings} onSave={p.onSaveSettings} />
      <CostList items={p.items} totals={p.totals} groups={p.groups} onCreate={p.onCreateCost} onEdit={p.onEditCost} onDelete={p.onDeleteCost} />
    </div>
  );
}
