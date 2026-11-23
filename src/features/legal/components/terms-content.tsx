import Link from "next/link";
import { ContactInfo } from "./legal-page";

/** Termos de uso (rascunho do projeto acadêmico; não substitui revisão jurídica). */
export function TermsContent() {
  return (
    <>
      <p>
        Estes termos explicam como funciona o FinanceControl e o que esperamos de quem usa. Ao criar uma conta, ou ao
        continuar com o Google, você concorda com eles e com a{" "}
        <Link href="/privacidade" className="font-semibold text-primary underline-offset-4 hover:underline">
          Política de privacidade
        </Link>
        .
      </p>

      <h2>1. O que é o FinanceControl</h2>
      <p>
        Uma ferramenta gratuita para organizar suas finanças pessoais: registrar receitas e despesas, separar por
        categorias e contas, acompanhar despesas fixas e importar ou exportar seus lançamentos. É um projeto acadêmico,
        desenvolvido por estudantes como parte de uma disciplina.
      </p>

      <h2>2. Não é consultoria financeira</h2>
      <p>
        Os números e resumos mostrados vêm do que você cadastra. O FinanceControl não dá recomendações de investimento,
        crédito ou impostos, e não se responsabiliza por decisões tomadas com base nesses números.
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>Cada conta é de uma pessoa. Use um nome e um e-mail verdadeiros.</li>
        <li>Guarde sua senha com cuidado: quem tiver acesso a ela verá seus dados.</li>
        <li>
          Se suspeitar de acesso indevido, troque a senha no Perfil, o que encerra as sessões nos outros aparelhos.
        </li>
      </ul>

      <h2>4. Uso aceitável</h2>
      <p>Não é permitido:</p>
      <ul>
        <li>tentar acessar dados de outras pessoas ou contornar as proteções do sistema;</li>
        <li>sobrecarregar o serviço de propósito, por exemplo com acessos automatizados em massa;</li>
        <li>usar o FinanceControl para qualquer atividade ilegal.</li>
      </ul>
      <p>Contas que descumprirem estas regras podem ser suspensas ou excluídas.</p>

      <h2>5. Seus dados</h2>
      <p>
        Os dados que você cadastra são seus. A{" "}
        <Link href="/privacidade" className="font-semibold text-primary underline-offset-4 hover:underline">
          Política de privacidade
        </Link>{" "}
        explica o que guardamos, com quem, por quanto tempo e como baixar ou apagar tudo.
      </p>

      <h2>6. Disponibilidade</h2>
      <p>
        Por ser um projeto acadêmico gratuito, não há garantia de funcionamento contínuo: o serviço pode ficar lento,
        sair do ar ou, em caso de falha, perder dados. Recomendamos baixar seus dados de tempos em tempos (Perfil →
        Baixar meus dados).
      </p>

      <h2>7. Encerramento</h2>
      <p>
        Você pode excluir sua conta quando quiser, no Perfil. O serviço também pode ser encerrado ao fim do projeto;
        quando possível, avisaremos com antecedência para que você baixe seus dados.
      </p>

      <h2>8. Mudanças nestes termos</h2>
      <p>
        Se estes termos mudarem, a data no topo desta página será atualizada. Mudanças importantes serão avisadas no
        próprio app.
      </p>

      <h2>9. Contato e lei aplicável</h2>
      <p>
        Dúvidas sobre estes termos podem ser enviadas <ContactInfo />. Estes termos seguem as leis do Brasil.
      </p>
    </>
  );
}
