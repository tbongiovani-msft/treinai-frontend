import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Badge, Spinner, Timer, RestTimer,
} from '@/components/ui';
import { useTimer } from '@/hooks/useTimer';
import {
  ArrowLeft, Play, Square, CheckCircle, Circle, Plus, Minus, Trophy, Clock,
} from 'lucide-react';
import type { Treino, DivisaoTreino, ExercicioExecutado, SerieExecutada } from '@/types';

// ── Local state types ──

interface SerieForm {
  numero: number;
  repeticoes: number;
  carga?: number;
  concluida: boolean;
}

interface ExercicioCheckIn {
  exercicioId: string;
  nome: string;
  seriesPlanejadas: number;
  repeticoesPlanejadas: string;
  cargaSugerida: string;
  descansoSegundos?: number;
  linkVideo?: string;
  series: SerieForm[];
  status: 'pendente' | 'em_andamento' | 'concluido';
  inicioExercicio?: string;
  fimExercicio?: string;
  duracaoSegundos?: number;
  observacoes: string;
}

type CheckInStep = 'selecao' | 'treino' | 'resumo';

// ── localStorage keys ──

const STORAGE_PREFIX = 'treinai_checkin_';
const CHECKIN_STATE_KEY = STORAGE_PREFIX + 'state';

interface CheckInPersisted {
  treinoId: string;
  divisaoNome: string;
  alunoId: string;
  exercicios: ExercicioCheckIn[];
  inicioEm: string;
  observacoes: string;
}

