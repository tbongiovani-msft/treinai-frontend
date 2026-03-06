import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert,
} from '@/components/ui';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import type { Treino, DivisaoTreino, ExercicioTreino, Exercicio } from '@/types';

const emptyExercicio = (): ExercicioTreino => ({
  exercicioId: '',
  nome: '',
  series: 3,
  repeticoes: '12',
  carga: '',
  descanso: '60s',
  metodo: '',
  observacoes: '',
  ordem: 0,
  linkVideo: '',
});

const emptyDivisao = (): DivisaoTreino => ({
  nome: '',
  descricao: '',
  ordem: 0,
  exercicios: [emptyExercicio()],
});

interface TreinoForm {
  nome: string;
  descricao: string;
  alunoId: string;
  dataInicio: string;
  dataFim: string;
  divisoes: DivisaoTreino[];
}

export function TreinoFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDivisao, setExpandedDivisao] = useState<number>(0);
  const [catalogoExercicios, setCatalogoExercicios] = useState<Exercicio[]>([]);

  const [form, setForm] = useState<TreinoForm>({
    nome: '',
    descricao: '',
    alunoId: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    divisoes: [emptyDivisao()],
  });

  // Load exercicio catalog
  useEffect(() => {
    apiClient.get<Exercicio[]>('/api/exercicios').then((r) => setCatalogoExercicios(r.data)).catch(() => {});
  }, []);

  // Load existing treino for editing
  useEffect(() => {
    if (!id) return;
    apiClient.get<Treino>(`/api/treinos/${id}`).then((r) => {
      const t = r.data;
      setForm({
        nome: t.nome,
        descricao: t.descricao ?? '',
        alunoId: t.alunoId,
        dataInicio: t.dataInicio.split('T')[0],
        dataFim: t.dataFim?.split('T')[0] ?? '',
        divisoes: t.divisoes,
      });
    }).catch((err) => setError(extractApiError(err)));
  }, [id]);

  const updateField = useCallback(<K extends keyof TreinoForm>(key: K, value: TreinoForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Divisão methods ──
  const addDivisao = () => {
    setForm((prev) => ({
      ...prev,
      divisoes: [...prev.divisoes, { ...emptyDivisao(), ordem: prev.divisoes.length }],
    }));
    setExpandedDivisao(form.divisoes.length);
  };

  const removeDivisao = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      divisoes: prev.divisoes.filter((_, i) => i !== idx).map((d, i) => ({ ...d, ordem: i })),
    }));
  };

  const updateDivisao = (idx: number, field: keyof DivisaoTreino, value: string) => {
    setForm((prev) => ({
      ...prev,
      divisoes: prev.divisoes.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    }));
  };

  const moveDivisao = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= form.divisoes.length) return;
    setForm((prev) => {
      const divisoes = [...prev.divisoes];
      [divisoes[idx], divisoes[newIdx]] = [divisoes[newIdx], divisoes[idx]];
      return { ...prev, divisoes: divisoes.map((d, i) => ({ ...d, ordem: i })) };
    });
    setExpandedDivisao(newIdx);
  };

  // ── Exercicio methods ──
  const addExercicio = (divIdx: number) => {
    setForm((prev) => ({
      ...prev,
      divisoes: prev.divisoes.map((d, i) =>
        i === divIdx
          ? { ...d, exercicios: [...d.exercicios, { ...emptyExercicio(), ordem: d.exercicios.length }] }
          : d
      ),
    }));
  };

  const removeExercicio = (divIdx: number, exIdx: number) => {
    setForm((prev) => ({
      ...prev,
      divisoes: prev.divisoes.map((d, i) =>
        i === divIdx
          ? { ...d, exercicios: d.exercicios.filter((_, j) => j !== exIdx).map((e, j) => ({ ...e, ordem: j })) }
          : d
      ),
    }));
  };

  const updateExercicio = (divIdx: number, exIdx: number, field: keyof ExercicioTreino, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      divisoes: prev.divisoes.map((d, i) =>
        i === divIdx
          ? {
              ...d,
              exercicios: d.exercicios.map((e, j) =>
                j === exIdx ? { ...e, [field]: value } : e
              ),
            }
          : d
      ),
    }));
  };

  const moveExercicio = (divIdx: number, exIdx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? exIdx - 1 : exIdx + 1;
    setForm((prev) => {
      const divisoes = [...prev.divisoes];
      const exercicios = [...divisoes[divIdx].exercicios];
      if (newIdx < 0 || newIdx >= exercicios.length) return prev;
      [exercicios[exIdx], exercicios[newIdx]] = [exercicios[newIdx], exercicios[exIdx]];
      divisoes[divIdx] = { ...divisoes[divIdx], exercicios: exercicios.map((e, j) => ({ ...e, ordem: j })) };
      return { ...prev, divisoes };
    });
  };

  const selectFromCatalog = (divIdx: number, exIdx: number, exercicio: Exercicio) => {
    updateExercicio(divIdx, exIdx, 'exercicioId', exercicio.id);
    updateExercicio(divIdx, exIdx, 'nome', exercicio.nome);
    if (exercicio.linkVideo) updateExercicio(divIdx, exIdx, 'linkVideo', exercicio.linkVideo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (isEditing) {
        await apiClient.put(`/api/treinos/${id}`, form);
      } else {
        await apiClient.post('/api/treinos', form);
      }
      navigate('/treinos');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Treino' : 'Novo Treino'}
        </h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Informações do treino</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="nome"
              label="Nome do treino *"
              value={form.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              required
              placeholder="Ex: Treino Hipertrofia - Março 2026"
            />
            <Input
              id="descricao"
              label="Descrição"
              value={form.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              placeholder="Objetivo e orientações gerais..."
            />
            <Input
              id="alunoId"
              label="ID do Aluno *"
              value={form.alunoId}
              onChange={(e) => updateField('alunoId', e.target.value)}
              required
              placeholder="ID do aluno"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="dataInicio"
                label="Data início *"
                type="date"
                value={form.dataInicio}
                onChange={(e) => updateField('dataInicio', e.target.value)}
                required
              />
              <Input
                id="dataFim"
                label="Data fim"
                type="date"
                value={form.dataFim}
                onChange={(e) => updateField('dataFim', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Divisões */}
        {form.divisoes.map((divisao, divIdx) => (
          <Card key={divIdx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedDivisao(expandedDivisao === divIdx ? -1 : divIdx)}
                  className="flex items-center gap-2 text-left"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {divisao.nome || `Divisão ${divIdx + 1}`}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({divisao.exercicios.length} exercícios)
                  </span>
                  {expandedDivisao === divIdx ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveDivisao(divIdx, 'up')}
                    disabled={divIdx === 0}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDivisao(divIdx, 'down')}
                    disabled={divIdx === form.divisoes.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {form.divisoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDivisao(divIdx)}
                      className="rounded p-1 text-danger-500 hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedDivisao === divIdx && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Nome da divisão *"
                    value={divisao.nome}
                    onChange={(e) => updateDivisao(divIdx, 'nome', e.target.value)}
                    placeholder="Ex: Treino A - Peito/Tríceps"
                  />
                  <Input
                    label="Descrição"
                    value={divisao.descricao ?? ''}
                    onChange={(e) => updateDivisao(divIdx, 'descricao', e.target.value)}
                    placeholder="Foco e orientações"
                  />
                </div>

                {/* Exercícios */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Exercícios</h4>
                  {divisao.exercicios.map((ex, exIdx) => (
                    <div key={exIdx} className="rounded-lg border border-gray-200 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-300" />
                          <span className="text-xs font-medium text-gray-500">#{exIdx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveExercicio(divIdx, exIdx, 'up')} disabled={exIdx === 0} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                          <button type="button" onClick={() => moveExercicio(divIdx, exIdx, 'down')} disabled={exIdx === divisao.exercicios.length - 1} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                          <button type="button" onClick={() => removeExercicio(divIdx, exIdx)} className="rounded p-1 text-danger-500 hover:bg-danger-50"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Exercício *</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              value={ex.nome}
                              onChange={(e) => updateExercicio(divIdx, exIdx, 'nome', e.target.value)}
                              placeholder="Nome do exercício"
                              list={`catalogo-${divIdx}-${exIdx}`}
                            />
                            <datalist id={`catalogo-${divIdx}-${exIdx}`}>
                              {catalogoExercicios.map((c) => (
                                <option key={c.id} value={c.nome} />
                              ))}
                            </datalist>
                            {catalogoExercicios.length > 0 && (
                              <select
                                className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600"
                                value=""
                                onChange={(e) => {
                                  const found = catalogoExercicios.find((c) => c.id === e.target.value);
                                  if (found) selectFromCatalog(divIdx, exIdx, found);
                                }}
                              >
                                <option value="">Catálogo</option>
                                {catalogoExercicios.map((c) => (
                                  <option key={c.id} value={c.id}>{c.nome} ({c.grupoMuscular})</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                        <Input
                          label="Séries"
                          type="number"
                          min={1}
                          value={ex.series}
                          onChange={(e) => updateExercicio(divIdx, exIdx, 'series', parseInt(e.target.value) || 1)}
                        />
                        <Input
                          label="Repetições"
                          value={ex.repeticoes}
                          onChange={(e) => updateExercicio(divIdx, exIdx, 'repeticoes', e.target.value)}
                          placeholder="12 ou 8-12"
                        />
                        <Input
                          label="Carga"
                          value={ex.carga ?? ''}
                          onChange={(e) => updateExercicio(divIdx, exIdx, 'carga', e.target.value)}
                          placeholder="Ex: 20kg"
                        />
                        <Input
                          label="Descanso"
                          value={ex.descanso ?? ''}
                          onChange={(e) => updateExercicio(divIdx, exIdx, 'descanso', e.target.value)}
                          placeholder="Ex: 60s"
                        />
                        <Input
                          label="Método"
                          value={ex.metodo ?? ''}
                          onChange={(e) => updateExercicio(divIdx, exIdx, 'metodo', e.target.value)}
                          placeholder="Ex: Drop-set, Rest-pause"
                        />
                        <Input
                          label="Link vídeo YouTube"
                          value={ex.linkVideo ?? ''}
                          onChange={(e) => updateExercicio(divIdx, exIdx, 'linkVideo', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <Input
                        label="Observações"
                        value={ex.observacoes ?? ''}
                        onChange={(e) => updateExercicio(divIdx, exIdx, 'observacoes', e.target.value)}
                        placeholder="Dicas de execução..."
                      />
                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={() => addExercicio(divIdx)}>
                    <Plus className="h-4 w-4" /> Adicionar exercício
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button type="button" variant="secondary" onClick={addDivisao} className="w-full">
          <Plus className="h-4 w-4" /> Adicionar Divisão
        </Button>

        {/* Submit */}
        <Card>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Treino'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
