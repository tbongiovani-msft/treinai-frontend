import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Spinner, Badge,
} from '@/components/ui';
import { Plus, Target, CheckCircle, Circle, Calendar, Flag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Objetivo } from '@/types';

export function ObjetivosPage() {
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    dataLimite: '',
  });

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }
    loadObjetivos();
  }, [alunoId]);

  const loadObjetivos = () => {
    setLoading(true);
    apiClient.get<Objetivo[]>(`/api/objetivos?alunoId=${alunoId}`)
      .then((r) => setObjetivos(r.data.sort((a, b) => {
        if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;
        return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
      })))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  };

  const toggleConcluido = async (obj: Objetivo) => {
    try {
      await apiClient.put(`/api/objetivos/${obj.id}`, {
        ...obj,
        concluido: !obj.concluido,
        dataConclusao: !obj.concluido ? new Date().toISOString() : undefined,
      });
      loadObjetivos();
    } catch (err) {
      setError(extractApiError(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await apiClient.post('/api/objetivos', {
        alunoId,
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        dataLimite: form.dataLimite || undefined,
      });
      setForm({ titulo: '', descricao: '', dataLimite: '' });
      setShowForm(false);
      loadObjetivos();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const concluidos = objetivos.filter((o) => o.concluido).length;
  const total = objetivos.length;
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  if (loading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Objetivos & Metas</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Novo Objetivo
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {!alunoId && <Alert type="warning" message="Selecione um aluno para ver objetivos." />}

      {/* Progress overview */}
      {total > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Progresso geral</span>
              <span className="font-medium text-gray-900">{concluidos}/{total} ({progresso}%)</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-500 transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* New objective form (inline) */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Novo Objetivo</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="titulo"
                label="Título *"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                required
                placeholder="Ex: Perder 5kg até dezembro"
              />
              <Input
                id="descricao"
                label="Descrição"
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Detalhes e estratégias..."
              />
              <Input
                id="dataLimite"
                label="Data limite"
                type="date"
                value={form.dataLimite}
                onChange={(e) => setForm((p) => ({ ...p, dataLimite: e.target.value }))}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Objetivo'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Objectives list */}
      {alunoId && objetivos.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Nenhum objetivo definido.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {objetivos.map((obj) => {
          const isOverdue = obj.dataLimite && !obj.concluido && new Date(obj.dataLimite) < new Date();
          return (
            <Card key={obj.id} className={obj.concluido ? 'opacity-70' : ''}>
              <CardContent className="flex items-start gap-3 py-4">
                <button
                  onClick={() => toggleConcluido(obj)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {obj.concluido ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300 hover:text-primary-400" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${obj.concluido ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {obj.titulo}
                  </p>
                  {obj.descricao && (
                    <p className="mt-1 text-sm text-gray-500">{obj.descricao}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {obj.dataLimite && (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger-600 font-medium' : 'text-gray-500'}`}>
                        <Calendar className="h-3 w-3" />
                        {isOverdue ? 'Vencido: ' : 'Prazo: '}{formatDate(obj.dataLimite)}
                      </span>
                    )}
                    {obj.concluido && obj.dataConclusao && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Flag className="h-3 w-3" />
                        Concluído em {formatDate(obj.dataConclusao)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={obj.concluido ? 'success' : isOverdue ? 'danger' : 'default'}>
                  {obj.concluido ? 'Concluído' : isOverdue ? 'Atrasado' : 'Pendente'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
