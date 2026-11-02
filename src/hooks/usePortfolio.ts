import { useCallback, useEffect, useState } from 'react';
import type { Asset, GoalKind, NetWorthPoint, SavingsAccount, Transaction } from '../domain/types';
import { loadAssets, loadHistory, loadSavings, loadTransactions, saveAssets, saveHistory, saveSavings, saveTransactions } from '../storage/portfolioRepository';
import { addAsset, addSavings, applyTransaction, removeAsset, type NewAsset } from '../agents/portfolioWorker';

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Sparkonten, Bestände, Buchungen und der Vermögensverlauf. */
export function usePortfolio() {
  const [savings, setSavings] = useState<SavingsAccount[]>(() => loadSavings());
  const [assets, setAssets] = useState<Asset[]>(() => loadAssets());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [history, setHistory] = useState<NetWorthPoint[]>(() => loadHistory());

  useEffect(() => void saveSavings(savings), [savings]);
  useEffect(() => void saveAssets(assets), [assets]);
  useEffect(() => void saveTransactions(transactions), [transactions]);
  useEffect(() => void saveHistory(history), [history]);

  const addSavingsAccount = useCallback((name: string, balanceCents: number, kind: GoalKind = 'savings', planCents = 0) => {
    setSavings((prev) => addSavings(prev, name, balanceCents, new Date(), kind, planCents));
  }, []);

  const updateSavingsPlan = useCallback((id: string, planCents: number) => {
    setSavings((prev) => prev.map((a) => (a.id === id ? { ...a, planCents, updatedAt: new Date().toISOString() } : a)));
  }, []);

  const removeSavingsAccount = useCallback((id: string) => {
    setSavings((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateSavingsBalance = useCallback((id: string, balanceCents: number) => {
    setSavings((prev) => prev.map((a) => (a.id === id ? { ...a, balanceCents, updatedAt: new Date().toISOString() } : a)));
  }, []);

  const addAssetItem = useCallback((value: NewAsset) => {
    setAssets((prev) => addAsset(prev, value));
  }, []);

  const removeAssetItem = useCallback((id: string) => {
    setAssets((prev) => removeAsset(prev, id));
  }, []);

  /**
   * Schreibt mehrere Buchungen in einem Schritt. Die Stände werden nacheinander gerechnet,
   * damit eine Überweisung (Girokonto −X, Sparkonto +X) konsistent bleibt.
   */
  const commitTransactions = useCallback(
    (txs: Transaction[], checkingCents: number): { checkingCents: number } => {
      let c = checkingCents;
      let s = savings;
      for (const tx of txs) {
        const r = applyTransaction(tx, c, s);
        c = r.checkingCents;
        s = r.savings;
      }
      setSavings(s);
      setTransactions((prev) => [...[...txs].reverse(), ...prev].slice(0, 500));
      return { checkingCents: c };
    },
    [savings],
  );

  /** Schreibt den Vermögensstand für heute. Pro Tag nur ein Punkt. */
  const recordNetWorth = useCallback((totalCents: number) => {
    const key = todayKey();
    setHistory((prev) => {
      const without = prev.filter((p) => p.date !== key);
      const next = [...without, { date: key, cents: totalCents }].sort((a, b) => a.date.localeCompare(b.date));
      return next.slice(-730);
    });
  }, []);

  return {
    savings,
    assets,
    transactions,
    history,
    addSavingsAccount,
    updateSavingsBalance,
    updateSavingsPlan,
    removeSavingsAccount,
    addAssetItem,
    removeAssetItem,
    commitTransactions,
    recordNetWorth,
    replaceAll: (s: SavingsAccount[], a: Asset[], t: Transaction[], h: NetWorthPoint[]) => {
      setSavings(s);
      setAssets(a);
      setTransactions(t);
      setHistory(h);
    },
  };
}
