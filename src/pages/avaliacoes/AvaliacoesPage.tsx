import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Spinner, Badge,
} from '@/components/ui';
import { ArrowLeft, Save, Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDate, calcularIMC, classificarIMC } from '@/lib/utils';
import type { Avaliacao, Circunferencias } from '@/types';

const circ_fields: { key: keyof Circunferencias; label: string }[] = [
  { key: 'torax', label: 'Tórax' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'bracoD', label: 'Braço D' },
  { key: 'bracoE', label: 'Braço E' },
  { key: 'coxaD', label: 'Coxa D' },
  { key: 'coxaE', label: 'Coxa E' },
  { key: 'panturrilhaD', label: 'Panturrilha D' },
  { key: 'panturrilhaE', label: 'Panturrilha E' },
];

export function AvaliacoesListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { alunoRecordId, isAluno, isProfessor, isAdmin } = useAuth();
  const alunoId = searchParams.get('alunoId') || (isAluno ? alunoRecordId : null) || '';

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }
    apiClient.get<Avaliacao[]>(`/api/avaliacoes?alunoId=${alunoId}`)
      .then((r) => setAvaliacoes(r.data.sort((a, b) => new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime())))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const deltaIcon = (curr: number, prev: number) => {
    const diff = curr - prev;
    if (Math.abs(diff) < 0.01) return null;
    return diff > 0
      ? <TrendingUp className="inline h-3 w-3 text-red-500" />
      : <TrendingDown className="inline h-3 w-3 text-green-500" />;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Avaliações Físicas</h1>
        {(isAdmin || isProfessor) && (
          <Button onClick={() => navigate(`/avaliacoes/nova?alunoId=${alunoId}`)}>
            <Plus className="h-4 w-4" /> Nova Avaliação
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}
      {!alunoId && <Alert type="warning" message="Selecione um aluno para ver avaliações." />}

      {alunoId && avaliacoes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Nenhuma avaliação registrada.</p>
          </CardContent>
        </Card>
      )}

      {avaliacoes.map((av, idx) => {
        const prev = avaliacoes[idx + 1]; // ordered desc
        const imc = av.imc ?? calcularIMC(av.peso, av.altura);
        return (
          <Card key={av.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/avaliacoes/${av.id}`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{formatDate(av.dataAvaliacao)}</span>
                <Badge>{classificarIMC(imc).label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-gray-500">Peso</p>
                  <p className="font-medium">{av.peso} kg {prev && deltaIcon(av.peso, prev.peso)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Altura</p>
                  <p className="font-medium">{av.altura} cm</p>
                </div>
                <div>
                  <p className="text-gray-500">IMC</p>
                  <p className="font-medium">{imc.toFixed(1)}</p>
                </div>
                {av.percentualGordura != null && (
                  <div>
                    <p className="text-gray-500">% Gordura</p>
                    <p className="font-medium">
                      {av.percentualGordura.toFixed(1)}%
                      {prev?.percentualGordura != null && deltaIcon(av.percentualGordura, prev.percentualGordura)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Avaliação Form ──
export function AvaliacaoFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';
  const isEditing = !!id;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    alunoId,
    dataAvaliacao: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    percentualGordura: '',
    massaMagra: '',
    massaGorda: '',
    observacoes: '',
    circunferencias: {} as Partial<Circunferencias>,
  });

  useEffect(() => {
    if (!id) return;
    apiClient.get<Avaliacao>(`/api/avaliacoes/${id}`).then((r) => {
      const av = r.data;
      setForm({
        alunoId: av.alunoId,
        dataAvaliacao: av.dataAvaliacao.split('T')[0],
        peso: String(av.peso),
        altura: String(av.altura),
        percentualGordura: av.percentualGordura != null ? String(av.percentualGordura) : '',
        massaMagra: av.massaMagra != null ? String(av.massaMagra) : '',
        massaGorda: av.massaGorda != null ? String(av.massaGorda) : '',
        observacoes: av.observacoes ?? '',
        circunferencias: av.circunferencias ?? {},
      });
    }).catch((err) => setError(extractApiError(err)));
  }, [id]);

  const updateCirc = (key: keyof Circunferencias, value: string) => {
    setForm((prev) => ({
      ...prev,
      circunferencias: { ...prev.circunferencias, [key]: value ? parseFloat(value) : undefined },
    }));
  };

  const imcPreview = form.peso && form.altura
    ? calcularIMC(parseFloat(form.peso), parseFloat(form.altura))
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = {
        alunoId: form.alunoId,
        dataAvaliacao: form.dataAvaliacao,
        peso: parseFloat(form.peso),
        altura: parseFloat(form.altura),
        percentualGordura: form.percentualGordura ? parseFloat(form.percentualGordura) : undefined,
        massaMagra: form.massaMagra ? parseFloat(form.massaMagra) : undefined,
        massaGorda: form.massaGorda ? parseFloat(form.massaGorda) : undefined,
        observacoes: form.observacoes || undefined,
        circunferencias: Object.keys(form.circunferencias).length > 0 ? form.circunferencias : undefined,
      };
      if (isEditing) {
        await apiClient.put(`/api/avaliacoes/${id}`, payload);
      } else {
        await apiClient.post('/api/avaliacoes', payload);
      }
      navigate(-1);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Avaliação' : 'Nova Avaliação Física'}
        </h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Medidas básicas */}
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-gray-900">Medidas Básicas</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="dataAvaliacao" label="Data *" type="date" value={form.dataAvaliacao} onChange={(e) => setForm((p) => ({ ...p, dataAvaliacao: e.target.value }))} required />
              <Input id="alunoId" label="ID Aluno *" value={form.alunoId} onChange={(e) => setForm((p) => ({ ...p, alunoId: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input id="peso" label="Peso (kg) *" type="number" step="0.1" value={form.peso} onChange={(e) => setForm((p) => ({ ...p, peso: e.target.value }))} required />
              <Input id="altura" label="Altura (cm) *" type="number" step="0.1" value={form.altura} onChange={(e) => setForm((p) => ({ ...p, altura: e.target.value }))} required />
              {imcPreview && (
                <div className="flex flex-col justify-end">
                  <p className="text-xs text-gray-500">IMC calculado</p>
                  <p className="text-lg font-bold text-gray-900">{imcPreview.toFixed(1)} <span className="text-sm font-normal text-gray-500">{classificarIMC(imcPreview).label}</span></p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input id="percentualGordura" label="% Gordura" type="number" step="0.1" value={form.percentualGordura} onChange={(e) => setForm((p) => ({ ...p, percentualGordura: e.target.value }))} />
              <Input id="massaMagra" label="Massa Magra (kg)" type="number" step="0.1" value={form.massaMagra} onChange={(e) => setForm((p) => ({ ...p, massaMagra: e.target.value }))} />
              <Input id="massaGorda" label="Massa Gorda (kg)" type="number" step="0.1" value={form.massaGorda} onChange={(e) => setForm((p) => ({ ...p, massaGorda: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* Circunferências */}
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-gray-900">Circunferências (cm)</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {circ_fields.map(({ key, label }) => (
                <Input
                  key={key}
                  id={key}
                  label={label}
                  type="number"
                  step="0.1"
                  value={form.circunferencias[key] ?? ''}
                  onChange={(e) => updateCirc(key, e.target.value)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardContent>
            <Input
              id="observacoes"
              label="Observações"
              value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              placeholder="Notas sobre a avaliação..."
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar Avaliação'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
