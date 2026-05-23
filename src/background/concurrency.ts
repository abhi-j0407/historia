/** Hand-rolled promise pool (P-001); no chrome.* — safe in background unit tests. */

interface QueueEntry<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

/** Limits concurrent async work with a FIFO queue; drains on settle including rejection. */
export function pLimit<T>(max: number): (task: () => Promise<T>) => Promise<T> {
  let inFlight = 0;
  const queue: QueueEntry<T>[] = [];

  const drain = (): void => {
    while (inFlight < max && queue.length > 0) {
      const entry = queue.shift()!;
      inFlight += 1;
      entry
        .task()
        .then(entry.resolve, entry.reject)
        .finally(() => {
          inFlight -= 1;
          drain();
        });
    }
  };

  return (task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push({ task, resolve, reject });
      drain();
    });
}
