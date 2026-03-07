import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, Spinner, Alert } from '@/components/ui';
import { TrendingUp, Target, Timer, Dumbbell } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import type { EvolucaoAluno, FrequenciaAluno, Avaliacao } from '@/types';

// ── Analytics response types ──
interface AderenciaData {
  aderenciaGlobal: number;
  totalPrescritos: number;
  totalRealizados: number;
  porTreino: Array<{ treinoId: string; treinoNome: string; percentual: number; realizados: number; totalPrescritos: number }>;
  tendenciaSemanal: Array<{ semana: string; realizados: number }>;
}

interface EvolucaoCargaData {
  porExercicio: Array<{
    exercicioId: string;
    nome: string;
    pontos: Array<{ data: string; cargaMaxima: number; volumeTotal: number }>;
  }>;
}

interface TempoMedioData {
  duracaoMediaSessao: number;
  porExercicio: Array<{
    exercicioId: string;
    nome: string;
    tempoMedioSegundos: number;
    totalExecucoes: number;
  }>;
  tendencia: Array<{ semana: string; duracaoMedia: number }>;
}

export function RelatoriosPage() {
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [evolucao, setEvolucao] = useState<Avaliacao[]>([]);
  const [frequencia, setFrequencia] = useState<FrequenciaAluno['semanas']>([]);
  const [aderencia, setAderencia] = useState<AderenciaData | null>(null);
  const [evolucaoCarga, setEvolucaoCarga] = useState<EvolucaoCargaData | null>(null);
  const [tempoMedio, setTempoMedio] = useState<TempoMedioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }

    Promise.all([
      apiClient.get<EvolucaoAluno>(`/api/relatorios/aluno/${alunoId}/evolucao`).catch(() => null),
      apiClient.get<FrequenciaAluno>(`/api/relatorios/aluno/${alunoId}/frequencia`).catch(() => null),
      apiClient.get<AderenciaData>(`/api/relatorios/aluno/${alunoId}/aderencia`).catch(() => null),
      apiClient.get<EvolucaoCargaData>(`/api/relatorios/aluno/${alunoId}/evolucao-carga`).catch(() => null),
      apiClient.get<TempoMedioData>(`/api/relatorios/aluno/${alunoId}/tempo-medio`).catch(() => null),
    ])
      .then(([ev, freq, ader, carga, tempo]) => {
        if (ev?.data?.avaliacoes) setEvolucao(ev.data.avaliacoes.sort((a, b) => new Date(a.dataAvaliacao).getTime() - new Date(b.dataAvaliacao).getTime()));
        if (freq?.data?.semanas) setFrequencia(freq.data.semanas);
        if (ader?.data) setAderencia(ader.data);
        if (carga?.data) setEvolucaoCarga(carga.data);
        if (tempo?.data) setTempoMedio(tempo.data);
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const pesoData = evolucao.map((a) => ({
    data: new Date(a.dataAvaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    peso: a.peso,
    imc: a.imc ?? (a.peso / ((a.altura / 100) ** 2)),
  }));

  const gorduraData = evolucao
    .filter((a) => a.percentualGordura != null)
    .map((a) => ({
      data: new Date(a.dataAvaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      gordura: a.percentualGordura,
      massaMagra: a.massaMagra,
      massaGorda: a.massaGorda,
    }));

  const circData = evolucao
    .filter((a) => a.circunferencias)
    .map((a) => ({
      data: new Date(a.dataAvaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      ...a.circunferencias,
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios & Evolução</h1>

      {error && <Alert type="error" message={error} />}
      {!alunoId && <Alert type="warning" message="Selecione um aluno para ver relatórios." />}

      {alunoId && evolucao.length === 0 && frequencia.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Dados insuficientes para gerar gráficos.</p>
            <p className="text-xs text-gray-400 mt-1">Registre avaliações físicas e atividades para visualizar a evolução.</p>
          </CardContent>
        </Card>
      )}

      {/* Peso & IMC */}
      {pesoData.length > 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Evolução de Peso & IMC</h2>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pesoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="peso" tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <YAxis yAxisId="imc" orientation="right" tick={{ fontSize: 12 }} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="peso" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="imc" type="monotone" dataKey="imc" name="IMC" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body Composition */}
      {gorduraData.length > 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Composição Corporal</h2>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gorduraData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="gordura" name="% Gordura" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                  {gorduraData[0]?.massaMagra && (
                    <Area type="monotone" dataKey="massaMagra" name="Massa Magra (kg)" stroke="#22c55e" fill="#dcfce7" strokeWidth={2} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Circumferences */}
      {circData.length > 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Circunferências (cm)</h2>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={circData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="torax" name="Tórax" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bracoD" name="Braço D" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="coxaD" name="Coxa D" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Frequency */}
      {frequencia.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Frequência de Treinos</h2>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="treinos" name="Treinos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Aderência ao Treino (E7-12) ── */}
      {aderencia && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Aderência ao Treino</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Global KPI */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary-600">{aderencia.aderenciaGlobal}%</p>
                <p className="text-xs text-gray-500 mt-1">Aderência global</p>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Treinos prescritos: <span className="font-semibold">{aderencia.totalPrescritos}</span></p>
                <p>Treinos realizados: <span className="font-semibold">{aderencia.totalRealizados}</span></p>
              </div>
            </div>

            {/* Per-treino breakdown */}
            {aderencia.porTreino.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Por treino:</p>
                {aderencia.porTreino.map((t) => (
                  <div key={t.treinoId} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-32 truncate">{t.treinoNome}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${t.percentual}%`,
                          backgroundColor: t.percentual >= 80 ? '#22c55e' : t.percentual >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{t.percentual}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weekly trend */}
            {aderencia.tendenciaSemanal.length > 1 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aderencia.tendenciaSemanal.map((s) => ({
                    semana: new Date(s.semana).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    realizados: s.realizados,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="realizados" name="Sessões" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Evolução de Carga (E7-13) ── */}
      {evolucaoCarga && evolucaoCarga.porExercicio.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Evolução de Carga</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {evolucaoCarga.porExercicio.slice(0, 5).map((ex) => (
              <div key={ex.exercicioId}>
                <p className="text-sm font-medium text-gray-700 mb-2">{ex.nome}</p>
                {ex.pontos.length > 1 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ex.pontos.map((p) => ({
                        data: new Date(p.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                        carga: p.cargaMaxima,
                        volume: p.volumeTotal,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="carga" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="carga" type="monotone" dataKey="carga" name="Carga máx (kg)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="volume" type="monotone" dataKey="volume" name="Volume total" stroke="#f97316" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Dados insuficientes para gráfico (precisa de 2+ execuções)</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Tempo Médio por Exercício (E7-14) ── */}
      {tempoMedio && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Tempo Médio de Treino</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session average KPI */}
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">{tempoMedio.duracaoMediaSessao} min</p>
              <p className="text-xs text-gray-500 mt-1">Duração média por sessão</p>
            </div>

            {/* Per exercise table */}
            {tempoMedio.porExercicio.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2">Exercício</th>
                      <th className="py-2 text-right">Tempo médio</th>
                      <th className="py-2 text-right">Execuções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempoMedio.porExercicio.slice(0, 10).map((ex) => (
                      <tr key={ex.exercicioId} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-gray-900">{ex.nome}</td>
                        <td className="py-2 text-right text-gray-600">
                          {Math.floor(ex.tempoMedioSegundos / 60)}:{String(Math.round(ex.tempoMedioSegundos % 60)).padStart(2, '0')} min
                        </td>
                        <td className="py-2 text-right text-gray-500">{ex.totalExecucoes}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Session duration trend */}
            {tempoMedio.tendencia.length > 1 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tempoMedio.tendencia.map((t) => ({
                    semana: new Date(t.semana).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    minutos: t.duracaoMedia,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="minutos" name="Duração média (min)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
