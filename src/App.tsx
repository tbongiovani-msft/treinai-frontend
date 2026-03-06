import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { RoleGuard } from '@/components/guards/RoleGuard';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AlunosListPage } from '@/pages/alunos/AlunosListPage';
import { AlunoFormPage } from '@/pages/alunos/AlunoFormPage';
import { AlunoDetailPage } from '@/pages/alunos/AlunoDetailPage';
import { TreinosListPage } from '@/pages/treinos/TreinosListPage';
import { TreinoDetailPage } from '@/pages/treinos/TreinoDetailPage';
import {
  ExerciciosPage,
  AtividadesPage,
  AvaliacoesPage,
  NutricaoPage,
  RelatoriosPage,
  NotificacoesPage,
  AdminPage,
  ConfiguracoesPage,
  NotFoundPage,
} from '@/pages/PlaceholderPages';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated layout */}
          <Route element={<AppLayout />}>
            {/* Dashboard — all roles */}
            <Route
              path="/"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <DashboardPage />
                </RoleGuard>
              }
            />

            {/* Alunos — admin + professor */}
            <Route
              path="/alunos"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <AlunosListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/alunos/novo"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <AlunoFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/alunos/:id"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <AlunoDetailPage />
                </RoleGuard>
              }
            />

            {/* Treinos — all roles */}
            <Route
              path="/treinos"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <TreinosListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/treinos/:id"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <TreinoDetailPage />
                </RoleGuard>
              }
            />

            {/* Exercícios — admin + professor */}
            <Route
              path="/exercicios"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <ExerciciosPage />
                </RoleGuard>
              }
            />

            {/* Atividades — all roles */}
            <Route
              path="/atividades"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <AtividadesPage />
                </RoleGuard>
              }
            />

            {/* Avaliações — all roles */}
            <Route
              path="/avaliacoes"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <AvaliacoesPage />
                </RoleGuard>
              }
            />

            {/* Nutrição — all roles */}
            <Route
              path="/nutricao"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <NutricaoPage />
                </RoleGuard>
              }
            />

            {/* Relatórios — admin + professor */}
            <Route
              path="/relatorios"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <RelatoriosPage />
                </RoleGuard>
              }
            />

            {/* Notificações — all roles */}
            <Route
              path="/notificacoes"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <NotificacoesPage />
                </RoleGuard>
              }
            />

            {/* Admin — admin only */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminPage />
                </RoleGuard>
              }
            />

            {/* Configurações — all roles */}
            <Route
              path="/configuracoes"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <ConfiguracoesPage />
                </RoleGuard>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
