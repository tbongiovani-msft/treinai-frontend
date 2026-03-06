import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { PageLoader, Alert } from '@/components/ui';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <Alert
          type="error"
          title="Acesso negado"
          message={`Seu perfil (${role}) não tem permissão para acessar esta página.`}
        />
      </div>
    );
  }

  // Suppress unused variable warning — user check only for auth guard
  void user;

  return <>{children}</>;
}
