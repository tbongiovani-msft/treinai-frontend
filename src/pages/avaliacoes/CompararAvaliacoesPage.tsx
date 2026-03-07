import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, Alert, Spinner, Badge } from '@/components/ui';
import { ArrowLeft, ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDate, calcularIMC, classificarIMC } from '@/lib/utils';
import type { Avaliacao, Circunferencias } from '@/types';

const circ_labels: Record<keyof Circunferencias, string> = {
  torax: 'Tórax',
  cintura: 'Cintura',
  quadril: 'Quadril',
  bracoD: 'Braço D',
  bracoE: 'Braço E',
  coxaD: 'Coxa D',
  coxaE: 'Coxa E',
  panturrilhaD: 'Panturrilha D',
  panturrilhaE: 'Panturrilha E',
};

function DeltaIndicator({ current, previous, inverse }: { current?: number; previous?: number; inverse?: boolean }) {
  if (current == null || previous == null) return <Minus className="h-3 w-3 text-gray-300" />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus className="h-3 w-3 text-gray-400" />;
  const isPositive = diff > 0;
  const isGood = inverse ? !isPositive : isPositive;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{diff.toFixed(1)}
    </span>
  );
}

export function CompararAvaliacoesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { alunoRecordId, isAluno } = useAuth();
  const alunoId = searchParams.get('alunoId') || (isAluno ? alunoRecordId : null) || '';

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }
    apiClient.get<Avaliacao[]>(`/api/avaliacoes?alunoId=${alunoId}`)
      .then((r) => {
        const sorted = r.data.sort((a, b) => new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime());
        setAvaliacoes(sorted);
        if (sorted.length >= 2) {
          setLeftId(sorted[1].id); // Anterior
          setRightId(sorted[0].id); // Mais recente
        }
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const left = avaliacoes.find((a) => a.id === leftId);
  const right = avaliacoes.find((a) => a.id === rightId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <ArrowLeftRight className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Comparar Avaliações</h1>
      </div>

      {error && <Alert type="error" message={error} />}
      {!alunoId && <Alert type="warning" message="Selecione um aluno." />}

      {avaliacoes.length < 2 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">É necessário pelo menos 2 avaliações para comparar.</p>
          </CardContent>
        </Card>
      )}

      {avaliacoes.length >= 2 && (
        <>
          {/* Selectors */}
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação anterior</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={leftId}
                    onChange={(e) => setLeftId(e.target.value)}
                  >
                    {avaliacoes.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === rightId}>
                        {formatDate(a.dataAvaliacao)} — {a.peso}kg
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação recente</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={rightId}
                    onChange={(e) => setRightId(e.target.value)}
                  >
                    {avaliacoes.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === leftId}>
                        {formatDate(a.dataAvaliacao)} — {a.peso}kg
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side comparison */}
          {left && right && (
            <>
              {/* Medidas Básicas */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">Medidas Básicas</h2>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2">Medida</th>
                        <th className="py-2 text-right">{formatDate(left.dataAvaliacao)}</th>
                        <th className="py-2 text-right">{formatDate(right.dataAvaliacao)}</th>
                        <th className="py-2 text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Peso (kg)', l: left.peso, r: right.peso, inverse: true },
                        { label: 'Altura (cm)', l: left.altura, r: right.altura },
                        { label: 'IMC', l: left.imc ?? calcularIMC(left.peso, left.altura), r: right.imc ?? calcularIMC(right.peso, right.altura), inverse: true },
                        { label: '% Gordura', l: left.percentualGordura, r: right.percentualGordura, inverse: true },
                        { label: 'Massa Magra (kg)', l: left.massaMagra, r: right.massaMagra },
                        { label: 'Massa Gorda (kg)', l: left.massaGorda, r: right.massaGorda, inverse: true },
                      ].map(({ label, l, r, inverse }) => (
                        <tr key={label} className="border-b border-gray-100">
                          <td className="py-2 font-medium text-gray-900">{label}</td>
                          <td className="py-2 text-right text-gray-600">{l != null ? l.toFixed(1) : '—'}</td>
                          <td className="py-2 text-right text-gray-600">{r != null ? r.toFixed(1) : '—'}</td>
                          <td className="py-2 text-right">
                            <DeltaIndicator current={r} previous={l} inverse={inverse} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex gap-2">
                    <Badge>{classificarIMC(left.imc ?? calcularIMC(left.peso, left.altura)).label}</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge>{classificarIMC(right.imc ?? calcularIMC(right.peso, right.altura)).label}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Circunferências */}
              {(left.circunferencias || right.circunferencias) && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900">Circunferências (cm)</h2>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="py-2">Medida</th>
                          <th className="py-2 text-right">{formatDate(left.dataAvaliacao)}</th>
                          <th className="py-2 text-right">{formatDate(right.dataAvaliacao)}</th>
                          <th className="py-2 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.keys(circ_labels) as (keyof Circunferencias)[]).map((key) => {
                          const l = left.circunferencias?.[key];
                          const r = right.circunferencias?.[key];
                          if (l == null && r == null) return null;
                          return (
                            <tr key={key} className="border-b border-gray-100">
                              <td className="py-2 font-medium text-gray-900">{circ_labels[key]}</td>
                              <td className="py-2 text-right text-gray-600">{l != null ? l.toFixed(1) : '—'}</td>
                              <td className="py-2 text-right text-gray-600">{r != null ? r.toFixed(1) : '—'}</td>
                              <td className="py-2 text-right">
                                <DeltaIndicator current={r} previous={l} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {/* Observações */}
              {(left.observacoes || right.observacoes) && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900">Observações</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{formatDate(left.dataAvaliacao)}</p>
                        <p className="text-gray-700">{left.observacoes || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{formatDate(right.dataAvaliacao)}</p>
                        <p className="text-gray-700">{right.observacoes || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
