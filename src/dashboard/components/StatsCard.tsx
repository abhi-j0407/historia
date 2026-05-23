import { Card, CardContent } from '@/dashboard/components/ui/card';

/** Label/value stats grid for view summaries (UX-PS/OV-01). */
export function StatsCard({
  items,
}: {
  items: { label: string; value: string | number }[];
}): JSX.Element {
  return (
    <Card>
      <CardContent className="pt-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-muted-foreground text-sm">{item.label}</dt>
              <dd className="text-lg font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
