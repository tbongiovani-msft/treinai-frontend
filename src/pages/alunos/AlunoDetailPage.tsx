import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, Badge, Button, PageLoader, Alert,
} from '@/components/ui';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Ruler, Weight, Target, TrendingUp, TrendingDown, Minus, Activity, UserX, UserCheck } from 'lucide-react';
import { formatDate, formatDateTime, formatNumber, calcularIMC, classificarIMC, getInitials } from '@/lib/utils';
import type { Aluno, Avaliacao, Treino, HistoricoPeso, Atividade } from '@/types';

export function AlunoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [treino, setTreino] = useState<Treino | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [historicoPeso, setHistoricoPeso] = useState<HistoricoPeso[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [alunoRes] = await Promise.all([
          apiClient.get<Aluno>(`/api/alunos/${id}`),
        ]);
        setAluno(alunoRes.data);

        // Fetch related data (non-blocking)
        apiClient.get<Treino>(`/api/treinos/aluno/${id}/ativo`).then((r) => setTreino(r.data)).catch(() => {});
        apiClient.get<Avaliacao[]>(`/api/avaliacoes/aluno/${id}`).then((r) => setAvaliacoes(r.data)).catch(() => {});
        apiClient.get<HistoricoPeso[]>(`/api/alunos/${id}/historico-peso`).then((r) => setHistoricoPeso(r.data)).catch(() => {});
        apiClient.get<Atividade[]>(`/api/atividades?alunoId=${id}`).then((r) => setAtividades(r.data)).catch(() => {});
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
  if (!aluno) return <Alert type="error" message="Aluno não encontrado" />;

  const imc = aluno.peso && aluno.altura ? calcularIMC(aluno.peso, aluno.altura) : null;
  const imcInfo = imc ? classificarIMC(imc) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/alunos" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
              {getInitials(aluno.nome)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{aluno.nome}</h1>
              <Badge variant={aluno.ativo ? 'success' : 'danger'}>
                {aluno.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
        <Link to={`/alunos/${id}/editar`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </Link>
        <Button
          variant={aluno.ativo ? 'danger' : 'primary'}
          size="sm"
          disabled={toggleLoading}
          onClick={async () => {
            if (!aluno.ativo || confirm(`Deseja realmente desativar ${aluno.nome}?`)) {
              try {
                setToggleLoading(true);
                if (aluno.ativo) {
                  await apiClient.delete(`/api/alunos/${id}`);
                  setAluno({ ...aluno, ativo: false });
                } else {
                  // Re-activate: full PUT with ativo = true
                  await apiClient.put(`/api/alunos/${id}`, { ...aluno, ativo: true });
                  setAluno({ ...aluno, ativo: true });
                }
              } catch (err) {
                setError(extractApiError(err));
              } finally {
                setToggleLoading(false);
              }
            }
          }}
        >
          {aluno.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          {toggleLoading ? '...' : aluno.ativo ? 'Desativar' : 'Reativar'}
        </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-gray-700">Contato</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" /> {aluno.email}
            </p>
            {aluno.telefone && (
              <p className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" /> {aluno.telefone}
              </p>
            )}
            {aluno.dataNascimento && (
              <p className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" /> {formatDate(aluno.dataNascimento)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-gray-700">Medidas</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {aluno.peso && (
              <p className="flex items-center gap-2 text-gray-600">
                <Weight className="h-4 w-4" /> {formatNumber(aluno.peso)} kg
              </p>
            )}
            {aluno.altura && (
              <p className="flex items-center gap-2 text-gray-600">
                <Ruler className="h-4 w-4" /> {formatNumber(aluno.altura, 0)} cm
              </p>
            )}
            {imc && imcInfo && (
              <p className="flex items-center gap-2">
                <span className="text-gray-600">IMC:</span>
                <span className="font-semibold">{formatNumber(imc)}</span>
                <span className={imcInfo.color}>({imcInfo.label})</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-gray-700">Objetivo</h3></CardHeader>
          <CardContent>
            {aluno.objetivo ? (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="h-4 w-4" /> {aluno.objetivo}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Nenhum objetivo definido</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Training */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Treino Ativo</h3>
            {treino && (
              <Link to={`/treinos/${treino.id}`}>
                <Button variant="ghost" size="sm">Ver treino</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {treino ? (
            <div>
              <p className="font-medium text-gray-900">{treino.nome}</p>
              <p className="text-sm text-gray-500">
                {treino.divisoes.length} divisões · Início: {formatDate(treino.dataInicio)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum treino ativo</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Assessments */}
      {avaliacoes.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-700">Últimas Avaliações</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {avaliacoes.slice(0, 3).map((av) => (
                <div key={av.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{formatDate(av.dataAvaliacao)}</span>
                  <div className="flex gap-4 text-gray-500">
                    <span>{formatNumber(av.peso)} kg</span>
                    {av.percentualGordura && <span>{formatNumber(av.percentualGordura)}% gordura</span>}
                    {av.imc && <span>IMC {formatNumber(av.imc)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight History */}
      {historicoPeso.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-700">
              Histórico de Peso ({historicoPeso.length} registros)
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                    <th className="pb-2 pr-4">Data</th>
                    <th className="pb-2 pr-4">Anterior</th>
                    <th className="pb-2 pr-4">Novo</th>
                    <th className="pb-2 pr-4">Variação</th>
                    <th className="pb-2">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historicoPeso.slice(0, 10).map((h) => {
                    const diff = h.pesoNovo - h.pesoAnterior;
                    return (
                      <tr key={h.id}>
                        <td className="py-2 pr-4 text-gray-600">{formatDateTime(h.dataRegistro)}</td>
                        <td className="py-2 pr-4 text-gray-500">{formatNumber(h.pesoAnterior)} kg</td>
                        <td className="py-2 pr-4 font-medium text-gray-900">{formatNumber(h.pesoNovo)} kg</td>
                        <td className="py-2 pr-4">
                          <span className={`flex items-center gap-1 text-xs font-medium ${
                            diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-400'
                          }`}>
                            {diff > 0 ? <TrendingUp className="h-3 w-3" /> :
                             diff < 0 ? <TrendingDown className="h-3 w-3" /> :
                             <Minus className="h-3 w-3" />}
                            {diff > 0 ? '+' : ''}{formatNumber(diff)} kg
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{h.observacao ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adherence Stats (E7) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Aderência ao Treino</h3>
          </div>
        </CardHeader>
        <CardContent>
          {atividades.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{atividades.length}</p>
                <p className="text-xs text-gray-500">Total de Atividades</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {atividades.filter(a => {
                    const d = new Date(a.dataExecucao ?? a.criadoEm);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return d >= weekAgo;
                  }).length}
                </p>
                <p className="text-xs text-gray-500">Últimos 7 dias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {atividades.filter(a => {
                    const d = new Date(a.dataExecucao ?? a.criadoEm);
                    const monthAgo = new Date();
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    return d >= monthAgo;
                  }).length}
                </p>
                <p className="text-xs text-gray-500">Últimos 30 dias</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
