import { Button } from '@/dashboard/components/ui/button';
import { Card, CardContent, CardFooter } from '@/dashboard/components/ui/card';

/** E-002 / E-003 — User-facing error surface with optional retry. */
export function ErrorBanner({ onRetry }: { onRetry?: () => void }): JSX.Element {
  return (
    <Card
      className="border-destructive/40 bg-destructive/5 shadow-none"
      role="alert"
      aria-live="assertive"
    >
      <CardContent className="pt-6">
        <p className="text-foreground text-sm font-medium">Could not read your history</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Check that historia still has permission, then sync again. Nothing was sent off your
          device.
        </p>
      </CardContent>
      {onRetry ? (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Sync again
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
