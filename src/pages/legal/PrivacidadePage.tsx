import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p className="text-xs text-gray-500">Última atualização: 07 de março de 2026</p>
        <p>
          Esta Política de Privacidade descreve como o <strong>treinAI</strong> coleta, utiliza,
          armazena e protege seus dados pessoais, em conformidade com a{' '}
          <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">1. Dados Coletados</h2>
        <p>Coletamos os seguintes dados pessoais:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Dados de identificação:</strong> nome, e-mail, telefone.</li>
          <li><strong>Dados de saúde:</strong> peso, altura, composição corporal, circunferências, avaliações físicas.</li>
          <li><strong>Dados de treino:</strong> exercícios realizados, cargas, duração, frequência.</li>
          <li><strong>Dados nutricionais:</strong> planos alimentares, refeições, macronutrientes.</li>
          <li><strong>Dados de uso:</strong> logs de acesso, ações realizadas na plataforma.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">2. Finalidade do Tratamento (LGPD Art. 7º)</h2>
        <p>Seus dados são tratados para as seguintes finalidades:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Prestação do serviço de acompanhamento de treinos e evolução física.</li>
          <li>Geração de relatórios e gráficos de evolução para o aluno e professor.</li>
          <li>Comunicação sobre novos treinos, avaliações e notificações do sistema.</li>
          <li>Cumprimento de obrigações legais e regulatórias.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">3. Base Legal (LGPD Art. 7º)</h2>
        <p>O tratamento dos seus dados pessoais está baseado em:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Consentimento</strong> (Art. 7º, I) — concedido no momento do cadastro.</li>
          <li><strong>Execução de contrato</strong> (Art. 7º, V) — necessário para prestação do serviço.</li>
          <li><strong>Legítimo interesse</strong> (Art. 7º, IX) — melhoria contínua da plataforma.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">4. Compartilhamento de Dados</h2>
        <p>Seus dados podem ser compartilhados com:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Seu professor/personal:</strong> dados de treino, avaliações e evolução.</li>
          <li><strong>Administradores do sistema:</strong> para gestão de contas.</li>
          <li><strong>Provedores de infraestrutura:</strong> Microsoft Azure (hospedagem de dados).</li>
        </ul>
        <p>
          Não vendemos, alugamos ou compartilhamos seus dados com terceiros
          para fins de marketing.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">5. Armazenamento e Segurança</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados armazenados no Azure Cosmos DB (região: Brasil Sul).</li>
          <li>Autenticação via Azure AD B2C com criptografia em trânsito (TLS 1.2+).</li>
          <li>Acesso ao banco de dados protegido por Managed Identity (sem senhas).</li>
          <li>Isolamento de dados por tenant (multi-tenancy com partition key).</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">6. Seus Direitos (LGPD Art. 18)</h2>
        <p>Você tem direito a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Confirmação</strong> da existência de tratamento de dados.</li>
          <li><strong>Acesso</strong> aos seus dados pessoais.</li>
          <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados.</li>
          <li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários.</li>
          <li><strong>Portabilidade</strong> dos dados a outro prestador de serviço.</li>
          <li><strong>Eliminação</strong> dos dados tratados com consentimento (direito ao esquecimento).</li>
          <li><strong>Informação</strong> sobre compartilhamento de dados com terceiros.</li>
          <li><strong>Revogação</strong> do consentimento a qualquer momento.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">7. Dados Sensíveis (LGPD Art. 11)</h2>
        <p>
          Dados de saúde (peso, composição corporal, avaliações) são considerados dados sensíveis
          pela LGPD. O tratamento desses dados é realizado mediante seu consentimento explícito,
          exclusivamente para a finalidade de acompanhamento de treinos e evolução física.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">8. Retenção de Dados</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados são mantidos enquanto sua conta estiver ativa.</li>
          <li>Após exclusão da conta, dados são anonimizados em até 30 dias.</li>
          <li>Logs de acesso são mantidos por 6 meses para fins de segurança.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">9. Cookies</h2>
        <p>
          Utilizamos cookies essenciais para autenticação e manutenção da sessão.
          Não utilizamos cookies de rastreamento ou publicidade.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">10. Encarregado de Dados (DPO)</h2>
        <p>
          Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados,
          entre em contato com nosso Encarregado de Proteção de Dados:{' '}
          <a href="mailto:privacidade@treinai.com.br" className="text-primary-600 hover:underline">
            privacidade@treinai.com.br
          </a>
        </p>

        <h2 className="text-lg font-semibold text-gray-900">11. Alterações</h2>
        <p>
          Esta política pode ser atualizada periodicamente. Alterações significativas serão
          comunicadas via notificação na plataforma. A data da última atualização estará
          sempre visível no topo deste documento.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">12. Legislação Aplicável</h2>
        <p>
          Esta Política de Privacidade é regida pela legislação brasileira, em especial
          a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>
      </div>
    </div>
  );
}
