import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, PageLoader, Alert } from '@/components/ui';
import { Users, Dumbbell, Activity, Target, TrendingUp, Calendar } from 'lucide-react';
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
  const { user, isProfessor, isAdmin, isAluno } = useAuth();
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
