import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, Button, Alert } from '@/components/ui';
import { User, Bell, Palette, Save } from 'lucide-react';

export function ConfiguracoesPage() {
  const { user, role } = useAuth();
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState({
    notificacoesEmail: true,
    notificacoesPush: false,
    temaEscuro: false,
    idioma: 'pt-BR',
  });

  const handleSave = () => {
    // In a real app, save to API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {saved && <Alert type="success" message="Configurações salvas com sucesso!" />}

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium text-gray-900">{user?.nome ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email ?? '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <div className="mt-1 flex gap-2">
              {role && (
                <span className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-700">
                  {role}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Notificações por e-mail</span>
            <input
              type="checkbox"
              checked={prefs.notificacoesEmail}
              onChange={(e) => setPrefs((p) => ({ ...p, notificacoesEmail: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Notificações push</span>
            <input
              type="checkbox"
              checked={prefs.notificacoesPush}
              onChange={(e) => setPrefs((p) => ({ ...p, notificacoesPush: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Aparência</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Tema escuro</span>
            <input
              type="checkbox"
              checked={prefs.temaEscuro}
              onChange={(e) => setPrefs((p) => ({ ...p, temaEscuro: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Idioma</label>
            <select
              value={prefs.idioma}
              onChange={(e) => setPrefs((p) => ({ ...p, idioma: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4" /> Salvar Configurações
      </Button>
    </div>
  );
}
