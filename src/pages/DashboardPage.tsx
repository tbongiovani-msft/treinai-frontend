import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, Badge, PageLoader, Alert } from '@/components/ui';
import {
  Users, Dumbbell, Activity, Target, TrendingUp, Calendar,
  Scale, ChevronRight, PlayCircle, AlertTriangle, Clock, UserCheck, UserX,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { DashboardData, Treino, Aluno } from '@/types';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isProfessor, isAdmin, isAluno, alunoRecordId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [treinoAtivo, setTreinoAtivo] = useState<Treino | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisaoSelecionada, setDivisaoSelecionada] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Dashboard stats
        const dashRes = apiClient.get<DashboardData>('/api/relatorios/dashboard').catch(() => null);

        // Aluno: fetch active treino
        let treinoPromise: Promise<Treino | null> = Promise.resolve(null);
        if (isAluno && alunoRecordId) {
          treinoPromise = apiClient
            .get<Treino[]>(`/api/treinos?alunoId=${alunoRecordId}&ativo=true`)
            .then((r) => (r.data.length > 0 ? r.data[0] : null))
            .catch(() => null);
        }

        // Professor: fetch aluno list
        let alunosPromise: Promise<Aluno[]> = Promise.resolve([]);
        if (isProfessor || isAdmin) {
          alunosPromise = apiClient
            .get<Aluno[]>('/api/alunos')
            .then((r) => r.data)
            .catch(() => []);
        }

        const [dashResult, treino, alunoList] = await Promise.all([dashRes, treinoPromise, alunosPromise]);
        if (dashResult) setData(dashResult.data);
        setTreinoAtivo(treino);
        setAlunos(alunoList);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isAluno, isProfessor, isAdmin, alunoRecordId]);

  if (loading) return <PageLoader />;

  // Helper: days until treino expiration
  const daysUntilExpiry = (treino: Treino) => {
    if (!treino.dataFim) return null;
    const now = new Date();
    const end = new Date(treino.dataFim);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const expiryDays = treinoAtivo ? daysUntilExpiry(treinoAtivo) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.nome?.split(' ')[0] ?? 'Usuário'}! 👋
        </h1>
        <p className="text-gray-500">
          {isAdmin && 'Visão geral da plataforma'}
          {isProfessor && 'Acompanhe seus alunos e treinos'}
          {isAluno && 'Acompanhe seu progresso'}
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* ──── ALUNO: Treino do Dia ──── */}
      {isAluno && (
        <>
          {treinoAtivo ? (
            <Card className="border-primary-200 bg-gradient-to-br from-white to-primary-50/30">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      <Dumbbell className="mr-2 inline h-5 w-5 text-primary-600" />
                      {treinoAtivo.nome}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>Início: {formatDate(treinoAtivo.dataInicio)}</span>
                      {treinoAtivo.dataFim && (
                        <span>· Fim: {formatDate(treinoAtivo.dataFim)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expiryDays !== null && expiryDays <= 7 && expiryDays > 0 && (
                      <Badge variant="warning">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Vence em {expiryDays} dia{expiryDays !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {expiryDays !== null && expiryDays <= 0 && (
                      <Badge variant="danger">Treino expirado</Badge>
                    )}
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Divisão tabs */}
                {treinoAtivo.divisoes.length > 0 && (
                  <>
                    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-0">
                      {treinoAtivo.divisoes
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((div, idx) => (
                          <button
                            key={idx}
                            onClick={() => setDivisaoSelecionada(idx)}
                            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                              divisaoSelecionada === idx
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {div.nome}
                          </button>
                        ))}
                    </div>

                    {/* Selected divisão exercises */}
                    {(() => {
                      const div = treinoAtivo.divisoes.sort((a, b) => a.ordem - b.ordem)[divisaoSelecionada];
                      if (!div) return null;
                      return (
                        <div className="space-y-2">
                          {div.descricao && (
                            <p className="text-sm text-gray-500">{div.descricao}</p>
                          )}
                          <div className="space-y-2">
                            {div.exercicios
                              .sort((a, b) => a.ordem - b.ordem)
                              .map((ex, exIdx) => (
                                <div
                                  key={exIdx}
                                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                                      {exIdx + 1}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{ex.nome}</p>
                                      <p className="text-xs text-gray-500">
                                        {ex.series}x{ex.repeticoes}
                                        {ex.carga && ` · ${ex.carga}`}
                                        {ex.metodo && ` · ${ex.metodo}`}
                                        {ex.descanso && ` · ${ex.descanso}`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                          {/* Start workout button */}
                          <Link to="/atividades/checkin" className="block">
                            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700">
                              <PlayCircle className="h-5 w-5" />
                              Iniciar Treino — {div.nome}
                            </button>
                          </Link>
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            /* No active treino */
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="py-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
                <h3 className="mt-3 text-lg font-semibold text-gray-900">Nenhum treino ativo</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Você ainda não tem um treino atribuído. Fale com seu professor para receber um plano de treino.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ──── PROFESSOR: Aluno Status Board ──── */}
      {(isProfessor || isAdmin) && alunos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                <Users className="mr-2 inline h-5 w-5 text-primary-600" />
                Meus Alunos
              </h2>
              <Link to="/alunos" className="text-sm font-medium text-primary-600 hover:underline">
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alunos.filter(a => a.ativo).slice(0, 8).map((aluno) => (
              <div
                key={aluno.id}
                onClick={() => navigate(`/alunos/${aluno.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{aluno.nome}</p>
                    <p className="text-xs text-gray-500">{aluno.objetivo || 'Sem objetivo definido'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aluno.ativo ? (
                    <UserCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <UserX className="h-4 w-4 text-gray-400" />
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
            {alunos.filter(a => a.ativo).length > 8 && (
              <p className="mt-2 text-center text-xs text-gray-400">
                + {alunos.filter(a => a.ativo).length - 8} alunos
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(isAdmin || isProfessor) && (
            <StatCard
              icon={Users}
              label="Alunos"
              value={data.totalAlunos}
              color="bg-primary-600"
            />
          )}
          <StatCard
            icon={Dumbbell}
            label="Treinos"
            value={data.totalTreinos}
            color="bg-accent-600"
          />
          <StatCard
            icon={Activity}
            label="Atividades"
            value={data.totalAtividades}
            color="bg-purple-600"
          />
          <StatCard
            icon={Target}
            label="Avaliações"
            value={data.totalAvaliacoes}
            color="bg-orange-600"
          />
        </div>
      )}

      {/* Recent activity summary */}
      {data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Últimos 7 dias</p>
                <p className="text-2xl font-bold text-gray-900">{data.atividadesUltimos7Dias}</p>
                <p className="text-xs text-gray-400">treinos registrados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Últimos 30 dias</p>
                <p className="text-2xl font-bold text-gray-900">{data.atividadesUltimos30Dias}</p>
                <p className="text-xs text-gray-400">treinos registrados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aluno quick actions */}
      {isAluno && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link to="/atividades/checkin">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <PlayCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Iniciar Treino</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/atividades">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Histórico</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/treinos">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                    <Dumbbell className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Meus Treinos</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/avaliacoes">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Scale className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Avaliações</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Empty state for no data */}
      {!data && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum dado ainda</h3>
            <p className="mt-2 text-sm text-gray-500">
              Comece cadastrando alunos e criando treinos para ver as estatísticas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
