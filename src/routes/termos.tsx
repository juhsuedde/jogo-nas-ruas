import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Jogo nas Ruas" },
      {
        name: "description",
        content: "Termos de uso do Jogo nas Ruas, a plataforma para encontrar locais para assistir aos jogos da copa.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
            TERMOS DE USO
          </h1>
          <div className="size-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 pb-12 space-y-5 text-[13px] text-brasil-navy/80 leading-relaxed">
        <p className="font-semibold text-brasil-navy">
          Última atualização: maio de 2026
        </p>

        <p>
          Ao utilizar o <strong>Jogo nas Ruas</strong> ("plataforma"), você concorda com os presentes Termos de Uso. Se não concordar, não utilize a plataforma.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          1. DESCRIÇÃO DO SERVIÇO
        </h2>
        <p>
          O Jogo nas Ruas é uma plataforma colaborativa que permite aos usuários encontrar e cadastrar locais (bares, restaurantes, praças) que exibem partidas de futebol, especialmente durante a copa. Os usuários podem confirmar presença, avaliar locais e interagir com a comunidade.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          2. CADASTRO E CONTA
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Você deve ter pelo menos 16 anos para criar uma conta.</li>
          <li>As informações fornecidas no cadastro devem ser verdadeiras e atualizadas.</li>
          <li>Você é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
          <li>Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          3. CONTEÚDO GERADO PELO USUÁRIO
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ao cadastrar um local, você declara que as informações fornecidas são precisas.</li>
          <li>Você concede à plataforma uma licença não-exclusiva, gratuita e mundial para exibir o conteúdo cadastrado.</li>
          <li>É proibido cadastrar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros.</li>
          <li>Locais cadastrados passarão por moderação antes de serem publicados no mapa.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          4. CONDUTA DO USUÁRIO
        </h2>
        <p>Você concorda em:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Não utilizar a plataforma para fins ilegais ou não autorizados.</li>
          <li>Não tentar acessar dados de outros usuários ou sistemas da plataforma.</li>
          <li>Não enviar spam, malware ou qualquer código malicioso.</li>
          <li>Respeitar os demais usuários e a equipe de moderação.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          5. COLETA DE LOCALIZAÇÃO
        </h2>
        <p>
          A plataforma coleta sua localização aproximada apenas com seu consentimento explícito, para exibir locais próximos no mapa e sugerir endereço ao cadastrar um novo ponto. Você pode revogar esse consentimento a qualquer momento nas configurações do seu navegador ou dispositivo.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          6. NOTIFICAÇÕES PUSH
        </h2>
        <p>
          Com sua autorização, enviaremos notificações push sobre lembretes de partidas e confirmações de presença. Você pode desativar as notificações a qualquer momento nas configurações do dispositivo.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          7. PROPRIEDADE INTELECTUAL
        </h2>
        <p>
          O nome "Jogo nas Ruas", o logotipo, o design e o código da plataforma são de nossa propriedade ou licenciados. Nada nestes termos concede a você qualquer direito de uso desses elementos sem autorização prévia por escrito.
        </p>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          8. LIMITAÇÃO DE RESPONSABILIDADE
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>As informações sobre locais e partidas são fornecidas pelos usuários e podem conter imprecisões.</li>
          <li>Não nos responsabilizamos por experiências em locais cadastrados na plataforma.</li>
          <li>A plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta ou livre de erros.</li>
        </ul>

        <h2 className="font-display text-sm text-brasil-navy tracking-wider pt-2">
          9. DISPOSIÇÕES GERAIS
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Estes termos são regidos pela legislação brasileira.</li>
          <li>Qualquer disputa será resolvida no foro da cidade de São Paulo — SP.</li>
          <li>Se qualquer disposição destes termos for considerada inválida, as demais permanecerão em vigor.</li>
          <li>Estes termos podem ser alterados a qualquer momento, com aviso prévio aos usuários.</li>
        </ul>

        <p>
          Para dúvidas ou contato:{" "}
          <a href="mailto:contato@jogonasruas.com.br" className="text-brasil-green underline">
            contato@jogonasruas.com.br
          </a>
        </p>

        <p className="text-[11px] text-brasil-navy/40 pt-4 text-center">
          Jogo nas Ruas · copa 2026
        </p>
      </div>
    </main>
  );
}
