import { useCallback, useEffect, useState } from 'react';
import type { FixedCost, FixedCostValues } from '../domain/types';
import { loadCosts, saveCosts } from '../storage/costRepository';
import { addCost, removeCost, updateCost } from '../agents/uiDataWorker';

export function useCosts() {
  const [costs, setCosts] = useState<FixedCost[]>(() => loadCosts());
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveCosts(costs));
  }, [costs]);

  const upsert = useCallback((id: string | null, values: FixedCostValues) => {
    setCosts((prev) => (id ? updateCost(prev, id, values) : addCost(prev, values)));
  }, []);

  const remove = useCallback((id: string) => {
    setCosts((prev) => removeCost(prev, id));
  }, []);

  const replaceAll = useCallback((list: FixedCost[]) => setCosts(list), []);

  return { costs, upsert, remove, replaceAll, saveFailed };
}
