import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, extractApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardFooter, Button, Input, Alert } from '@/components/ui';
import { ArrowLeft, Save } from 'lucide-react';
import type { Aluno } from '@/types';

type AlunoForm = Omit<Aluno, 'id' | 'tenantId' | 'criadoEm' | 'atualizadoEm' | 'ativo' | 'professorId'>;

export function AlunoFormPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AlunoForm>({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    peso: undefined,
    altura: undefined,
    objetivo: '',
  });

  const handleChange = (field: keyof AlunoForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await apiClient.post('/api/alunos', form);
      navigate('/alunos');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Aluno</h1>
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
