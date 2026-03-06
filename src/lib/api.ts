import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type { ApiError } from '@/types';

// Azure Static Web App proxies API calls through its own domain
// In development, Vite proxy forwards /api/* to local Functions
const API_BASE_URLS: Record<string, string> = {
  alunos: '/api/alunos',
  treinos: '/api/treinos',
  exercicios: '/api/exercicios',
  atividades: '/api/atividades',
  avaliacoes: '/api/avaliacoes',
  nutricao: '/api/planos-nutricionais',
  relatorios: '/api/relatorios',
  admin: '/api/admin',
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

  // Request interceptor — SWA EasyAuth automatically includes cookie.
  // For local dev, we inject X-Tenant-Id and X-User-Id headers.
  client.interceptors.request.use((config) => {
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
        // Redirect to SWA login
        window.location.href = '/.auth/login/aadb2c';
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
