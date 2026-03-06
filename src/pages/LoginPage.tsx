import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Dumbbell, ShieldCheck, GraduationCap, User } from 'lucide-react';
import { Button } from '@/components/ui';
import type { UserRole } from '@/types';

const MOCK_PROFILES: { role: UserRole; nome: string; email: string; icon: typeof User; label: string; desc: string }[] = [
  { role: 'admin',     nome: 'Admin TreinAI',    email: 'admin@treinai.com',     icon: ShieldCheck,   label: 'Admin',     desc: 'Gerenciar tenants, usuários e configurações' },
  { role: 'professor', nome: 'Prof. Carlos',      email: 'carlos@treinai.com',    icon: GraduationCap, label: 'Professor', desc: 'Prescrever treinos e acompanhar alunos' },
  { role: 'aluno',     nome: 'Ana Aluna',         email: 'ana@treinai.com',       icon: User,          label: 'Aluno',     desc: 'Visualizar treinos e registrar atividades' },
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
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
          </>
        ) : (
          <>
            <Button onClick={login} size="lg" className="mt-8 w-full">
              Entrar com sua conta
            </Button>
            <p className="mt-6 text-xs text-gray-400">
              Autenticação segura via Azure AD B2C
            </p>
          </>
        )}
      </div>
    </div>
  );
}
