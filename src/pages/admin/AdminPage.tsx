import { useState, useEffect } from 'react';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, Badge, Spinner, Alert,
} from '@/components/ui';
import { Users, Building2, Search, ChevronDown, Check } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import type { Tenant, Usuario, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

function TenantsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Tenant[]>('/api/tenants')
      .then((r) => setTenants(r.data))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}
      {tenants.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{t.nome}</p>
              <p className="text-xs text-gray-500">Plano: {t.plano} | Criado em {formatDate(t.criadoEm)}</p>
            </div>
            <Badge variant={t.ativo ? 'success' : 'default'}>
              {t.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsuariosTab() {
  const { user: currentUser, refresh } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Usuario[]>('/api/usuarios')
      .then((r) => setUsuarios(r.data))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (usuario: Usuario, newRole: UserRole) => {
    if (usuario.role === newRole) {
      setRoleMenuOpen(null);
      return;
    }

    setChangingRole(usuario.id);
    setError(null);
    setRoleMenuOpen(null);

    try {
      await apiClient.patch<Usuario>(
        `/api/usuarios/${usuario.id}/role`,
        { role: newRole }
      );

      // Update local state
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, role: newRole } : u))
      );

      setSuccessMsg(`Perfil de ${usuario.nome} alterado para ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 3000);

      // If the admin changed their own role, refresh auth context
      if (currentUser && usuario.id === currentUser.id) {
        await refresh();
      }
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setChangingRole(null);
    }
  };

  if (loading) return <Spinner className="mx-auto mt-10" />;

  const filtrados = busca
    ? usuarios.filter((u) =>
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase())
      )
    : usuarios;

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'professor': return 'warning';
      default: return 'default';
    }
  };

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'professor', label: 'Professor' },
    { value: 'aluno', label: 'Aluno' },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {filtrados.map((u) => (
        <Card key={u.id}>
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {getInitials(u.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{u.nome}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Role change dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(roleMenuOpen === u.id ? null : u.id)}
                  disabled={changingRole === u.id}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50"
                >
                  {changingRole === u.id ? (
                    <svg className="animate-spin h-3.5 w-3.5 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  <Badge variant={roleColor(u.role)}>{u.role}</Badge>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {/* Dropdown menu */}
                {roleMenuOpen === u.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setRoleMenuOpen(null)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {roleOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleRoleChange(u, opt.value)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-gray-50 ${
                            u.role === opt.value ? 'text-primary-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {opt.label}
                          {u.role === opt.value && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Badge variant={u.ativo ? 'success' : 'default'}>
                {u.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState<'tenants' | 'usuarios'>('usuarios');

  const tabs = [
    { key: 'usuarios' as const, label: 'Usuários', icon: Users },
    { key: 'tenants' as const, label: 'Tenants', icon: Building2 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <UsuariosTab />}
      {tab === 'tenants' && <TenantsTab />}
    </div>
  );
}
