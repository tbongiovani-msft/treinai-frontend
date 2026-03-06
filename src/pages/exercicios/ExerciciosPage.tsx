import { useState, useEffect } from 'react';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Spinner,
} from '@/components/ui';
import { Plus, Search, Dumbbell, Play } from 'lucide-react';
import type { Exercicio } from '@/types';

export function ExerciciosPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    grupoMuscular: '',
    descricao: '',
    linkVideo: '',
  });

  useEffect(() => {
    loadExercicios();
  }, []);

  const loadExercicios = () => {
    apiClient.get<Exercicio[]>('/api/exercicios')
      .then((r) => setExercicios(r.data.sort((a, b) => a.grupoMuscular.localeCompare(b.grupoMuscular) || a.nome.localeCompare(b.nome))))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await apiClient.post('/api/exercicios', {
        nome: form.nome,
        grupoMuscular: form.grupoMuscular,
        descricao: form.descricao || undefined,
        linkVideo: form.linkVideo || undefined,
      });
      setForm({ nome: '', grupoMuscular: '', descricao: '', linkVideo: '' });
      setShowForm(false);
      loadExercicios();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const filtrados = busca
    ? exercicios.filter((e) =>
        e.nome.toLowerCase().includes(busca.toLowerCase()) ||
        e.grupoMuscular.toLowerCase().includes(busca.toLowerCase())
      )
    : exercicios;

  // Group by muscle group
  const grouped = filtrados.reduce<Record<string, Exercicio[]>>((acc, ex) => {
    const group = ex.grupoMuscular || 'Outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {});

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const grupoColors: Record<string, string> = {
    'Peito': 'bg-red-100 text-red-700',
    'Costas': 'bg-blue-100 text-blue-700',
    'Ombros': 'bg-orange-100 text-orange-700',
    'Bíceps': 'bg-green-100 text-green-700',
    'Tríceps': 'bg-purple-100 text-purple-700',
    'Pernas': 'bg-yellow-100 text-yellow-700',
    'Glúteos': 'bg-pink-100 text-pink-700',
    'Abdômen': 'bg-indigo-100 text-indigo-700',
    'Cardio': 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Exercícios</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Novo Exercício
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500"
          placeholder="Buscar por nome ou grupo muscular..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Inline form */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader><h2 className="text-lg font-semibold text-gray-900">Novo Exercício</h2></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input id="nome" label="Nome *" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required placeholder="Ex: Supino Reto" />
                <Input id="grupoMuscular" label="Grupo Muscular *" value={form.grupoMuscular} onChange={(e) => setForm((p) => ({ ...p, grupoMuscular: e.target.value }))} required placeholder="Ex: Peito" />
              </div>
              <Input id="descricao" label="Descrição" value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Dicas de execução..." />
              <Input id="linkVideo" label="Link Vídeo YouTube" value={form.linkVideo} onChange={(e) => setForm((p) => ({ ...p, linkVideo: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>{exercicios.length} exercícios</span>
        <span>{Object.keys(grouped).length} grupos musculares</span>
      </div>

      {/* Grouped list */}
      {Object.entries(grouped).map(([grupo, items]) => (
        <div key={grupo} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${grupoColors[grupo] ?? 'bg-gray-100 text-gray-600'}`}>
              {grupo}
            </span>
            <span className="text-xs text-gray-400">({items.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((ex) => (
              <Card key={ex.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                    <Dumbbell className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{ex.nome}</p>
                    {ex.descricao && <p className="text-xs text-gray-500 truncate">{ex.descricao}</p>}
                  </div>
                  {ex.linkVideo && (
                    <a
                      href={ex.linkVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 rounded p-1.5 text-red-500 hover:bg-red-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play className="h-4 w-4" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
