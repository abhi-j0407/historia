import { useState } from 'react';

import type { SiteRank } from '@/core/types';
import { Favicon } from '@/dashboard/components/Favicon';
import { Button } from '@/dashboard/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/dashboard/components/ui/sheet';
import { cn } from '@/dashboard/lib/cn';

const VISIBLE_CHIP_COUNT = 10;

/** Top-site chip row with sheet for remaining sites (UX-PS-01, B-007). */
export function SiteSwitcher({
  topSites,
  selectedApex,
  onSelect,
}: {
  topSites: SiteRank[];
  selectedApex: string;
  onSelect: (apex: string) => void;
}): JSX.Element | null {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (topSites.length === 0) {
    return null;
  }

  const visible = topSites.slice(0, VISIBLE_CHIP_COUNT);
  const overflow = topSites.slice(VISIBLE_CHIP_COUNT);

  const selectFromSheet = (apex: string): void => {
    onSelect(apex);
    setSheetOpen(false);
  };

  return (
    <ul role="tablist" aria-label="Sites" className="flex flex-wrap items-center gap-2">
      {visible.map((site) => (
        <li key={site.apexDomain} role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={site.apexDomain === selectedApex}
            className={cn(
              'focus-visible:ring-ring inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
              site.apexDomain === selectedApex
                ? 'border-foreground bg-muted font-medium'
                : 'border-border bg-background hover:bg-muted/60',
            )}
            onClick={() => onSelect(site.apexDomain)}
          >
            <Favicon apex={site.apexDomain} size={16} />
            <span>{site.apexDomain}</span>
            <span className="text-muted-foreground tabular-nums">{site.totalVisits}</span>
          </button>
        </li>
      ))}
      {overflow.length > 0 ? (
        <li role="presentation">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="rounded-full">
                Show more
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
              <SheetHeader>
                <SheetTitle>All sites</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 flex-1 space-y-1 overflow-y-auto">
                {overflow.map((site) => (
                  <li key={site.apexDomain}>
                    <button
                      type="button"
                      className={cn(
                        'focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none',
                        site.apexDomain === selectedApex
                          ? 'bg-muted font-medium'
                          : 'hover:bg-muted/60',
                      )}
                      onClick={() => selectFromSheet(site.apexDomain)}
                    >
                      <Favicon apex={site.apexDomain} size={32} />
                      <span className="min-w-0 flex-1 truncate">{site.apexDomain}</span>
                      <span className="text-muted-foreground tabular-nums">{site.totalVisits}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      ) : null}
    </ul>
  );
}
