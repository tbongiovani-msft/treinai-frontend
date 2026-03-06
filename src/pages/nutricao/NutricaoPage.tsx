import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import {
  Card, CardContent, CardHeader, CardFooter, Button, Input, Alert, Spinner, Badge,
} from '@/components/ui';
import { ArrowLeft, Save, Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { PlanoNutricional, Refeicao, ItemRefeicao, MacronutrientesMeta } from '@/types';

const emptyItem = (): ItemRefeicao => ({
  nome: '',
  quantidade: '',
  calorias: undefined,
  proteinas: undefined,
  carboidratos: undefined,
  gorduras: undefined,
});

const emptyRefeicao = (): Refeicao => ({
  nome: '',
  horario: '',
  itens: [emptyItem()],
});

// ── List ──
export function NutricaoListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [planos, setPlanos] = useState<PlanoNutricional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }
    apiClient.get<PlanoNutricional[]>(`/api/nutricao?alunoId=${alunoId}`)
      .then((r) => setPlanos(r.data.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Spinner className="mx-auto mt-20" />;

  const macroBar = (meta: MacronutrientesMeta) => {
    const total = meta.proteinas + meta.carboidratos + meta.gorduras;
    if (total === 0) return null;
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        <div className="bg-red-400" style={{ width: `${(meta.proteinas / total) * 100}%` }} />
        <div className="bg-yellow-400" style={{ width: `${(meta.carboidratos / total) * 100}%` }} />
        <div className="bg-blue-400" style={{ width: `${(meta.gorduras / total) * 100}%` }} />
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Planos Alimentares</h1>
        <Button onClick={() => navigate(`/nutricao/novo?alunoId=${alunoId}`)}>
          <Plus className="h-4 w-4" /> Novo Plano
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {!alunoId && <Alert type="warning" message="Selecione um aluno para ver planos alimentares." />}

      {alunoId && planos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">Nenhum plano alimentar cadastrado.</p>
          </CardContent>
        </Card>
      )}

      {planos.map((plano) => (
        <Card key={plano.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/nutricao/${plano.id}`)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{plano.nome}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(plano.dataInicio)}
                  {plano.dataFim && ` – ${formatDate(plano.dataFim)}`}
                </p>
              </div>
              <Badge variant={plano.ativo ? 'success' : 'default'}>
                {plano.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <Flame className="mx-auto h-4 w-4 text-orange-500" />
                <p className="font-medium">{plano.metaDiaria.calorias}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <Beef className="mx-auto h-4 w-4 text-red-500" />
                <p className="font-medium">{plano.metaDiaria.proteinas}g</p>
                <p className="text-xs text-gray-500">prot</p>
              </div>
              <div>
                <Wheat className="mx-auto h-4 w-4 text-yellow-600" />
                <p className="font-medium">{plano.metaDiaria.carboidratos}g</p>
                <p className="text-xs text-gray-500">carb</p>
              </div>
              <div>
                <Droplets className="mx-auto h-4 w-4 text-blue-500" />
                <p className="font-medium">{plano.metaDiaria.gorduras}g</p>
                <p className="text-xs text-gray-500">gord</p>
              </div>
            </div>
            {macroBar(plano.metaDiaria)}
            <p className="text-xs text-gray-500">{plano.refeicoes.length} refeições</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Detail ──
export function NutricaoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plano, setPlano] = useState<PlanoNutricional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<PlanoNutricional>(`/api/nutricao/${id}`)
      .then((r) => setPlano(r.data))
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner className="mx-auto mt-20" />;
  if (!plano) return <Alert type="error" message={error ?? 'Plano não encontrado'} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{plano.nome}</h1>
          {plano.descricao && <p className="text-sm text-gray-500">{plano.descricao}</p>}
        </div>
      </div>

      {/* Meta diária */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-gray-900">Meta Diária</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-2xl font-bold text-orange-600">{plano.metaDiaria.calorias}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-2xl font-bold text-red-600">{plano.metaDiaria.proteinas}g</p>
              <p className="text-xs text-gray-500">Proteínas</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-2xl font-bold text-yellow-600">{plano.metaDiaria.carboidratos}g</p>
              <p className="text-xs text-gray-500">Carboidratos</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-2xl font-bold text-blue-600">{plano.metaDiaria.gorduras}g</p>
              <p className="text-xs text-gray-500">Gorduras</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refeições */}
      {plano.refeicoes.map((ref, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">{ref.nome}</span>
              {ref.horario && <span className="text-sm text-gray-500">{ref.horario}</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {ref.itens.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.nome}</p>
                    <p className="text-xs text-gray-500">{item.quantidade}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {item.calorias != null && <span>{item.calorias} kcal</span>}
                    {item.proteinas != null && <span className="text-red-500">{item.proteinas}g P</span>}
                    {item.carboidratos != null && <span className="text-yellow-600">{item.carboidratos}g C</span>}
                    {item.gorduras != null && <span className="text-blue-500">{item.gorduras}g G</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Form ──
export function NutricaoFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alunoId = searchParams.get('alunoId') ?? '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    alunoId,
    nome: '',
    descricao: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    metaDiaria: { calorias: 2000, proteinas: 150, carboidratos: 250, gorduras: 70 } as MacronutrientesMeta,
    refeicoes: [emptyRefeicao()] as Refeicao[],
  });

  const updateMeta = (key: keyof MacronutrientesMeta, value: string) => {
    setForm((p) => ({ ...p, metaDiaria: { ...p.metaDiaria, [key]: parseInt(value) || 0 } }));
  };

  const addRefeicao = () => setForm((p) => ({ ...p, refeicoes: [...p.refeicoes, emptyRefeicao()] }));
  const removeRefeicao = (idx: number) => setForm((p) => ({ ...p, refeicoes: p.refeicoes.filter((_, i) => i !== idx) }));

  const updateRefeicao = (idx: number, field: keyof Refeicao, value: string) => {
    setForm((p) => ({
      ...p,
      refeicoes: p.refeicoes.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
  };

  const addItem = (rIdx: number) => {
    setForm((p) => ({
      ...p,
      refeicoes: p.refeicoes.map((r, i) => (i === rIdx ? { ...r, itens: [...r.itens, emptyItem()] } : r)),
    }));
  };

  const removeItem = (rIdx: number, iIdx: number) => {
    setForm((p) => ({
      ...p,
      refeicoes: p.refeicoes.map((r, i) => (i === rIdx ? { ...r, itens: r.itens.filter((_, j) => j !== iIdx) } : r)),
    }));
  };

  const updateItem = (rIdx: number, iIdx: number, field: keyof ItemRefeicao, value: string | number) => {
    setForm((p) => ({
      ...p,
      refeicoes: p.refeicoes.map((r, ri) =>
        ri === rIdx
          ? { ...r, itens: r.itens.map((item, ii) => (ii === iIdx ? { ...item, [field]: value } : item)) }
          : r
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await apiClient.post('/api/nutricao', form);
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
        <h1 className="text-2xl font-bold text-gray-900">Novo Plano Alimentar</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-gray-900">Informações</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="nome" label="Nome do plano *" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required placeholder="Ex: Cutting 2026" />
            <Input id="descricao" label="Descrição" value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="dataInicio" label="Data início *" type="date" value={form.dataInicio} onChange={(e) => setForm((p) => ({ ...p, dataInicio: e.target.value }))} required />
              <Input id="dataFim" label="Data fim" type="date" value={form.dataFim} onChange={(e) => setForm((p) => ({ ...p, dataFim: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-gray-900">Meta Diária</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input id="calorias" label="Calorias (kcal)" type="number" value={form.metaDiaria.calorias} onChange={(e) => updateMeta('calorias', e.target.value)} />
              <Input id="proteinas" label="Proteínas (g)" type="number" value={form.metaDiaria.proteinas} onChange={(e) => updateMeta('proteinas', e.target.value)} />
              <Input id="carboidratos" label="Carboidratos (g)" type="number" value={form.metaDiaria.carboidratos} onChange={(e) => updateMeta('carboidratos', e.target.value)} />
              <Input id="gorduras" label="Gorduras (g)" type="number" value={form.metaDiaria.gorduras} onChange={(e) => updateMeta('gorduras', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Refeições */}
        {form.refeicoes.map((ref, rIdx) => (
          <Card key={rIdx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Refeição {rIdx + 1}</span>
                {form.refeicoes.length > 1 && (
                  <button type="button" onClick={() => removeRefeicao(rIdx)} className="rounded p-1 text-danger-500 hover:bg-danger-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Nome *" value={ref.nome} onChange={(e) => updateRefeicao(rIdx, 'nome', e.target.value)} placeholder="Ex: Café da manhã" />
                <Input label="Horário" value={ref.horario ?? ''} onChange={(e) => updateRefeicao(rIdx, 'horario', e.target.value)} placeholder="Ex: 07:00" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase">Itens</h4>
                {ref.itens.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-start gap-2">
                    <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-6">
                      <input className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Alimento" value={item.nome} onChange={(e) => updateItem(rIdx, iIdx, 'nome', e.target.value)} />
                      <input className="rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem(rIdx, iIdx, 'quantidade', e.target.value)} />
                      <input className="rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="kcal" type="number" value={item.calorias ?? ''} onChange={(e) => updateItem(rIdx, iIdx, 'calorias', parseFloat(e.target.value) || 0)} />
                      <input className="rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="P (g)" type="number" value={item.proteinas ?? ''} onChange={(e) => updateItem(rIdx, iIdx, 'proteinas', parseFloat(e.target.value) || 0)} />
                      <input className="rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="C (g)" type="number" value={item.carboidratos ?? ''} onChange={(e) => updateItem(rIdx, iIdx, 'carboidratos', parseFloat(e.target.value) || 0)} />
                    </div>
                    <button type="button" onClick={() => removeItem(rIdx, iIdx)} className="mt-1 rounded p-1 text-gray-400 hover:text-danger-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(rIdx)}>
                  <Plus className="h-3 w-3" /> Item
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="secondary" onClick={addRefeicao} className="w-full">
          <Plus className="h-4 w-4" /> Adicionar Refeição
        </Button>

        <Card>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Criar Plano'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

// Fix missing import