function loadCheckInState(): CheckInPersisted | null {
  try {
    const raw = localStorage.getItem(CHECKIN_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCheckInState(state: CheckInPersisted) {
  localStorage.setItem(CHECKIN_STATE_KEY, JSON.stringify(state));
}

function clearCheckInState() {
  localStorage.removeItem(CHECKIN_STATE_KEY);
  // Also clear all exercise timer keys
  Object.keys(localStorage)
    .filter(k => k.startsWith('treinai_timer_ex-'))
    .forEach(k => localStorage.removeItem(k));
  // Clear workout timer
  localStorage.removeItem('treinai_timer_checkin-workout');
}

// ── Component ──

export function CheckInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [step, setStep] = useState<CheckInStep>('selecao');
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState<DivisaoTreino | null>(null);
  const [exercicios, setExercicios] = useState<ExercicioCheckIn[]>([]);
  const [exercicioAtualIdx, setExercicioAtualIdx] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [inicioEm, setInicioEm] = useState<string | null>(null);
  const [fimEm, setFimEm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workout-level timer
  const workoutTimer = useTimer({ storageKey: 'checkin-workout' });

  // ── Resume existing check-in? ──
  useEffect(() => {
    const persisted = loadCheckInState();
    if (persisted && persisted.alunoId === alunoId) {
      setExercicios(persisted.exercicios);
      setInicioEm(persisted.inicioEm);
      setObservacoes(persisted.observacoes);
      setStep('treino');
      // Find the first non-completed exercise
      const current = persisted.exercicios.findIndex(e => e.status !== 'concluido');
      setExercicioAtualIdx(current >= 0 ? current : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load treinos ──
  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }
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

  // ── Persist state on changes ──
  useEffect(() => {
    if (step !== 'treino' || !treinoSelecionado || !divisaoSelecionada) return;
    saveCheckInState({
      treinoId: treinoSelecionado.id,
      divisaoNome: divisaoSelecionada.nome,
      alunoId,
      exercicios,
      inicioEm: inicioEm ?? new Date().toISOString(),
      observacoes,
    });
  }, [exercicios, observacoes, step, treinoSelecionado, divisaoSelecionada, alunoId, inicioEm]);

  // ── Build exercise list when divisão is selected ──
  const handleIniciarTreino = () => {
    if (!divisaoSelecionada) return;
    const exList: ExercicioCheckIn[] = divisaoSelecionada.exercicios
      .sort((a, b) => a.ordem - b.ordem)
      .map((ex) => ({
        exercicioId: ex.exercicioId,
        nome: ex.nome,
        seriesPlanejadas: ex.series,
        repeticoesPlanejadas: ex.repeticoes ?? '12',
        cargaSugerida: ex.carga ?? '',
        descansoSegundos: ex.descansoSegundos,
        linkVideo: ex.linkVideo,
        series: Array.from({ length: ex.series }, (_, i) => ({
          numero: i + 1,
          repeticoes: parseInt(ex.repeticoes ?? '12') || 12,
          carga: ex.carga ? parseFloat(ex.carga) : undefined,
          concluida: false,
        })),
        status: 'pendente',
        observacoes: '',
      }));

    const now = new Date().toISOString();
    setExercicios(exList);
    setInicioEm(now);
    setExercicioAtualIdx(0);
    setStep('treino');
    workoutTimer.start();
  };

  // ── Exercise timer handlers ──
  const handleIniciarExercicio = (idx: number) => {
    setExercicios(prev => prev.map((ex, i) =>
      i === idx ? { ...ex, status: 'em_andamento', inicioExercicio: new Date().toISOString() } : ex
    ));
    setExercicioAtualIdx(idx);
  };

  const handleConcluirExercicio = useCallback((idx: number, duracaoSegundos: number) => {
    setExercicios(prev => prev.map((ex, i) =>
      i === idx ? {
        ...ex,
        status: 'concluido',
        fimExercicio: new Date().toISOString(),
        duracaoSegundos,
        series: ex.series.map(s => ({ ...s, concluida: true })),
      } : ex
    ));
    // Move to next pending exercise
    setExercicioAtualIdx(prev => {
      const next = (prev ?? 0) + 1;
      return next < (exercicios?.length ?? 0) ? next : null;
    });
  }, [exercicios?.length]);

  // ── Series handlers ──
  const toggleSerie = (exIdx: number, sIdx: number) => {
    setExercicios(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, series: ex.series.map((s, si) => si === sIdx ? { ...s, concluida: !s.concluida } : s) }
        : ex
    ));
  };

  const updateSerie = (exIdx: number, sIdx: number, field: 'repeticoes' | 'carga', value: number) => {
    setExercicios(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, series: ex.series.map((s, si) => si === sIdx ? { ...s, [field]: value } : s) }
        : ex
    ));
  };

  const addSerie = (exIdx: number) => {
    setExercicios(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, series: [...ex.series, { numero: ex.series.length + 1, repeticoes: 12, concluida: false }] }
        : ex
    ));
  };

  const removeSerie = (exIdx: number) => {
    setExercicios(prev => prev.map((ex, ei) =>
      ei === exIdx && ex.series.length > 1
        ? { ...ex, series: ex.series.slice(0, -1).map((s, i) => ({ ...s, numero: i + 1 })) }
        : ex
    ));
  };

  // ── Finalizar treino ──
  const handleFinalizarTreino = async () => {
    if (!treinoSelecionado || !divisaoSelecionada) return;

    const fim = new Date().toISOString();
    setFimEm(fim);
    workoutTimer.stop();

    const duracaoMinutos = Math.round(workoutTimer.elapsedSeconds / 60);

    const exerciciosExecutados: ExercicioExecutado[] = exercicios.map((ex) => ({
      exercicioId: ex.exercicioId,
      nome: ex.nome,
      concluido: ex.status === 'concluido',
      inicioExercicio: ex.inicioExercicio,
      fimExercicio: ex.fimExercicio,
      duracaoSegundos: ex.duracaoSegundos,
      series: ex.series as SerieExecutada[],
      observacoes: ex.observacoes || undefined,
    }));

    try {
      setSaving(true);
      setError(null);

      await apiClient.post('/api/atividades', {
        alunoId,
        treinoId: treinoSelecionado.id,
        divisaoNome: divisaoSelecionada.nome,
        dataExecucao: inicioEm,
        inicioEm,
        fimEm: fim,
        duracaoMinutos,
        status: 'concluido',
        observacoes: observacoes || undefined,
        exerciciosExecutados,
      });

      clearCheckInState();
      setStep('resumo');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Stats for resumo ──
  const totalExercicios = exercicios.length;
  const exerciciosConcluidos = exercicios.filter(ex => ex.status === 'concluido').length;
  const duracaoTotal = workoutTimer.elapsedSeconds;

  if (loading) return <Spinner className="mx-auto mt-20" />;

  // ── STEP: Resumo final ──
  if (step === 'resumo') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <Trophy className="h-16 w-16 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">Treino Concluído!</h1>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{exerciciosConcluidos}/{totalExercicios}</p>
                <p className="text-xs text-gray-500">Exercícios</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  {Math.floor(duracaoTotal / 60)}min
                </p>
                <p className="text-xs text-gray-500">Duração</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  {exercicios.reduce((acc, ex) => acc + ex.series.filter(s => s.concluida).length, 0)}
                </p>
                <p className="text-xs text-gray-500">Séries</p>
              </div>
            </div>

            <hr />

            {exercicios.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {ex.status === 'concluido'
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <Circle className="h-4 w-4 text-gray-300" />}
                  <span className="font-medium">{ex.nome}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  {ex.duracaoSegundos && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(ex.duracaoSegundos / 60)}:{String(ex.duracaoSegundos % 60).padStart(2, '0')}
                    </span>
                  )}
                  <span>{ex.series.filter(s => s.concluida).length}/{ex.series.length} séries</span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate(`/atividades`)}>
              Ver histórico
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── STEP: Seleção de treino/divisão ──
  if (step === 'selecao') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Check-in de Treino</h1>
        </div>

        {error && <Alert type="error" message={error} />}
        {!alunoId && <Alert type="warning" message="Selecione um aluno antes de iniciar o check-in." />}

        {alunoId && (
          <>
            {/* Select treino */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Selecionar treino</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {treinos.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum treino ativo encontrado.</p>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {treinos.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setTreinoSelecionado(t); setDivisaoSelecionada(null); }}
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

            {/* Select divisão */}
            {treinoSelecionado && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Divisão de hoje</h2>
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
                        <p className="text-xs text-gray-500">
                          {d.descricao ?? `${d.exercicios.length} exercícios`}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
                {divisaoSelecionada && (
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleIniciarTreino}>
                      <Play className="h-4 w-4" />
                      Iniciar Treino
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // ── STEP: Treino em andamento ──
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header with global timer */}
      <div className="sticky top-0 z-10 -mx-4 bg-white/95 backdrop-blur px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {divisaoSelecionada?.nome ?? 'Treino'}
            </h1>
            <p className="text-xs text-gray-500">
              {exerciciosConcluidos}/{totalExercicios} exercícios concluídos
            </p>
          </div>
          <Timer
            storageKey="checkin-workout"
            size="lg"
            displayOnly
            className="text-right"
          />
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300 rounded-full"
            style={{ width: `${totalExercicios > 0 ? (exerciciosConcluidos / totalExercicios) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Exercise cards */}
      {exercicios.map((ex, exIdx) => {
        const isActive = ex.status === 'em_andamento';
        const isDone = ex.status === 'concluido';
        const isPending = ex.status === 'pendente';
        const isCurrent = exIdx === exercicioAtualIdx;

        return (
          <Card
            key={exIdx}
            className={`transition-all ${
              isDone ? 'border-green-200 bg-green-50/30 opacity-75' :
              isActive ? 'border-primary-300 ring-2 ring-primary-100' :
              isCurrent ? 'border-blue-200' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDone
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : isActive
                    ? <div className="h-5 w-5 rounded-full bg-primary-500 animate-pulse" />
                    : <Circle className="h-5 w-5 text-gray-300" />}
                  <span className="font-semibold text-gray-900">{ex.nome}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {ex.seriesPlanejadas}x{ex.repeticoesPlanejadas}
                  {ex.cargaSugerida && ` @ ${ex.cargaSugerida}kg`}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Exercise timer control */}
              {isPending && isCurrent && (
                <div className="flex justify-center py-2">
                  <Button onClick={() => handleIniciarExercicio(exIdx)}>
                    <Play className="h-4 w-4" /> Iniciar exercício
                  </Button>
                </div>
              )}

              {isActive && (
                <Timer
                  storageKey={`ex-${exIdx}`}
                  size="sm"
                  label="Tempo do exercício"
                  onStop={(secs) => handleConcluirExercicio(exIdx, secs)}
                />
              )}

              {isDone && ex.duracaoSegundos != null && (
                <p className="text-center text-sm text-green-600 font-medium">
                  Concluído em {Math.floor(ex.duracaoSegundos / 60)}:{String(ex.duracaoSegundos % 60).padStart(2, '0')}
                </p>
              )}

              {/* Link to video */}
              {ex.linkVideo && (
                <a
                  href={ex.linkVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 underline hover:text-primary-800"
                >
                  Ver vídeo demonstrativo
                </a>
              )}

              {/* Series table — show when active or pending current */}
              {(isActive || (isPending && isCurrent) || isDone) && (
                <>
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
                        className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        value={serie.repeticoes}
                        disabled={isDone}
                        onChange={(e) => updateSerie(exIdx, sIdx, 'repeticoes', parseInt(e.target.value) || 0)}
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        value={serie.carga ?? ''}
                        disabled={isDone}
                        onChange={(e) => updateSerie(exIdx, sIdx, 'carga', parseFloat(e.target.value) || 0)}
                      />
                      <button
                        type="button"
                        disabled={isDone}
                        onClick={() => toggleSerie(exIdx, sIdx)}
                        className={`rounded-full p-1.5 ${
                          serie.concluida
                            ? 'bg-green-500 text-white'
                            : 'border border-gray-300 text-gray-400 hover:border-green-400'
                        } disabled:cursor-not-allowed`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {isActive && (
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
                          onClick={() => removeSerie(exIdx)}
                          className="flex items-center gap-1 text-xs text-danger-600 hover:text-danger-700"
                        >
                          <Minus className="h-3 w-3" /> Remover última
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Rest timer between exercises */}
              {isDone && exIdx < exercicios.length - 1 && exercicios[exIdx + 1]?.status === 'pendente' && ex.descansoSegundos && (
                <RestTimer
                  durationSeconds={ex.descansoSegundos}
                  label="Descanso entre exercícios"
                />
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Observações + Finalizar */}
      <Card>
        <CardContent className="space-y-3">
          <Input
            id="observacoes"
            label="Observações gerais"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Como está o treino? Sentiu dor, dificuldade..."
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Deseja cancelar o check-in? O progresso não será salvo.')) {
                clearCheckInState();
                workoutTimer.reset();
                navigate(-1);
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={saving}
            onClick={handleFinalizarTreino}
          >
            <Square className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Encerrar Treino'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
