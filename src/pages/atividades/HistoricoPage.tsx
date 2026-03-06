import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, Badge, Spinner, Alert, Input,
} from '@/components/ui';
import { Calendar, Clock, Dumbbell, ChevronRight, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Atividade } from '@/types';

export function HistoricoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroData, setFiltroData] = useState('');

  useEffect(() => {
    if (!alunoId) {
      setLoading(false);
      return;
    }
    apiClient
      .get<Atividade[]>(`/api/atividades?alunoId=${alunoId}`)
      .then((r) => setAtividades(r.data.sort((a, b) => new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime())))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  const atividadesFiltradas = filtroData
    ? atividades.filter((a) => a.dataExecucao.startsWith(filtroData))
    : atividades;

  // Group by month
  const grouped = atividadesFiltradas.reduce<Record<string, Atividade[]>>((acc, a) => {
    const month = new Date(a.dataExecucao).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(a);
    return acc;
  }, {});

  if (loading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Treinos</h1>
        <Input
          id="filtro-data"
          type="month"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="w-auto"
        />
      </div>

      {error && <Alert type="error" message={error} />}

      {!alunoId && (
        <Alert type="warning" message="Selecione um aluno para visualizar o histórico." />
      )}

      {alunoId && atividadesFiltradas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Nenhuma atividade registrada.</p>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{month}</h2>
          {items.map((atividade) => {
            const totalExercicios = atividade.exerciciosExecutados.length;
            const seriesTotal = atividade.exerciciosExecutados.reduce((s, ex) => s + ex.series.length, 0);
            const seriesConcluidas = atividade.exerciciosExecutados.reduce(
              (s, ex) => s + ex.series.filter((sr) => sr.concluida).length, 0
            );

            return (
              <Card
                key={atividade.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/atividades/${atividade.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <Dumbbell className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{atividade.divisaoNome}</p>
                      {seriesConcluidas === seriesTotal && seriesTotal > 0 && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(atividade.dataExecucao)}
                      </span>
                      {atividade.duracaoMinutos > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {atividade.duracaoMinutos} min
                        </span>
                      )}
                      <span>{totalExercicios} exercícios</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={seriesConcluidas === seriesTotal ? 'success' : 'warning'}>
                      {seriesConcluidas}/{seriesTotal} séries
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
