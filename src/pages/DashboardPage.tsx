import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, PageLoader, Alert } from '@/components/ui';
import { Users, Dumbbell, Activity, Target, TrendingUp, Calendar, ClipboardList, Scale, ChevronRight } from 'lucide-react';
import type { DashboardData } from '@/types';

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
  const { user, isProfessor, isAdmin, isAluno, alunoRecordId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get<DashboardData>('/api/relatorios/dashboard');
        setData(res.data);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <PageLoader />;

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
      {isAluno && alunoRecordId && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Ações Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/atividades/registrar">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <ClipboardList className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Registrar Treino</p>
                    <p className="text-xs text-gray-500">Iniciar atividade do dia</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/atividades">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Histórico</p>
                    <p className="text-xs text-gray-500">Ver treinos anteriores</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/treinos">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                    <Dumbbell className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Meus Treinos</p>
                    <p className="text-xs text-gray-500">Ver plano de treino</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/avaliacoes">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Scale className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Avaliações</p>
                    <p className="text-xs text-gray-500">Acompanhar evolução</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
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
