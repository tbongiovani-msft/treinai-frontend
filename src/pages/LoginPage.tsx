import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck, GraduationCap, User, LogIn, UserPlus, Mail } from 'lucide-react';
import { Button, Input, Alert } from '@/components/ui';
import { extractApiError } from '@/lib/api';
import type { UserRole } from '@/types';

const MOCK_PROFILES: { role: UserRole; nome: string; email: string; icon: typeof User; label: string; desc: string }[] = [
  { role: 'admin',     nome: 'Admin TreinAI',        email: 'admin@treinai.com',    icon: ShieldCheck,   label: 'Admin',     desc: 'Gerenciar tenants, usuários e configurações' },
  { role: 'professor', nome: 'Prof. Ricardo Silva',   email: 'ricardo@treinai.com',  icon: GraduationCap, label: 'Professor', desc: 'Prescrever treinos e acompanhar alunos' },
  { role: 'aluno',     nome: 'Camila Jocope Ronchi',  email: 'camila@treinai.com',   icon: User,          label: 'Aluno',     desc: 'Visualizar treinos e registrar atividades' },
];

export function LoginPage() {
  const { isAuthenticated, loading, login, loginMock, loginByEmail, isMockAuth } = useAuth();
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleMockLogin = (profile: typeof MOCK_PROFILES[number]) => {
    loginMock(profile.role, profile.nome, profile.email);
    navigate('/');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return;

    setEmailLoading(true);
    setEmailError(null);

    try {
      await loginByEmail(emailInput);
      navigate('/');
    } catch (err) {
      setEmailError(extractApiError(err) || 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {/* Logo */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600">
          <Dumbbell className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          trein<span className="text-primary-600">AI</span>
        </h1>
        <p className="mt-2 text-gray-500">
          Plataforma inteligente de treinos e acompanhamento
        </p>

        {isMockAuth ? (
          <>
            {/* Mock auth — development/testing */}
            <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
              <p className="text-sm text-amber-800 font-medium">Modo de teste</p>
              <p className="text-xs text-amber-600 mt-1">
                Azure AD B2C ainda não configurado. Selecione um perfil abaixo para testar a aplicação.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {MOCK_PROFILES.map((profile) => {
                const Icon = profile.icon;
                return (
                  <button
                    key={profile.role}
                    onClick={() => handleMockLogin(profile)}
                    className="flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-primary-300 hover:bg-primary-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{profile.label}</p>
                      <p className="text-xs text-gray-500">{profile.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Email login form for registered users */}
            <div className="mt-6 border-t pt-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Já tem uma conta cadastrada?</p>
              <form onSubmit={handleEmailLogin} className="space-y-3">
                {emailError && <Alert type="error" message={emailError} />}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    autoComplete="email"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!emailInput.includes('@') || emailLoading}
                    className="gap-1.5 shrink-0"
                  >
                    {emailLoading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Entrar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-4 border-t pt-4">
              <Link
                to="/cadastro"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition"
              >
                <UserPlus className="h-4 w-4" />
                Criar nova conta (testar cadastro)
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* B2C auth — production */}
            <div className="mt-8 space-y-3">
              <Button onClick={login} size="lg" className="w-full gap-2">
                <LogIn className="h-5 w-5" />
                Entrar com sua conta
              </Button>
              <Link to="/cadastro">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <UserPlus className="h-5 w-5" />
                  Criar nova conta
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-gray-400">
              Autenticação segura via Azure AD B2C
            </p>
          </>
        )}

        {/* Footer links */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400">
          <Link to="/termos" className="hover:text-gray-600 transition">Termos de Uso</Link>
          <span>·</span>
          <Link to="/privacidade" className="hover:text-gray-600 transition">Privacidade</Link>
        </div>
      </div>
    </div>
  );
}
