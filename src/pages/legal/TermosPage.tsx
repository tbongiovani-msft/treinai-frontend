import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermosPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p className="text-xs text-gray-500">Última atualização: 07 de março de 2026</p>

        <h2 className="text-lg font-semibold text-gray-900">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar a plataforma <strong>treinAI</strong>, você concorda com estes Termos de Uso.
          Caso não concorde com algum dos termos, não utilize a plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">2. Descrição do Serviço</h2>
        <p>
          O treinAI é uma plataforma web para controle de treinos, atividades físicas, nutrição,
          avaliações físicas e objetivos. O sistema é destinado ao uso por profissionais de educação
          física (professores/personais) e seus alunos.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">3. Cadastro e Conta</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>O cadastro é gratuito e aberto a qualquer pessoa.</li>
          <li>Novos usuários recebem o perfil <strong>aluno</strong> por padrão.</li>
          <li>O administrador pode promover usuários para professor ou admin.</li>
          <li>Você é responsável pela veracidade dos dados informados.</li>
          <li>Mantenha suas credenciais de acesso em sigilo.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">4. Uso Adequado</h2>
        <p>Ao utilizar o treinAI, você se compromete a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Não utilizar a plataforma para fins ilegais ou não autorizados.</li>
          <li>Não tentar acessar dados de outros usuários sem autorização.</li>
          <li>Não interferir no funcionamento da plataforma.</li>
          <li>Informar dados verdadeiros e atualizados.</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900">5. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo da plataforma (código, design, textos, logotipos) é de propriedade
          do treinAI e protegido por leis de propriedade intelectual.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">6. Limitação de Responsabilidade</h2>
        <p>
          O treinAI não substitui acompanhamento médico ou orientação profissional de educação física.
          Os treinos e planos nutricionais são de responsabilidade dos profissionais que os prescrevem.
          A plataforma não se responsabiliza por lesões ou danos decorrentes da execução de treinos.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">7. Disponibilidade</h2>
        <p>
          O treinAI se esforça para manter a plataforma disponível 24/7, mas não garante
          disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">8. Cancelamento</h2>
        <p>
          Você pode solicitar o cancelamento da sua conta a qualquer momento. Após o cancelamento,
          seus dados serão tratados conforme a Política de Privacidade e a LGPD.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">9. Alterações</h2>
        <p>
          Estes termos podem ser atualizados periodicamente. Alterações significativas serão
          comunicadas via notificação na plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900">10. Contato</h2>
        <p>
          Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail:{' '}
          <a href="mailto:contato@treinai.com.br" className="text-primary-600 hover:underline">
            contato@treinai.com.br
          </a>
        </p>

        <h2 className="text-lg font-semibold text-gray-900">11. Foro</h2>
        <p>
          Fica eleito o foro da comarca de São Paulo — SP para dirimir quaisquer controvérsias
          decorrentes destes Termos de Uso.
        </p>
      </div>
    </div>
  );
}
