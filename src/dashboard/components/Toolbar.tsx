import type { UIPrefs } from '@/background/cache';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/dashboard/components/ui/tabs';

/** UX-S-02 / UX-S-03 — View switcher and date-range selector. */
export function Toolbar({
  view,
  range,
  onViewChange,
  onRangeChange,
}: {
  view: UIPrefs['lastView'];
  range: UIPrefs['lastDateRange'];
  onViewChange: (view: UIPrefs['lastView']) => void;
  onRangeChange: (range: UIPrefs['lastDateRange']) => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Tabs value={view} onValueChange={(v) => onViewChange(v as UIPrefs['lastView'])}>
        <TabsList className="bg-surface-elevated h-auto gap-1 rounded-full p-1">
          <TabsTrigger
            value="per-site"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-none"
          >
            Sites
          </TabsTrigger>
          <TabsTrigger
            value="overall"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-none"
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            value="winners"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-none"
          >
            Winners
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Select value={range} onValueChange={(v) => onRangeChange(v as UIPrefs['lastDateRange'])}>
        <SelectTrigger
          className="border-border bg-card w-[180px] rounded-full"
          aria-label="Date range"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
