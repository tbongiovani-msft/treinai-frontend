import { Card, CardContent } from '@/components/ui';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <Card>
        <CardContent className="py-16 text-center">
          <Construction className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Em construção</h3>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ExerciciosPage() {
  return <PlaceholderPage title="Exercícios" description="Catálogo de exercícios com vídeos YouTube." />;
}

export function AtividadesPage() {
  return <PlaceholderPage title="Atividades" description="Registro e histórico de treinos realizados." />;
}

export function AvaliacoesPage() {
  return <PlaceholderPage title="Avaliações" description="Avaliações físicas e evolução corporal." />;
}

export function NutricaoPage() {
  return <PlaceholderPage title="Nutrição" description="Planos alimentares, refeições e macros." />;
}

export function RelatoriosPage() {
  return <PlaceholderPage title="Relatórios" description="Dashboard, evolução e frequência de treinos." />;
}

export function NotificacoesPage() {
  return <PlaceholderPage title="Notificações" description="Central de notificações do sistema." />;
}

export function AdminPage() {
  return <PlaceholderPage title="Administração" description="Gestão de tenants, usuários e configurações." />;
}

export function ConfiguracoesPage() {
  return <PlaceholderPage title="Configurações" description="Configurações do perfil e preferências." />;
}

export function NotFoundPage() {
  return <PlaceholderPage title="404 — Página não encontrada" description="A página que você procura não existe." />;
}
