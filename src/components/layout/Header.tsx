import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, role, logout } = useAuth();

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    professor: 'Professor',
    aluno: 'Aluno',
  };

  const roleBadgeVariant = {
    admin: 'danger' as const,
    professor: 'info' as const,
    aluno: 'success' as const,
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">{user?.nome ?? 'Usuário'}</p>
            {role && (
              <Badge variant={roleBadgeVariant[role] ?? 'default'}>
                {roleLabels[role] ?? role}
              </Badge>
            )}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {user?.nome ? getInitials(user.nome) : '?'}
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
