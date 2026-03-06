import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardFooter, Button, Input, Alert } from '@/components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Aluno } from '@/types';

type AlunoFormData = Omit<Aluno, 'id' | 'tenantId' | 'criadoEm' | 'atualizadoEm' | 'ativo' | 'professorId' | 'userId' | 'fotoUrl'>;

export function AlunoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AlunoFormData>({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    peso: undefined,
    altura: undefined,
    objetivo: '',
    observacoes: '',
  });

  // Load existing aluno for edit mode
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiClient.get<Aluno>(`/api/alunos/${id}`);
        const a = res.data;
        setForm({
          nome: a.nome,
          email: a.email,
          telefone: a.telefone ?? '',
          dataNascimento: a.dataNascimento ? a.dataNascimento.split('T')[0] : '',
          peso: a.peso,
          altura: a.altura,
          objetivo: a.objetivo ?? '',
          observacoes: a.observacoes ?? '',
        });
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (field: keyof AlunoFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (isEdit) {
        await apiClient.put(`/api/alunos/${id}`, form);
      } else {
        await apiClient.post('/api/alunos', form);
      }
      navigate('/alunos');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Aluno' : 'Novo Aluno'}</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Dados do Aluno</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="nome"
              label="Nome completo *"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              required
              placeholder="Ex: João Silva"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="email"
                label="E-mail *"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="joao@email.com"
              />
              <Input
                id="telefone"
                label="Telefone"
                value={form.telefone ?? ''}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                id="dataNascimento"
                label="Data de nascimento"
                type="date"
                value={form.dataNascimento ?? ''}
                onChange={(e) => handleChange('dataNascimento', e.target.value)}
              />
              <Input
                id="peso"
                label="Peso (kg)"
                type="number"
                step="0.1"
                min="0"
                value={form.peso ?? ''}
                onChange={(e) => handleChange('peso', parseFloat(e.target.value) || 0)}
                placeholder="75.5"
              />
              <Input
                id="altura"
                label="Altura (cm)"
                type="number"
                min="0"
                value={form.altura ?? ''}
                onChange={(e) => handleChange('altura', parseFloat(e.target.value) || 0)}
                placeholder="175"
              />
            </div>
            <Input
              id="objetivo"
              label="Objetivo"
              value={form.objetivo ?? ''}
              onChange={(e) => handleChange('objetivo', e.target.value)}
              placeholder="Ex: Hipertrofia, Emagrecimento, Condicionamento..."
            />
            <div>
              <label htmlFor="observacoes" className="mb-1.5 block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="observacoes"
                value={form.observacoes ?? ''}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Lesões, restrições médicas, preferências..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
