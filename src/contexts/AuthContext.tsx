import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import type { Usuario, UserRole, AuthUser } from '@/types';

// ──────────────────────────────────────────────────────────────
// Mock auth: until Azure AD B2C is configured (E15-07), allow
// a simulated login so the app is fully testable. When B2C is
// ready, remove the mock block and everything falls back to
// the EasyAuth flow already coded below.
// ──────────────────────────────────────────────────────────────
const MOCK_AUTH_KEY = 'treinai_mock_user';

function isMockAuthEnabled(): boolean {
  // Mock auth is used when B2C is not configured yet.
  // To disable mock auth after B2C setup, set VITE_AUTH_PROVIDER=aadb2c
  return (import.meta.env.VITE_AUTH_PROVIDER ?? 'mock') === 'mock';
}

function getMockUser(): Usuario | null {
  try {
    const raw = localStorage.getItem(MOCK_AUTH_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

export function setMockUser(role: UserRole, nome: string, email: string): Usuario {
  const user: Usuario = {
    id: `mock-${role}-${Date.now()}`,
    tenantId: 'dev-tenant-001',
    nome,
    email,
    b2CObjectId: `mock-b2c-${role}`,
    role,
    ativo: true,
    dataCadastro: new Date().toISOString(),
  };
  localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(user));
  localStorage.setItem('treinai_tenant_id', user.tenantId);
  localStorage.setItem('treinai_user_id', user.id);
  localStorage.setItem('treinai_user_role', user.role);
  return user;
}

// ──────────────────────────────────────────────────────────────

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
  isMockAuth: boolean;
  login: () => void;
  loginMock: (role: UserRole, nome: string, email: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ── Mock auth path ──
      if (isMockAuthEnabled()) {
        const mockUser = getMockUser();
        if (mockUser) {
          setUser(mockUser);
          localStorage.setItem('treinai_tenant_id', mockUser.tenantId);
          localStorage.setItem('treinai_user_id', mockUser.id);
          localStorage.setItem('treinai_user_role', mockUser.role);
        }
        setLoading(false);
        return;
      }

      // ── EasyAuth (B2C) path ──
      const authRes = await fetch('/.auth/me');
      const authData = await authRes.json();
      const clientPrincipal = authData.clientPrincipal;

      if (!clientPrincipal) {
        setLoading(false);
        return;
      }

      setAuthUser(clientPrincipal);

      const meRes = await apiClient.get<Usuario>('/api/usuarios/me');
      const me = meRes.data;

      setUser(me);

      localStorage.setItem('treinai_tenant_id', me.tenantId);
      localStorage.setItem('treinai_user_id', me.id);
      localStorage.setItem('treinai_user_role', me.role);
    } catch (err) {
      console.error('Auth error:', err);
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
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  const login = () => {
    if (isMockAuthEnabled()) {
      // Redirect to our login page (mock mode handles it)
      window.location.href = '/login';
    } else {
      window.location.href = '/.auth/login/aadb2c';
    }
  };

  const loginMock = (role: UserRole, nome: string, email: string) => {
    const mockUser = setMockUser(role, nome, email);
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('treinai_tenant_id');
    localStorage.removeItem('treinai_user_id');
    localStorage.removeItem('treinai_user_role');
    localStorage.removeItem(MOCK_AUTH_KEY);
    setUser(null);
    setAuthUser(null);

    if (isMockAuthEnabled()) {
      window.location.href = '/login';
    } else {
      window.location.href = '/.auth/logout';
    }
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
        isMockAuth: isMockAuthEnabled(),
        login,
        loginMock,
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
