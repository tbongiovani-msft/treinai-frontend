import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck, GraduationCap, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui';
import type { UserRole } from '@/types';

// Mock profiles — only used in local development when VITE_AUTH_PROVIDER=mock
const MOCK_PROFILES: { role: UserRole; nome: string; email: string; icon: typeof User; label: string; desc: string }[] = [
  { role: 'admin',     nome: 'Admin TreinAI',        email: 'admin@treinai.com',    icon: ShieldCheck,   label: 'Admin',     desc: 'Gerenciar tenants, usuários e configurações' },
  { role: 'professor', nome: 'Prof. Ricardo Silva',   email: 'ricardo@treinai.com',  icon: GraduationCap, label: 'Professor', desc: 'Prescrever treinos e acompanhar alunos' },
  { role: 'aluno',     nome: 'Camila Jocope Ronchi',  email: 'camila@treinai.com',   icon: User,          label: 'Aluno',     desc: 'Visualizar treinos e registrar atividades' },
];

export function LoginPage() {
  const { isAuthenticated, loading, login, loginMock, isMockAuth } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleMockLogin = (profile: typeof MOCK_PROFILES[number]) => {
    loginMock(profile.role, profile.nome, profile.email);
    navigate('/');
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
            {/* B2C auth — production */}
            <div className="mt-8 space-y-4">
              <Button onClick={login} size="lg" className="w-full gap-2">
                <LogIn className="h-5 w-5" />
                Entrar com sua conta
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Autenticação segura via Azure AD B2C
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Não tem conta? Clique em <strong>"Entrar"</strong> e depois em <strong>"Sign up now"</strong> na tela do B2C.
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
