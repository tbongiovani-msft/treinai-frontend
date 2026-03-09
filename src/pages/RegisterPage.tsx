import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Alert } from '@/components/ui';
import { apiClient, extractApiError } from '@/lib/api';

const SEED_TENANT_ID = 't-treinai-001';

export function RegisterPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValid = nome.trim().length >= 2 && email.includes('@') && aceitouTermos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/api/auth/register', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        tenantId: SEED_TENANT_ID,
      });
      setSuccess(true);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Cadastro realizado!</h2>
          <p className="mt-3 text-gray-600">
            Seu perfil inicial é <span className="font-semibold text-primary-600">aluno</span>.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            O administrador foi notificado e poderá ajustar seu perfil para professor ou admin, se necessário.
          </p>
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="mt-8 w-full"
          >
            Ir para o Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Criar conta no trein<span className="text-primary-600">AI</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Cadastre-se gratuitamente. Seu perfil inicial será <strong>aluno</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <Alert type="error" message={error} />}

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Maria da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              maxLength={200}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Ex: maria@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={320}
              autoComplete="email"
            />
          </div>

          {/* Terms acceptance */}
          <div className="flex items-start gap-3">
            <input
              id="termos"
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="termos" className="text-sm text-gray-600">
              Li e aceito os{' '}
              <Link to="/termos" target="_blank" className="font-medium text-primary-600 hover:text-primary-700 underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" target="_blank" className="font-medium text-primary-600 hover:text-primary-700 underline">
                Política de Privacidade
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={!isValid || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cadastrando...
              </span>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Criar minha conta
              </>
            )}
          </Button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Já tenho uma conta
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
          <Link to="/termos" className="hover:text-gray-600 transition">Termos de Uso</Link>
          <span>·</span>
          <Link to="/privacidade" className="hover:text-gray-600 transition">Privacidade</Link>
        </div>
      </div>
    </div>
  );
}
