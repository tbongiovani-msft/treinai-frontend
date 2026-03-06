import { useState, useEffect } from 'react';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, Badge, Spinner, Alert, Button } from '@/components/ui';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Notificacao } from '@/types';

export function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotificacoes();
  }, []);

  const loadNotificacoes = () => {
    apiClient.get<Notificacao[]>('/api/notificacoes')
      .then((r) => setNotificacoes(r.data.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  };

  const marcarLida = async (id: string) => {
    try {
      await apiClient.put(`/api/notificacoes/${id}/lida`);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n))
      );
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const marcarTodasLidas = async () => {
    try {
      await apiClient.put('/api/notificacoes/lidas');
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true, lidaEm: new Date().toISOString() })));
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  if (loading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          {naoLidas > 0 && (
            <Badge variant="danger">{naoLidas} novas</Badge>
          )}
        </div>
        {naoLidas > 0 && (
          <Button variant="outline" size="sm" onClick={marcarTodasLidas}>
            <Check className="h-4 w-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      {notificacoes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Nenhuma notificação.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {notificacoes.map((n) => (
          <Card
            key={n.id}
            className={`transition-colors ${!n.lida ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}
          >
            <CardContent className="flex items-start gap-3 py-3">
              <div className={`mt-1 flex-shrink-0 rounded-full p-1.5 ${!n.lida ? 'bg-primary-100' : 'bg-gray-100'}`}>
                <Bell className={`h-4 w-4 ${!n.lida ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.lida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {n.titulo}
                  </p>
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {formatDateTime(n.criadoEm)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{n.mensagem}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge>{n.tipo}</Badge>
                  {n.linkUrl && (
                    <a href={n.linkUrl} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700">
                      <ExternalLink className="h-3 w-3" /> Ver detalhes
                    </a>
                  )}
                  {!n.lida && (
                    <button
                      onClick={() => marcarLida(n.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
                    >
                      <Check className="h-3 w-3" /> Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
