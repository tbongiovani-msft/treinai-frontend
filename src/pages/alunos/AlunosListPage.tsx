import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, Button, Input, Badge, PageLoader, Alert } from '@/components/ui';
import { Plus, Search, User, Mail, Phone } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Aluno } from '@/types';

export function AlunosListPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchAlunos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Aluno[]>('/api/alunos');
      setAlunos(res.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const filtered = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="text-sm text-gray-500">{alunos.length} alunos cadastrados</p>
        </div>
        <Link to="/alunos/novo">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {search
                ? 'Tente alterar o termo de busca.'
                : 'Clique em "Novo Aluno" para cadastrar o primeiro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((aluno) => (
            <Link key={aluno.id} to={`/alunos/${aluno.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {aluno.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{aluno.nome}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />
                          {aluno.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant={aluno.ativo ? 'success' : 'danger'}>
                      {aluno.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    {aluno.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {aluno.telefone}
                      </span>
                    )}
                    {aluno.peso && <span>{aluno.peso}kg</span>}
                    {aluno.altura && <span>{aluno.altura}cm</span>}
                  </div>

                  {aluno.objetivo && (
                    <p className="mt-2 text-xs text-gray-400 line-clamp-1">
                      🎯 {aluno.objetivo}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-gray-400">
                    Cadastrado em {formatDate(aluno.criadoEm)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
