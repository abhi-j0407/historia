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
        <TabsList>
          <TabsTrigger value="per-site">Sites</TabsTrigger>
          <TabsTrigger value="overall">Daily</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
        </TabsList>
      </Tabs>
      <Select value={range} onValueChange={(v) => onRangeChange(v as UIPrefs['lastDateRange'])}>
        <SelectTrigger className="w-[180px]" aria-label="Date range">
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
