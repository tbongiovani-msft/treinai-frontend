import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui';

export function LoginPage() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

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

        <Button onClick={login} size="lg" className="mt-8 w-full">
          Entrar com sua conta
        </Button>

        <p className="mt-6 text-xs text-gray-400">
          Autenticação segura via Azure AD B2C
        </p>
      </div>
    </div>
  );
}
