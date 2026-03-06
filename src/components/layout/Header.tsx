import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui';
import type { Notificacao } from '@/types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    apiClient
      .get<Notificacao[]>('/api/notificacoes')
      .then((res) => setNotificacoes(res.data))
      .catch(() => {/* ignore */});

    // Poll every 60s
    const interval = setInterval(() => {
      apiClient
        .get<Notificacao[]>('/api/notificacoes')
        .then((res) => setNotificacoes(res.data))
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPanel]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/api/notificacoes/${id}/lida`);
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    } catch {/* ignore */}
  };

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
        title="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {showPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <span className="text-sm font-semibold text-gray-900">Notificações</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-600">
                    {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.lida) markAsRead(n.id);
                        if (n.linkUrl) navigate(n.linkUrl);
                        setShowPanel(false);
                      }}
                      className={`w-full border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        !n.lida ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.lida && (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{n.titulo}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.mensagem}</p>
                          <p className="mt-1 text-[10px] text-gray-400">{formatDate(n.criadoEm)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { navigate('/notificacoes'); setShowPanel(false); }}
                className="block w-full border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-primary-600 hover:bg-gray-50"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>

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
