import { Card, CardContent } from '@/dashboard/components/ui/card';

/** Label/value stats grid for view summaries (UX-PS/OV-01). */
export function StatsCard({
  items,
}: {
  items: { label: string; value: string | number }[];
}): JSX.Element {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="pt-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="border-border border-t pt-3 first:border-t-0">
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {item.label}
              </dt>
              <dd className="text-foreground mt-1 text-lg font-semibold tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
