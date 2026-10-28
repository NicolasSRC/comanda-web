import { ShieldAlert, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/feedback';
import { Button } from '@/components/ui/button';
import { roleLabels } from '@/lib/status';
import { useAuthStore } from '@/stores/auth-store';

export function NoAccessPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-10">
      <EmptyState
        title="No tienes acceso a esta sección"
        description={
          user
            ? `Tu rol actual es ${roleLabels[user.role]}. Pide a un administrador que ajuste tus permisos.`
            : 'Inicia sesión con una cuenta autorizada.'
        }
        icon={<ShieldAlert />}
        action={
          <Button asChild variant="outline">
            <Link to="/">
              <UtensilsCrossed /> Volver a la carta
            </Link>
          </Button>
        }
      />
    </div>
  );
}
