import { ArrowLeft, Compass, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-8" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Error 404</p>
        <h1 className="text-3xl font-semibold">Esta página no existe</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Puede que el enlace esté roto o que la página haya cambiado de lugar.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/">
            <UtensilsCrossed /> Ir a la carta
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/login">
            <ArrowLeft /> Iniciar sesión
          </Link>
        </Button>
      </div>
    </div>
  );
}
