import { useEffect, useState } from 'react';

import type { BackfillProgress } from '@/core/types';

const IDLE_PROGRESS: BackfillProgress = {
  phase: 'idle',
  processed: 0,
  total: 0,
  startedAt: 0,
};

const SEED_TIMEOUT_MS = 500;

function isBackfillProgressMessage(
  message: unknown,
): message is { type: 'backfill-progress'; payload: BackfillProgress } {
  return (
    message != null &&
    typeof message === 'object' &&
    'type' in message &&
    (message as { type: string }).type === 'backfill-progress' &&
    'payload' in message
  );
}

/** D-006 — Runtime backfill progress from get-backfill-progress + broadcasts. */
export function useBackfillProgress(): BackfillProgress {
  const [progress, setProgress] = useState<BackfillProgress>(IDLE_PROGRESS);

  useEffect(() => {
    let cancelled = false;
    let seeded = false;

    const seedTimer = window.setTimeout(() => {
      if (!cancelled && !seeded) {
        seeded = true;
        setProgress(IDLE_PROGRESS);
      }
    }, SEED_TIMEOUT_MS);

    const seedFromWorker = async (): Promise<void> => {
      try {
        const response: unknown = await chrome.runtime.sendMessage({
          type: 'get-backfill-progress',
        });
        if (cancelled || seeded) {
          return;
        }
        seeded = true;
        window.clearTimeout(seedTimer);
        if (response != null && typeof response === 'object' && 'phase' in response) {
          setProgress(response as BackfillProgress);
        }
      } catch {
        // Worker may be asleep; 500ms fallback keeps idle default.
      }
    };

    void seedFromWorker();

    const onMessage = (message: unknown): void => {
      if (isBackfillProgressMessage(message)) {
        setProgress(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(onMessage);

    return () => {
      cancelled = true;
      window.clearTimeout(seedTimer);
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  return progress;
}
