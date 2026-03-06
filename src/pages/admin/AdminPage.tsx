import { useState, useEffect } from 'react';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, Badge, Spinner, Alert,
} from '@/components/ui';
import { Users, Building2, Search } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import type { Tenant, Usuario } from '@/types';

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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    apiClient.get<Usuario[]>('/api/usuarios')
      .then((r) => setUsuarios(r.data))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}
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
              <Badge variant={roleColor(u.role)}>{u.role}</Badge>
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
