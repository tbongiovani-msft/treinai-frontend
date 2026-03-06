import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, Badge, Button, PageLoader, Alert,
} from '@/components/ui';
import { ArrowLeft, Edit, Play, Dumbbell } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Treino } from '@/types';

export function TreinoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [treino, setTreino] = useState<Treino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/treinos" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{treino.nome}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={treino.ativo ? 'success' : 'default'}>
                {treino.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
              <span className="text-sm text-gray-500">
                Início: {formatDate(treino.dataInicio)}
                {treino.dataFim && ` · Fim: ${formatDate(treino.dataFim)}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/treinos/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </Link>
        </div>
      </div>

      {treino.descricao && (
        <p className="text-sm text-gray-600">{treino.descricao}</p>
      )}

      {/* Divisões */}
      {treino.divisoes
        .sort((a, b) => a.ordem - b.ordem)
        .map((divisao, idx) => (
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                          <Dumbbell className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ex.nome}</p>
                          <p className="text-xs text-gray-500">
                            {ex.series}x{ex.repeticoes}
                            {ex.carga && ` · ${ex.carga}`}
                            {ex.metodo && ` · ${ex.metodo}`}
                          </p>
                        </div>
                      </div>
                      {ex.linkVideo && (
                        <a
                          href={ex.linkVideo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Ver vídeo"
                        >
                          <Play className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
