import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, Spinner, Alert } from '@/components/ui';
import { TrendingUp } from 'lucide-react';
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

export function RelatoriosPage() {
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [evolucao, setEvolucao] = useState<Avaliacao[]>([]);
  const [frequencia, setFrequencia] = useState<FrequenciaAluno['semanas']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }

    Promise.all([
      apiClient.get<EvolucaoAluno>(`/api/relatorios/evolucao?alunoId=${alunoId}`).catch(() => null),
      apiClient.get<FrequenciaAluno>(`/api/relatorios/frequencia?alunoId=${alunoId}`).catch(() => null),
    ])
      .then(([ev, freq]) => {
        if (ev?.data?.avaliacoes) setEvolucao(ev.data.avaliacoes.sort((a, b) => new Date(a.dataAvaliacao).getTime() - new Date(b.dataAvaliacao).getTime()));
        if (freq?.data?.semanas) setFrequencia(freq.data.semanas);
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
    </div>
  );
}
