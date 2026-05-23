import { useCallback, useState } from 'react';

import { cn } from '@/dashboard/lib/cn';

const FAVICON_PROXY = 'https://www.google.com/s2/favicons';

function faviconUrl(apex: string, size: 16 | 32 | 64): string {
  const params = new URLSearchParams({ domain: apex, sz: String(size) });
  return `${FAVICON_PROXY}?${params.toString()}`;
}

/** Google favicon proxy with letter-tile fallback (SEC-002). */
export function Favicon({
  apex,
  size = 32,
  className,
}: {
  apex: string;
  size?: 16 | 32 | 64;
  className?: string;
}): JSX.Element {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  const dimension = `${size}px`;
  const letter = apex.charAt(0).toUpperCase() || '?';

  if (failed) {
    return (
      <span
        className={cn(
          'bg-muted text-muted-foreground inline-flex shrink-0 items-center justify-center rounded text-xs font-semibold uppercase',
          className,
        )}
        style={{ width: dimension, height: dimension }}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex shrink-0 overflow-hidden rounded', className)}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src={faviconUrl(apex, size)}
        alt=""
        width={size}
        height={size}
        decoding="async"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleError}
        className="size-full object-cover"
      />
    </span>
  );
}
