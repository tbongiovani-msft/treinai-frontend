import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, Button, Input, Badge, PageLoader, Alert } from '@/components/ui';
import { Plus, Search, Dumbbell, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Treino } from '@/types';

export function TreinosListPage() {
  const { isProfessor, isAdmin } = useAuth();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchTreinos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Treino[]>('/api/treinos');
      setTreinos(res.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreinos();
  }, [fetchTreinos]);

  const filtered = treinos.filter((t) =>
    t.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treinos</h1>
          <p className="text-sm text-gray-500">{treinos.length} treinos cadastrados</p>
        </div>
        {(isAdmin || isProfessor) && (
          <Link to="/treinos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo Treino
            </Button>
          </Link>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar treinos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum treino encontrado</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((treino) => {
            const isActive =
              treino.ativo &&
              new Date(treino.dataInicio) <= new Date() &&
              (!treino.dataFim || new Date(treino.dataFim) >= new Date());

            return (
              <Link key={treino.id} to={`/treinos/${treino.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{treino.nome}</p>
                        {treino.descricao && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {treino.descricao}
                          </p>
                        )}
                      </div>
                      <Badge variant={isActive ? 'success' : 'default'}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {treino.divisoes.length} divisões
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(treino.dataInicio)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
