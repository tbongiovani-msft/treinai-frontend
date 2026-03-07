import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Badge, PageLoader,
} from '@/components/ui';
import {
  Weight, Ruler, Target, Mail, Phone, Calendar, TrendingUp, TrendingDown, Minus, Save,
} from 'lucide-react';
import { formatDate, formatDateTime, formatNumber, calcularIMC, classificarIMC, getInitials } from '@/lib/utils';
import type { Aluno, HistoricoPeso } from '@/types';

export function MeuPerfilPage() {
  const { alunoRecordId, isAluno } = useAuth();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [historico, setHistorico] = useState<HistoricoPeso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Peso edit state
  const [editingPeso, setEditingPeso] = useState(false);
  const [novoPeso, setNovoPeso] = useState('');
  const [observacaoPeso, setObservacaoPeso] = useState('');
  const [savingPeso, setSavingPeso] = useState(false);
  const [pesoSuccess, setPesoSuccess] = useState<string | null>(null);

  const alunoId = isAluno ? 'me' : alunoRecordId;

  const fetchData = useCallback(async () => {
    if (!alunoId) return;
    try {
      setLoading(true);
      setError(null);
      const [alunoRes, historicoRes] = await Promise.all([
        apiClient.get<Aluno>(`/api/alunos/${alunoId}`),
        apiClient.get<HistoricoPeso[]>(`/api/alunos/${alunoId}/historico-peso`),
      ]);
      setAluno(alunoRes.data);
      setHistorico(historicoRes.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [alunoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSavePeso = async () => {
    const peso = parseFloat(novoPeso.replace(',', '.'));
    if (!peso || peso <= 0) return;

    try {
      setSavingPeso(true);
      setError(null);
      setPesoSuccess(null);

      await apiClient.patch(`/api/alunos/${alunoId}/peso`, {
        peso,
        observacao: observacaoPeso || undefined,
      });

      // Refresh data
      await fetchData();
      setEditingPeso(false);
      setNovoPeso('');
      setObservacaoPeso('');
      setPesoSuccess('Peso atualizado com sucesso!');
      setTimeout(() => setPesoSuccess(null), 3000);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSavingPeso(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error && !aluno) return <Alert type="error" message={error} />;
  if (!aluno) return <Alert type="warning" message="Perfil não encontrado. Verifique se seu cadastro está completo." />;

  const imc = aluno.peso && aluno.altura ? calcularIMC(aluno.peso, aluno.altura) : null;
  const imcInfo = imc ? classificarIMC(imc) : null;

  // Weight trend (last 5 entries)
  const pesoVariacao = historico.length >= 2
    ? historico[0].pesoNovo - historico[1].pesoNovo
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
          {getInitials(aluno.nome)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{aluno.nome}</h1>
          <p className="text-sm text-gray-500">
            {aluno.objetivo ?? 'Sem objetivo definido'}
          </p>
          <Badge variant={aluno.ativo ? 'success' : 'danger'}>
            {aluno.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {pesoSuccess && <Alert type="success" message={pesoSuccess} />}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-gray-700">Dados Pessoais</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4 shrink-0" /> {aluno.email}
            </p>
            {aluno.telefone && (
              <p className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 shrink-0" /> {aluno.telefone}
              </p>
            )}
            {aluno.dataNascimento && (
              <p className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 shrink-0" /> {formatDate(aluno.dataNascimento)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-gray-700">Medidas Atuais</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {aluno.peso ? (
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-gray-600">
                  <Weight className="h-4 w-4" /> {formatNumber(aluno.peso)} kg
                </p>
                {pesoVariacao !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${
                    pesoVariacao > 0 ? 'text-red-500' : pesoVariacao < 0 ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {pesoVariacao > 0 ? <TrendingUp className="h-3 w-3" /> :
                     pesoVariacao < 0 ? <TrendingDown className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    {pesoVariacao > 0 ? '+' : ''}{formatNumber(pesoVariacao)} kg
                  </span>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Peso não registrado</p>
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
            {aluno.observacoes && (
              <p className="mt-2 text-xs text-gray-500">{aluno.observacoes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weight Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Atualizar Peso</h3>
            {!editingPeso && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingPeso(true);
                  setNovoPeso(aluno.peso ? formatNumber(aluno.peso).replace(',', '.') : '');
                }}
              >
                <Weight className="h-4 w-4" />
                Registrar Peso
              </Button>
            )}
          </div>
        </CardHeader>
        {editingPeso && (
          <>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  id="novoPeso"
                  label="Novo peso (kg)"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder="Ex: 70.5"
                />
                <Input
                  id="observacaoPeso"
                  label="Observação (opcional)"
                  value={observacaoPeso}
                  onChange={(e) => setObservacaoPeso(e.target.value)}
                  placeholder="Ex: Após treino, em jejum..."
                />
              </div>
              {aluno.peso && novoPeso && (
                <p className="text-xs text-gray-500">
                  Peso atual: {formatNumber(aluno.peso)} kg →
                  Novo: {novoPeso.replace('.', ',')} kg
                  ({(() => {
                    const diff = parseFloat(novoPeso.replace(',', '.')) - aluno.peso;
                    return diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff);
                  })()
                  } kg)
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingPeso(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={savingPeso || !novoPeso || parseFloat(novoPeso.replace(',', '.')) <= 0}
                onClick={handleSavePeso}
              >
                <Save className="h-4 w-4" />
                {savingPeso ? 'Salvando...' : 'Salvar'}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Weight History */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-700">
            Histórico de Peso ({historico.length} {historico.length === 1 ? 'registro' : 'registros'})
          </h3>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum registro de alteração de peso ainda.</p>
          ) : (
            <>
              {/* Simple chart — bar visualization */}
              {historico.length >= 2 && (
                <div className="mb-4">
                  <WeightChart data={historico} />
                </div>
              )}

              {/* Table */}
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
                    {historico.map((h) => {
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Simple Weight Chart Component ──

function WeightChart({ data }: { data: HistoricoPeso[] }) {
  // Show last 10 entries, oldest first
  const entries = [...data].reverse().slice(-10);
  const weights = entries.map((e) => e.pesoNovo);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <p className="mb-2 text-xs font-medium text-gray-500">Evolução do Peso (últimos {entries.length} registros)</p>
      <div className="flex items-end gap-1" style={{ height: '120px' }}>
        {entries.map((entry, i) => {
          const height = ((entry.pesoNovo - min) / range) * 100;
          const prevWeight = i > 0 ? entries[i - 1].pesoNovo : entry.pesoAnterior;
          const diff = entry.pesoNovo - prevWeight;

          return (
            <div key={entry.id} className="group relative flex flex-1 flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-8 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                {formatNumber(entry.pesoNovo)} kg
                <br />
                {formatDate(entry.dataRegistro)}
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all ${
                  diff > 0 ? 'bg-red-400' : diff < 0 ? 'bg-green-400' : 'bg-blue-400'
                } hover:opacity-80`}
                style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
              />
              {/* Label */}
              <span className="mt-1 text-[9px] text-gray-400 truncate w-full text-center">
                {formatNumber(entry.pesoNovo, 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
