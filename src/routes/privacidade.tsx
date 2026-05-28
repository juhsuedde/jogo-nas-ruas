import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Jogo nas Ruas" },
      {
        name: "description",
        content: "Política de privacidade do Jogo nas Ruas, em conformidade com a Lei Geral de Proteção de Dados (LGPD).",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="absolute inset-0 overflow-y-auto pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-brasil-navy/10">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <Link
            to="/perfil"
            className="size-10 rounded-full bg-card handmade-border flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4 text-brasil-navy" />
          </Link>
          <h1 className="font-display text-sm text-brasil-navy tracking-wider text-center">
            POLÍTICA DE PRIVACIDADE
          </h1>
          <div className="size-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 pb-12 space-y-5 text-[13px] text-brasil-navy/80 leading-relaxed">
        <p className="font-semibold text-brasil-navy">
          Última atualização: maio de 2026
        </p>

        <p>
          O <strong>Jogo nas Ruas</strong> ("nós", "nosso" ou "plataforma") leva a sua privacidade a sério. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD).
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          1. DADOS COLETADOS
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (fornecidos no momento do registro).</li>
          <li><strong>Dados de localização:</strong> coordenadas geográficas (latitude/longitude) coletadas com seu consentimento para exibir locais próximos e sugerir endereço ao cadastrar um novo ponto.</li>
          <li><strong>Dados de uso:</strong> locais visitados, partidas confirmadas, avaliações e interações na plataforma.</li>
          <li><strong>Identificadores do dispositivo:</strong> token de notificação push (FCM), coletado apenas com sua autorização, para enviar lembretes de partidas.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          2. FINALIDADE DO TRATAMENTO
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Exibir no mapa locais próximos à sua posição atual.</li>
          <li>Permitir o cadastro de novos locais com endereço preciso.</li>
          <li>Enviar notificações push sobre partidas e confirmações de presença.</li>
          <li>Melhorar a experiência do usuário e moderar o conteúdo cadastrado.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          3. COMPARTILHAMENTO DE DADOS
        </h2>
        <p>
          Não compartilhamos seus dados pessoais com terceiros, exceto:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provedores de infraestrutura (Supabase, Cloudflare, Vercel) que armazenam e processam dados em nosso nome, sob contratos de confidencialidade.</li>
          <li>Autoridades judiciais, quando exigido por lei.</li>
        </ul>
        <p>
          O nome e as avaliações que você publica são visíveis publicamente na plataforma.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          4. BASE LEGAL
        </h2>
        <p>
          Tratamos seus dados com base nas seguintes hipóteses da LGPD:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Consentimento (art. 7º, I):</strong> para coleta de localização e notificações push.</li>
          <li><strong>Execução de contrato (art. 7º, V):</strong> para o funcionamento da plataforma e prestação dos serviços.</li>
          <li><strong>Legítimo interesse (art. 7º, IX):</strong> para melhoria dos serviços e moderação de conteúdo.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          5. ARMAZENAMENTO E SEGURANÇA
        </h2>
        <p>
          Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, os dados são removidos em até 90 dias, exceto quando sua retenção for exigida por lei.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          6. SEUS DIREITOS (LGPD)
        </h2>
        <p>Você pode, a qualquer momento:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Confirmar a existência de tratamento de seus dados.</li>
          <li>Acessar, corrigir ou atualizar seus dados pessoais.</li>
          <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
          <li>Revogar seu consentimento para coleta de localização e notificações.</li>
          <li>Solicitar a portabilidade dos dados a outro fornecedor.</li>
          <li>Eliminar sua conta e todos os dados associados.</li>
        </ul>
        <p>
          Para exercer seus direitos, entre em contato pelo e-mail{" "}
          <a href="mailto:contato@jogonasruas.com.br" className="text-brasil-green underline">
            contato@jogonasruas.com.br
          </a>.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          7. ALTERAÇÕES
        </h2>
        <p>
          Esta política pode ser atualizada periodicamente. Notificaremos alterações relevantes por e-mail ou por aviso na plataforma. O uso continuado após as alterações constitui aceitação das novas condições.
        </p>

        <p className="text-[11px] text-brasil-navy/40 pt-4 text-center">
          Jogo nas Ruas · copa 2026
        </p>
      </div>
    </main>
  );
}
