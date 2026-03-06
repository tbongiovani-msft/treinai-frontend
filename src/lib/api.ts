import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type { ApiError } from '@/types';

// ──────────────────────────────────────────────────────────────
// URL Routing — maps API path prefixes to Function App hosts.
//
// Local dev:  env vars are empty → relative URLs → Vite proxy.
// Azure:     env vars hold full Function App URLs → direct CORS calls.
//
// Set these in .env.production (or SWA app settings):
//   VITE_FUNC_ALUNOS=https://treinai-func-alunos-dev.azurewebsites.net
//   VITE_FUNC_TREINOS=https://treinai-func-treinos-dev.azurewebsites.net
//   ...
// ──────────────────────────────────────────────────────────────

/** Mapping: URL path prefix → Function App host (from env var, empty = relative) */
const PATH_TO_HOST: [prefix: string, host: string][] = [
  ['/api/alunos',        import.meta.env.VITE_FUNC_ALUNOS     ?? ''],
  ['/api/treinos',       import.meta.env.VITE_FUNC_TREINOS    ?? ''],
  ['/api/exercicios',    import.meta.env.VITE_FUNC_TREINOS    ?? ''], // same Function App
  ['/api/atividades',    import.meta.env.VITE_FUNC_ATIVIDADES ?? ''],
  ['/api/avaliacoes',    import.meta.env.VITE_FUNC_AVALIACOES ?? ''],
  ['/api/nutricao',      import.meta.env.VITE_FUNC_NUTRICAO   ?? ''],
  ['/api/relatorios',    import.meta.env.VITE_FUNC_RELATORIOS ?? ''],
  ['/api/auth',          import.meta.env.VITE_FUNC_ADMIN      ?? ''],
  ['/api/usuarios',      import.meta.env.VITE_FUNC_ADMIN      ?? ''],
  ['/api/notificacoes',  import.meta.env.VITE_FUNC_ADMIN      ?? ''],
  ['/api/objetivos',     import.meta.env.VITE_FUNC_ADMIN      ?? ''],
  ['/api/tenants',       import.meta.env.VITE_FUNC_ADMIN      ?? ''],
];

/** Resolve a relative API path to an absolute URL if the Function App host is configured. */
function resolveUrl(url: string): string {
  for (const [prefix, host] of PATH_TO_HOST) {
    if (url.startsWith(prefix) && host) {
      return `${host}${url}`;
    }
  }
  return url; // relative — handled by Vite proxy or SWA linked backend
}

// Legacy helper — kept for backward compatibility
const API_BASE_URLS: Record<string, string> = {
  alunos: '/api/alunos',
  treinos: '/api/treinos',
  exercicios: '/api/exercicios',
  atividades: '/api/atividades',
  avaliacoes: '/api/avaliacoes',
  nutricao: '/api/nutricao',
  relatorios: '/api/relatorios',
  auth: '/api/auth',
  usuarios: '/api/usuarios',
  notificacoes: '/api/notificacoes',
  objetivos: '/api/objetivos',
  tenants: '/api/tenants',
};

function createClient(): AxiosInstance {
  const client = axios.create({
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor:
  // 1) Resolve URL to the correct Function App host (Azure direct access)
  // 2) Inject dev headers (X-Tenant-Id, X-User-Id, X-User-Role)
  client.interceptors.request.use((config) => {
    // Resolve Function App URL
    if (config.url) {
      config.url = resolveUrl(config.url);
    }

    // SWA EasyAuth automatically includes cookie in production.
    // For local dev / direct Azure testing, inject headers.
    const tenantId = localStorage.getItem('treinai_tenant_id');
    const userId = localStorage.getItem('treinai_user_id');
    const userRole = localStorage.getItem('treinai_user_role');

    if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
    if (userId) config.headers['X-User-Id'] = userId;
    if (userRole) config.headers['X-User-Role'] = userRole;

    return config;
  });

  // Response interceptor — handle 401 redirects
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
        // Redirect to login — mock mode goes to /login, B2C goes to /.auth/login
        const authProvider = import.meta.env.VITE_AUTH_PROVIDER ?? 'mock';
        window.location.href = authProvider === 'mock' ? '/login' : '/.auth/login/aadb2c';
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createClient();

export function getApiUrl(service: keyof typeof API_BASE_URLS): string {
  return API_BASE_URLS[service];
}

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.detail) return data.detail;
    if (data?.title) return data.title;
    if (data?.errors) {
      return Object.values(data.errors).flat().join('. ');
    }
    return error.message;
  }
  return 'Erro inesperado. Tente novamente.';
}
