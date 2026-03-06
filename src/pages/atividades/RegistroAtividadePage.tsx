import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Badge, Spinner,
} from '@/components/ui';
import { ArrowLeft, Save, CheckCircle, Circle, Plus, Minus } from 'lucide-react';
import type { Treino, DivisaoTreino, SerieExecutada, ExercicioExecutado } from '@/types';

interface SerieForm extends SerieExecutada {}

interface ExercicioForm {
  exercicioId: string;
  nome: string;
  seriesPlanejadas: number;
  repeticoesPlanejadas: string;
  cargaSugerida: string;
  series: SerieForm[];
  observacoes: string;
}

export function RegistroAtividadePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<DivisaoTreino | null>(null);
  const [exercicios, setExercicios] = useState<ExercicioForm[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load treinos do aluno
  useEffect(() => {
    if (!alunoId) {
      setLoading(false);
      return;
    }
    apiClient
      .get<Treino[]>(`/api/treinos?alunoId=${alunoId}`)
      .then((r) => {
        const ativos = r.data.filter((t) => t.ativo);
        setTreinos(ativos);
        if (ativos.length === 1) setTreinoSelecionado(ativos[0]);
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  // When divisão is selected, build exercise form
  useEffect(() => {
    if (!divisaoSelecionada) return;
    setExercicios(
      divisaoSelecionada.exercicios
        .sort((a, b) => a.ordem - b.ordem)
        .map((ex) => ({
          exercicioId: ex.exercicioId,
          nome: ex.nome,
          seriesPlanejadas: ex.series,
          repeticoesPlanejadas: ex.repeticoes,
          cargaSugerida: ex.carga ?? '',
          series: Array.from({ length: ex.series }, (_, i) => ({
            numero: i + 1,
            repeticoes: parseInt(ex.repeticoes) || 12,
            carga: ex.carga ? parseFloat(ex.carga) : undefined,
            concluida: false,
          })),
          observacoes: '',
        }))
    );
  }, [divisaoSelecionada]);

  const totalExercicios = exercicios.length;
  const exerciciosConcluidos = exercicios.filter((ex) =>
    ex.series.every((s) => s.concluida)
  ).length;

  const toggleSerie = (exIdx: number, sIdx: number) => {
    setExercicios((prev) =>
      prev.map((ex, ei) =>
        ei === exIdx
          ? {
              ...ex,
              series: ex.series.map((s, si) =>
                si === sIdx ? { ...s, concluida: !s.concluida } : s
              ),
            }
          : ex
      )
    );
  };

  const updateSerie = (exIdx: number, sIdx: number, field: keyof SerieForm, value: number) => {
    setExercicios((prev) =>
      prev.map((ex, ei) =>
        ei === exIdx
          ? {
              ...ex,
              series: ex.series.map((s, si) =>
                si === sIdx ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  };

  const addSerie = (exIdx: number) => {
    setExercicios((prev) =>
      prev.map((ex, ei) =>
        ei === exIdx
          ? {
              ...ex,
              series: [
                ...ex.series,
                { numero: ex.series.length + 1, repeticoes: 12, concluida: false },
              ],
            }
          : ex
      )
    );
  };

  const removeSerie = (exIdx: number, sIdx: number) => {
    setExercicios((prev) =>
      prev.map((ex, ei) =>
        ei === exIdx
          ? {
              ...ex,
              series: ex.series
                .filter((_, si) => si !== sIdx)
                .map((s, i) => ({ ...s, numero: i + 1 })),
            }
          : ex
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treinoSelecionado || !divisaoSelecionada) return;

    try {
      setSaving(true);
      setError(null);

      const exerciciosExecutados: ExercicioExecutado[] = exercicios.map((ex) => ({
        exercicioId: ex.exercicioId,
        nome: ex.nome,
        concluido: true,
        series: ex.series,
        observacoes: ex.observacoes || undefined,
      }));

      await apiClient.post('/api/atividades', {
        alunoId,
        treinoId: treinoSelecionado.id,
        divisaoNome: divisaoSelecionada.nome,
        dataExecucao: new Date().toISOString(),
        duracaoMinutos: 0,
        observacoes: observacoes || undefined,
        exerciciosExecutados,
      });

      navigate(`/alunos/${alunoId}`);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Atividade</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      {!alunoId && (
        <Alert type="warning" message="Selecione um aluno antes de registrar uma atividade." />
      )}

      {alunoId && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select treino */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">1. Selecionar treino</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {treinos.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum treino ativo encontrado para este aluno.</p>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {treinos.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTreinoSelecionado(t);
                      setDivisaoSelecionada(null);
                    }}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      treinoSelecionado?.id === t.id
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{t.nome}</p>
                    <p className="text-xs text-gray-500">{t.divisoes.length} divisões</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Select divisão */}
          {treinoSelecionado && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">2. Selecionar divisão de hoje</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {treinoSelecionado.divisoes.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDivisaoSelecionada(d)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        divisaoSelecionada?.nome === d.nome
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{d.nome}</p>
                      <p className="text-xs text-gray-500">{d.exercicios.length} exercícios</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Log exercises */}
          {divisaoSelecionada && exercicios.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">3. Registrar séries</h2>
                <Badge variant={exerciciosConcluidos === totalExercicios ? 'success' : 'default'}>
                  {exerciciosConcluidos}/{totalExercicios} concluídos
                </Badge>
              </div>

              {exercicios.map((ex, exIdx) => {
                const allDone = ex.series.every((s) => s.concluida);
                return (
                  <Card key={exIdx} className={allDone ? 'border-green-200 bg-green-50/30' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {allDone ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                          <span className="font-semibold text-gray-900">{ex.nome}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Previsto: {ex.seriesPlanejadas}x{ex.repeticoesPlanejadas}
                          {ex.cargaSugerida && ` @ ${ex.cargaSugerida}`}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Series table */}
                      <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 text-xs font-medium text-gray-500 px-1">
                        <span>Série</span>
                        <span>Reps</span>
                        <span>Carga (kg)</span>
                        <span>OK?</span>
                      </div>
                      {ex.series.map((serie, sIdx) => (
                        <div
                          key={sIdx}
                          className={`grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-lg px-1 py-1 ${
                            serie.concluida ? 'bg-green-50' : ''
                          }`}
                        >
                          <span className="w-8 text-center text-sm font-medium text-gray-600">{serie.numero}</span>
                          <input
                            type="number"
                            min={0}
                            className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500"
                            value={serie.repeticoes}
                            onChange={(e) => updateSerie(exIdx, sIdx, 'repeticoes', parseInt(e.target.value) || 0)}
                          />
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500"
                            value={serie.carga ?? ''}
                            onChange={(e) => updateSerie(exIdx, sIdx, 'carga', parseFloat(e.target.value) || 0)}
                          />
                          <button
                            type="button"
                            onClick={() => toggleSerie(exIdx, sIdx)}
                            className={`rounded-full p-1.5 ${
                              serie.concluida
                                ? 'bg-green-500 text-white'
                                : 'border border-gray-300 text-gray-400 hover:border-green-400'
                            }`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => addSerie(exIdx)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                        >
                          <Plus className="h-3 w-3" /> Série
                        </button>
                        {ex.series.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSerie(exIdx, ex.series.length - 1)}
                            className="flex items-center gap-1 text-xs text-danger-600 hover:text-danger-700"
                          >
                            <Minus className="h-3 w-3" /> Remover última
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Card>
                <CardContent>
                  <Input
                    id="observacoes"
                    label="Observações gerais"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Como foi o treino de hoje?"
                  />
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                  <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Atividade'}
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </form>
      )}
    </div>
  );
}
