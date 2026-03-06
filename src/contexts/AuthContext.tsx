import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import type { Usuario, UserRole, AuthUser } from '@/types';

interface AuthContextType {
  user: Usuario | null;
  authUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isProfessor: boolean;
  isAluno: boolean;
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get SWA EasyAuth identity
      const authRes = await fetch('/.auth/me');
      const authData = await authRes.json();
      const clientPrincipal = authData.clientPrincipal;

      if (!clientPrincipal) {
        setLoading(false);
        return;
      }

      setAuthUser(clientPrincipal);

      // 2. Get user profile from our API (GET /usuarios/me)
      const meRes = await apiClient.get<Usuario>('/api/usuarios/me');
      const me = meRes.data;

      setUser(me);

      // Store for API interceptor
      localStorage.setItem('treinai_tenant_id', me.tenantId);
      localStorage.setItem('treinai_user_id', me.id);
      localStorage.setItem('treinai_user_role', me.role);
    } catch (err) {
      console.error('Auth error:', err);
      // In development, set a mock user if EasyAuth is not available
      if (import.meta.env.DEV) {
        const devUser: Usuario = {
          id: 'dev-user-001',
          tenantId: 'dev-tenant-001',
          nome: 'Dev Professor',
          email: 'dev@treinai.com',
          b2CObjectId: 'dev-b2c-object',
          role: 'professor',
          ativo: true,
          dataCadastro: new Date().toISOString(),
        };
        setUser(devUser);
        localStorage.setItem('treinai_tenant_id', devUser.tenantId);
        localStorage.setItem('treinai_user_id', devUser.id);
        localStorage.setItem('treinai_user_role', devUser.role);
      } else {
        setError('Falha ao carregar perfil do usuário.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const login = () => {
    window.location.href = '/.auth/login/aadb2c';
  };

  const logout = () => {
    localStorage.removeItem('treinai_tenant_id');
    localStorage.removeItem('treinai_user_id');
    localStorage.removeItem('treinai_user_role');
    window.location.href = '/.auth/logout';
  };

  const refresh = async () => {
    await fetchAuth();
  };

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        loading,
        error,
        isAuthenticated: !!user,
        role,
        isAdmin: role === 'admin',
        isProfessor: role === 'professor',
        isAluno: role === 'aluno',
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
