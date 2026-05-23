import { useEffect, useState } from 'react';

import type { Aggregate } from '@/core/types';
import { readAggregate, subscribeAggregate } from '@/dashboard/lib/storage-bridge';

/** SW-003a — Aggregate from chrome.storage.local with onChanged subscription. */
export function useAggregate(): { aggregate: Aggregate | null; isInitialLoad: boolean } {
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void readAggregate().then((agg) => {
      if (!cancelled) {
        setAggregate(agg);
        setIsInitialLoad(false);
      }
    });

    const unsubscribe = subscribeAggregate((agg) => {
      if (!cancelled) {
        setAggregate(agg);
        setIsInitialLoad(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { aggregate, isInitialLoad };
}
