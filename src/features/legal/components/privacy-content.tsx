import Link from "next/link";
import { ContactInfo } from "./legal-page";

/** Política de privacidade (LGPD). Rascunho do projeto acadêmico; não substitui revisão jurídica. */
export function PrivacyContent() {
  return (
    <>
      <p>
        Esta política explica quais dados pessoais o FinanceControl guarda, para quê, com quem eles ficam e como você
        pode acessá-los, corrigi-los, baixá-los ou apagá-los, conforme a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018, a LGPD).
      </p>

      <h2>1. Quem é o responsável</h2>
      <p>
        O FinanceControl é um projeto acadêmico. A equipe que o desenvolve é a responsável (controladora) pelos dados.
        Para qualquer pedido sobre seus dados, fale conosco <ContactInfo />.
      </p>

      <h2>2. Quais dados guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome e e-mail. A senha nunca é guardada como texto: só um código irreversível (hash).
          Se você entra com o Google, recebemos dele seu nome, e-mail e foto de perfil.
        </li>
        <li>
          <strong>Dados financeiros que você cadastra:</strong> lançamentos (descrição, valor, data, situação),
          categorias, contas e cartões, despesas fixas e saldos iniciais.
        </li>
        <li>
          <strong>Importações e exportações:</strong> o nome do arquivo, a data e quantas linhas entraram. O conteúdo do
          arquivo (CSV ou PDF) é lido na hora para mostrar a pré-visualização e não é guardado; só as linhas que você
          confirma viram lançamentos.
        </li>
        <li>
          <strong>Avisos:</strong> as notificações geradas pelas suas ações e quais tipos você escolheu receber.
        </li>
        <li>
          <strong>Dados técnicos:</strong> data do último login, data e versão do aceite destes documentos e, em cada
          sessão, o endereço IP e o navegador usados (para segurança). Os registros técnicos do servidor não guardam
          senhas nem seus dados financeiros.
        </li>
      </ul>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>
          Para prestar o serviço que você pediu: mostrar, calcular e organizar suas finanças (base legal: execução de
          contrato, art. 7º, V, da LGPD).
        </li>
        <li>
          Para proteger sua conta e o sistema, por exemplo limitando tentativas de login (base legal: legítimo
          interesse, art. 7º, IX).
        </li>
        <li>Para enviar o e-mail de recuperação de senha, quando você pede.</li>
      </ul>
      <p>Não vendemos seus dados, não mostramos publicidade e não usamos ferramentas de análise ou rastreamento.</p>

      <h2>4. Com quem os dados ficam</h2>
      <p>Usamos serviços de terceiros (operadores) que guardam ou processam os dados em nosso nome:</p>
      <ul>
        <li>
          <strong>Neon</strong> (banco de dados), em servidores da Amazon Web Services nos Estados Unidos.
        </li>
        <li>
          <strong>Render</strong> (servidor da aplicação), fora do Brasil.
        </li>
        <li>
          <strong>Vercel</strong> (site), com servidores nos Estados Unidos e em outros países.
        </li>
        <li>
          <strong>Google</strong>, apenas se você escolher entrar com o Google.
        </li>
        <li>
          <strong>Provedor de e-mail</strong>, apenas para enviar o link de recuperação de senha.
        </li>
      </ul>
      <p>
        Como esses serviços ficam fora do Brasil, há transferência internacional de dados (art. 33 da LGPD), feita com
        provedores que adotam medidas de segurança e proteção de dados reconhecidas no mercado.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Usamos um único cookie, o da sessão, que mantém você conectado. Ele é essencial para o funcionamento e não serve
        para rastrear você. Não usamos cookies de publicidade nem de análise.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>
        Enquanto sua conta existir. Quando você exclui a conta, a conta e todos os dados dela são apagados na hora do
        banco de dados. Cópias de segurança automáticas do provedor do banco podem manter esses dados por mais alguns
        dias, até serem substituídas.
      </p>

      <h2>7. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos ou errados (o nome pode ser alterado no Perfil);</li>
        <li>
          levar seus dados para outro serviço (portabilidade): o botão <strong>Baixar meus dados</strong> do Perfil faz
          isso;
        </li>
        <li>
          pedir a eliminação: o botão <strong>Excluir conta</strong> do Perfil faz isso;
        </li>
        <li>saber com quem compartilhamos seus dados (seção 4);</li>
        <li>revogar o consentimento, o que, neste serviço, significa excluir a conta.</li>
      </ul>
      <p>
        Para os demais pedidos, fale conosco <ContactInfo />. Você também pode reclamar à Autoridade Nacional de
        Proteção de Dados (ANPD).
      </p>

      <h2>8. Segurança</h2>
      <p>
        O acesso é sempre por conexão segura (HTTPS), as senhas são guardadas só como hash e cada pessoa só enxerga os
        próprios dados. Nenhum sistema é totalmente imune a falhas; se acontecer um incidente que possa afetar você,
        avisaremos.
      </p>

      <h2>9. Mudanças nesta política</h2>
      <p>
        Se esta política mudar, a data no topo será atualizada e mudanças importantes serão avisadas no app. Veja também
        os{" "}
        <Link href="/termos" className="font-semibold text-primary underline-offset-4 hover:underline">
          Termos de uso
        </Link>
        .
      </p>
    </>
  );
}
