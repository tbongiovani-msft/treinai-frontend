import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  Activity,
  Apple,
  BarChart3,
  Settings,
  Target,
  Bell,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'professor', 'aluno'] },
  { icon: Users, label: 'Alunos', href: '/alunos', roles: ['admin', 'professor'] },
  { icon: Dumbbell, label: 'Treinos', href: '/treinos', roles: ['admin', 'professor', 'aluno'] },
  { icon: ClipboardList, label: 'Exercícios', href: '/exercicios', roles: ['admin', 'professor'] },
  { icon: Activity, label: 'Atividades', href: '/atividades', roles: ['admin', 'professor', 'aluno'] },
  { icon: Target, label: 'Avaliações', href: '/avaliacoes', roles: ['admin', 'professor', 'aluno'] },
  { icon: Apple, label: 'Nutrição', href: '/nutricao', roles: ['admin', 'professor', 'aluno'] },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'professor'] },
  { icon: Bell, label: 'Notificações', href: '/notificacoes', roles: ['admin', 'professor', 'aluno'] },
  { icon: Shield, label: 'Admin', href: '/admin', roles: ['admin'] },
  { icon: Settings, label: 'Configurações', href: '/configuracoes', roles: ['admin', 'professor', 'aluno'] },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { role } = useAuth();

  const filteredItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">
              trein<span className="text-primary-600">AI</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
              end={item.href === '/'}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
