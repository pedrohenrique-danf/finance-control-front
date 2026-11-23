// Modelo de planilha para importação (?modelo=1). O CSV do mês vem direto do backend:
// /api/v1/exports/transactions (ver exportCsvHref em features/data-exchange).
const TEMPLATE = [
  "data;descricao;valor;tipo;natureza;situacao;categoria;conta",
  "05/11/2026;Salário estágio;4.200,00;receita;;efetivada;Salário;Nubank",
  "02/11/2026;Mercado;214,37;despesa;variavel;efetivada;Alimentação;Cartão Inter",
  "10/11/2026;Internet;99,90;despesa;fixa;pendente;Moradia;Nubank",
].join("\r\n");

export async function GET(request: Request): Promise<Response> {
  if (new URL(request.url).searchParams.get("modelo") !== "1") return new Response("Não encontrado.", { status: 404 });
  return new Response(`﻿${TEMPLATE}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modelo-financecontrol.csv"',
      "Cache-Control": "no-store",
    },
  });
}
