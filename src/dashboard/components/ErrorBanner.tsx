import { Button } from '@/dashboard/components/ui/button';
import { Card, CardContent, CardFooter } from '@/dashboard/components/ui/card';

/** E-002 / E-003 — User-facing error surface with optional retry. */
export function ErrorBanner({ onRetry }: { onRetry?: () => void }): JSX.Element {
  return (
    <Card className="border-destructive/50 bg-destructive/5" role="alert" aria-live="assertive">
      <CardContent className="pt-6">
        <p className="text-sm">Couldn&apos;t read your history. Try refreshing.</p>
      </CardContent>
      {onRetry ? (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
