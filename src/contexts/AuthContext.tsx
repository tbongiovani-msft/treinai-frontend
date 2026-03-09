import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import type { Usuario, UserRole, AuthUser, Aluno } from '@/types';

// ──────────────────────────────────────────────────────────────
// Auth mode: 'mock' for local dev testing, 'custom' for email/password login
// Set via VITE_AUTH_PROVIDER environment variable.
// ──────────────────────────────────────────────────────────────
const MOCK_AUTH_KEY = 'treinai_mock_user';

function isMockAuthEnabled(): boolean {
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

// Deterministic IDs matching seed data in Cosmos DB (mock mode only)
const MOCK_USER_IDS: Record<UserRole, string> = {
  admin: 'u-admin-001',
  professor: 'u-prof-001',
  aluno: 'u-aluno-camila',
};

const SEED_TENANT_ID = 't-treinai-001';

export function setMockUser(role: UserRole, nome: string, email: string): Usuario {
  const user: Usuario = {
    id: MOCK_USER_IDS[role] ?? `mock-${role}-${Date.now()}`,
    tenantId: SEED_TENANT_ID,
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
  alunoRecordId: string | null;
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
  loginWithUser: (usuario: Usuario) => Promise<void>;
  loginByEmail: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [alunoRecordId, setAlunoRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolves the Aluno record ID for aluno-role users
  const resolveAlunoRecord = useCallback(async () => {
    try {
      const res = await apiClient.get<Aluno>('/api/alunos/me');
      const id = res.data.id;
      setAlunoRecordId(id);
      localStorage.setItem('treinai_aluno_record_id', id);
    } catch {
      console.warn('Could not resolve aluno record ID');
    }
  }, []);

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
          // Resolve aluno record ID for aluno users
          if (mockUser.role === 'aluno') {
            await resolveAlunoRecord();
          }
        }
        setLoading(false);
        return;
      }

      // ── Custom auth path (email/password) ──
      // User is stored in localStorage after login/register.
      // Just restore from localStorage on page load.
      const storedUser = getMockUser(); // same localStorage key
      if (storedUser) {
        setUser(storedUser);
        localStorage.setItem('treinai_tenant_id', storedUser.tenantId);
        localStorage.setItem('treinai_user_id', storedUser.id);
        localStorage.setItem('treinai_user_role', storedUser.role);
        if (storedUser.role === 'aluno') {
          await resolveAlunoRecord();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (import.meta.env.DEV) {
        const devUser: Usuario = {
          id: 'u-prof-001',
          tenantId: SEED_TENANT_ID,
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
  }, [resolveAlunoRecord]);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  const login = () => {
    window.location.href = '/login';
  };

  const loginMock = async (role: UserRole, nome: string, email: string) => {
    const mockUser = setMockUser(role, nome, email);
    setUser(mockUser);
    if (role === 'aluno') {
      await resolveAlunoRecord();
    } else {
      setAlunoRecordId(null);
      localStorage.removeItem('treinai_aluno_record_id');
    }
  };

  /** Login with a full Usuario object (e.g. returned from register or login API) */
  const loginWithUser = async (usuario: Usuario) => {
    // Persist to localStorage exactly like setMockUser, but with real data
    localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(usuario));
    localStorage.setItem('treinai_tenant_id', usuario.tenantId);
    localStorage.setItem('treinai_user_id', usuario.id);
    localStorage.setItem('treinai_user_role', usuario.role);
    setUser(usuario);
    if (usuario.role === 'aluno') {
      await resolveAlunoRecord();
    } else {
      setAlunoRecordId(null);
      localStorage.removeItem('treinai_aluno_record_id');
    }
  };

  /** Login by email + password — calls POST /api/auth/login */
  const loginByEmail = async (email: string, senha: string): Promise<Usuario> => {
    // Set temporary tenant for the API call
    localStorage.setItem('treinai_tenant_id', SEED_TENANT_ID);
    const res = await apiClient.post<Usuario>('/api/auth/login', {
      email: email.trim().toLowerCase(),
      senha,
      tenantId: SEED_TENANT_ID,
    });
    const usuario = res.data;
    await loginWithUser(usuario);
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('treinai_tenant_id');
    localStorage.removeItem('treinai_user_id');
    localStorage.removeItem('treinai_user_role');
    localStorage.removeItem('treinai_aluno_record_id');
    localStorage.removeItem(MOCK_AUTH_KEY);
    setUser(null);
    setAuthUser(null);
    setAlunoRecordId(null);

    window.location.href = '/login';
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
        alunoRecordId,
        isMockAuth: isMockAuthEnabled(),
        login,
        loginMock,
        loginWithUser,
        loginByEmail,
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
