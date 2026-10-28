import {
  BarChart3,
  BookOpen,
  ChefHat,
  LogOut,
  Receipt,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/shared/status-badges';
import { useLogout } from '@/hooks/use-auth';
import { useRealtime } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import type { Role } from '@/types/api';
import { roleLabels } from '@/lib/status';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    to: '/app/mesas',
    label: 'Mesas',
    icon: <UtensilsCrossed />,
    roles: ['ADMIN', 'WAITER'],
  },
  {
    to: '/app/cocina',
    label: 'Cocina y barra',
    icon: <ChefHat />,
    roles: ['ADMIN', 'KITCHEN'],
  },
  {
    to: '/app/caja',
    label: 'Caja',
    icon: <Receipt />,
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    to: '/app/reportes',
    label: 'Reportes',
    icon: <BarChart3 />,
    roles: ['ADMIN'],
  },
];

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const logout = useLogout();

  useRealtime(Boolean(user));

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  const onLogout = async () => {
    await logout.mutateAsync();
    toast.success('Sesión cerrada');
    navigate('/login', { replace: true });
  };

  const brand = (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <UtensilsCrossed className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold text-sidebar-foreground">Comanda</p>
        <p className="max-w-40 truncate text-xs text-sidebar-foreground/60">
          {user.restaurant?.name ?? 'Superadmin'}
        </p>
      </div>
    </div>
  );

  const nav = (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:items-stretch lg:gap-1.5">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
      <NavLink
        to="/"
        className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground [&_svg]:size-4"
      >
        <BookOpen />
        <span>Carta pública</span>
      </NavLink>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-4 lg:flex lg:min-h-dvh">
        <div className="space-y-8">
          {brand}
          {nav}
        </div>
        <div className="space-y-3 rounded-xl border border-sidebar-border p-3">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
            <Wifi className="size-3.5 text-emerald-400" />
            Actualización en vivo
          </div>
          <div className="space-y-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.fullName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
            <RoleBadge role={user.role} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onLogout}
            disabled={logout.isPending}
          >
            <LogOut />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b bg-sidebar px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            {brand}
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={onLogout}
              disabled={logout.isPending}
            >
              <LogOut />
              Salir
            </Button>
          </div>
          <div className="mt-3">{nav}</div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
          Comanda · {user.restaurant?.name ?? 'Administración'} ·{' '}
          {roleLabels[user.role]}
        </footer>
      </div>
    </div>
  );
}
