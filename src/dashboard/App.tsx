import { Button } from '@/dashboard/components/ui/button';

export function App(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">historia</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Dashboard scaffold with Tailwind v4 + shadcn primitives.
        </p>
      </header>
      <div>
        <Button>Smoke test button</Button>
      </div>
    </main>
  );
}
