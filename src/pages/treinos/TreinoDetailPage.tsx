import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, Badge, Button, PageLoader, Alert, VideoLink,
} from '@/components/ui';
import { ArrowLeft, Edit, PlayCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Treino } from '@/types';

export function TreinoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { isAluno, isProfessor, isAdmin } = useAuth();
  const [treino, setTreino] = useState<Treino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivisao, setSelectedDivisao] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get<Treino>(`/api/treinos/${id}`);
        setTreino(res.data);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <PageLoader />;
  if (error) return <Alert type="error" message={error} />;
  if (!treino) return <Alert type="error" message="Treino não encontrado" />;

  // Calculate expiration
  const daysUntilExpiry = (() => {
    if (!treino.dataFim) return null;
    const now = new Date();
    const end = new Date(treino.dataFim);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  const sortedDivisoes = [...treino.divisoes].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/treinos" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{treino.nome}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={treino.ativo ? 'success' : 'default'}>
                {treino.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
              {isExpired && <Badge variant="danger">Expirado</Badge>}
              {isExpiringSoon && (
                <Badge variant="warning">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Vence em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}
                </Badge>
              )}
              <span className="text-sm text-gray-500">
                Início: {formatDate(treino.dataInicio)}
                {treino.dataFim && ` · Fim: ${formatDate(treino.dataFim)}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(isProfessor || isAdmin) && (
            <Link to={`/treinos/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" /> Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Expiration warning banner */}
      {isExpired && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Treino expirado</p>
            <p className="text-xs text-red-600">
              Este treino venceu em {formatDate(treino.dataFim!)}. Fale com seu professor para um novo plano.
            </p>
          </div>
        </div>
      )}
      {isExpiringSoon && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Treino expirando em breve</p>
            <p className="text-xs text-amber-600">
              Faltam {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''} para este treino expirar ({formatDate(treino.dataFim!)}).
            </p>
          </div>
        </div>
      )}

      {treino.descricao && (
        <p className="text-sm text-gray-600">{treino.descricao}</p>
      )}

      {/* Divisão tabs */}
      {sortedDivisoes.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {sortedDivisoes.map((div, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDivisao(idx)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedDivisao === idx
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {div.nome}
              <span className="ml-1 text-xs text-gray-400">({div.exercicios.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected divisão (or all if single) */}
      {(() => {
        const divisoesToShow = sortedDivisoes.length > 1
          ? [sortedDivisoes[selectedDivisao]]
          : sortedDivisoes;

        return divisoesToShow.map((divisao, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{divisao.nome}</h3>
                  {divisao.descricao && (
                    <p className="text-sm text-gray-500">{divisao.descricao}</p>
                  )}
                </div>
                <Badge variant="info">{divisao.exercicios.length} exercícios</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {divisao.exercicios
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                          {exIdx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ex.nome}</p>
                          <p className="text-xs text-gray-500">
                            {ex.series}x{ex.repeticoes}
                            {ex.carga && ` · ${ex.carga}`}
                            {ex.metodo && ` · ${ex.metodo}`}
                            {ex.descanso && ` · Desc: ${ex.descanso}`}
                          </p>
                        </div>
                      </div>
                      {ex.linkVideo && (
                        <VideoLink url={ex.linkVideo} />
                      )}
                    </div>
                  ))}
              </div>

              {/* "Iniciar Treino" button for alunos */}
              {isAluno && treino.ativo && !isExpired && (
                <Link to="/atividades/checkin" className="block mt-4">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700">
                    <PlayCircle className="h-5 w-5" />
                    Iniciar Treino — {divisao.nome}
                  </button>
                </Link>
              )}
            </CardContent>
          </Card>
        ));
      })()}
    </div>
  );
}
