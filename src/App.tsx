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
import { TreinoFormPage } from '@/pages/treinos/TreinoFormPage';
import { ExerciciosPage } from '@/pages/exercicios/ExerciciosPage';
import { RegistroAtividadePage } from '@/pages/atividades/RegistroAtividadePage';
import { HistoricoPage } from '@/pages/atividades/HistoricoPage';
import { AvaliacoesListPage, AvaliacaoFormPage } from '@/pages/avaliacoes/AvaliacoesPage';
import { NutricaoListPage, NutricaoDetailPage, NutricaoFormPage } from '@/pages/nutricao/NutricaoPage';
import { RelatoriosPage } from '@/pages/relatorios/RelatoriosPage';
import { ObjetivosPage } from '@/pages/objetivos/ObjetivosPage';
import { NotificacoesPage } from '@/pages/notificacoes/NotificacoesPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { ConfiguracoesPage } from '@/pages/configuracoes/ConfiguracoesPage';
import { NotFoundPage } from '@/pages/PlaceholderPages';

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
              path="/treinos/novo"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <TreinoFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/treinos/:id/editar"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <TreinoFormPage />
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
                  <HistoricoPage />
                </RoleGuard>
              }
            />
            <Route
              path="/atividades/registrar"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <RegistroAtividadePage />
                </RoleGuard>
              }
            />

            {/* Avaliações — all roles */}
            <Route
              path="/avaliacoes"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <AvaliacoesListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/avaliacoes/nova"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <AvaliacaoFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/avaliacoes/:id/editar"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <AvaliacaoFormPage />
                </RoleGuard>
              }
            />

            {/* Nutrição — all roles */}
            <Route
              path="/nutricao"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <NutricaoListPage />
                </RoleGuard>
              }
            />
            <Route
              path="/nutricao/novo"
              element={
                <RoleGuard allowedRoles={['admin', 'professor']}>
                  <NutricaoFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="/nutricao/:id"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <NutricaoDetailPage />
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

            {/* Objetivos — all roles */}
            <Route
              path="/objetivos"
              element={
                <RoleGuard allowedRoles={['admin', 'professor', 'aluno']}>
                  <ObjetivosPage />
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
