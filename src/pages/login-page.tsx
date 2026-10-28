import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole, Mail, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FieldError } from '@/components/shared/feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { errorMessage } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/schemas/forms';
import { defaultRouteForRole, useAuthStore } from '@/stores/auth-store';

const demoAccounts = [
  { label: 'Administrador', email: 'admin@demo.com', password: 'Admin123!' },
  { label: 'Mesero', email: 'mesero@demo.com', password: 'Mesero123!' },
  { label: 'Cocina', email: 'cocina@demo.com', password: 'Cocina123!' },
  { label: 'Cajero', email: 'cajero@demo.com', password: 'Cajero123!' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [serverError, setServerError] = useState<string | null>(null);
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? defaultRouteForRole(user?.role);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@demo.com', password: 'Admin123!' },
  });

  if (accessToken && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const session = await login.mutateAsync(values);
      toast.success(`Bienvenido, ${session.user.fullName.split(' ')[0]}`);
      navigate(defaultRouteForRole(session.user.role), { replace: true });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--sidebar-primary) 38%, transparent), transparent 45%), radial-gradient(circle at 80% 70%, color-mix(in oklab, #f59e0b 18%, transparent), transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <UtensilsCrossed className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Comanda</p>
            <p className="text-xs text-sidebar-foreground/60">Carta, pedidos y caja</p>
          </div>
        </div>

        <div className="relative max-w-lg space-y-5">
          <h1 className="text-4xl font-semibold leading-tight">
            Todo el servicio, en una sola pantalla.
          </h1>
          <p className="text-base text-sidebar-foreground/70">
            Abre mesas, envía pedidos a cocina, avisa cuando un plato está listo y cobra con
            impuestos, propina y pagos mixtos.
          </p>
          <ul className="grid gap-3 text-sm text-sidebar-foreground/80">
            <li>· Mesas y pedidos en tiempo real</li>
            <li>· Cola de cocina y barra por área</li>
            <li>· Cuentas, divisiones y cierre de caja</li>
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/40">
          Comanda API · NestJS + PostgreSQL
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-4 flex justify-center lg:hidden">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-6" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold">Inicia sesión</h2>
            <p className="text-sm text-muted-foreground">
              Usa tu correo y contraseña del restaurante.
            </p>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="size-3.5" /> Correo
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@restaurante.com"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register('email')}
                  />
                  <FieldError message={form.formState.errors.email?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    <LockKeyhole className="size-3.5" /> Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(form.formState.errors.password)}
                    {...form.register('password')}
                  />
                  <FieldError message={form.formState.errors.password?.message} />
                </div>

                {serverError && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  >
                    {serverError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending ? 'Entrando…' : 'Entrar'}
                  {!login.isPending && <ArrowRight />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cuentas demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-between"
                  onClick={() => {
                    form.setValue('email', account.email, { shouldValidate: true });
                    form.setValue('password', account.password, { shouldValidate: true });
                  }}
                >
                  <span>{account.label}</span>
                  <span className="text-xs text-muted-foreground">usar</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
