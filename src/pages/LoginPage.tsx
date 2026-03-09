import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck, GraduationCap, User, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Alert } from '@/components/ui';
import { extractApiError } from '@/lib/api';
import type { UserRole } from '@/types';

// Mock profiles — only used in local development when VITE_AUTH_PROVIDER=mock
const MOCK_PROFILES: { role: UserRole; nome: string; email: string; icon: typeof User; label: string; desc: string }[] = [
  { role: 'admin',     nome: 'Admin TreinAI',        email: 'admin@treinai.com',    icon: ShieldCheck,   label: 'Admin',     desc: 'Gerenciar tenants, usuários e configurações' },
  { role: 'professor', nome: 'Prof. Ricardo Silva',   email: 'ricardo@treinai.com',  icon: GraduationCap, label: 'Professor', desc: 'Prescrever treinos e acompanhar alunos' },
  { role: 'aluno',     nome: 'Camila Jocope Ronchi',  email: 'camila@treinai.com',   icon: User,          label: 'Aluno',     desc: 'Visualizar treinos e registrar atividades' },
];

export function LoginPage() {
  const { isAuthenticated, loading, loginMock, loginByEmail, isMockAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleMockLogin = (profile: typeof MOCK_PROFILES[number]) => {
    loginMock(profile.role, profile.nome, profile.email);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;

    setLoginLoading(true);
    setError(null);

    try {
      await loginByEmail(email, senha);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoginLoading(false);
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
            {/* Mock auth — local development only */}
            <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
              <p className="text-sm text-amber-800 font-medium">Modo de teste (local)</p>
              <p className="text-xs text-amber-600 mt-1">
                Selecione um perfil abaixo para testar localmente.
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
          </>
        ) : (
          <>
            {/* Email/password login */}
            <form onSubmit={handleEmailLogin} className="mt-8 space-y-4 text-left">
              {error && <Alert type="error" message={error} />}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={!email.trim() || !senha.trim() || loginLoading}
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Não tem conta?{' '}
                <Link to="/cadastro" className="font-medium text-primary-600 hover:text-primary-700 underline">
                  Criar conta
                </Link>
              </p>
            </div>
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
