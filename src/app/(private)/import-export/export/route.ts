import { dataExchangeDataSource } from "@/features/data-exchange";
import { isMonth } from "@/lib/format/date";

const TEMPLATE = [
  "data;descricao;valor;tipo;natureza;situacao;categoria;conta",
  "05/11/2026;Salário estágio;4.200,00;receita;;efetivada;Salário;Nubank",
  "02/11/2026;Mercado;214,37;despesa;variavel;efetivada;Alimentação;Cartão Inter",
  "10/11/2026;Internet;99,90;despesa;fixa;pendente;Moradia;Nubank",
].join("\r\n");

function csv(content: string, fileName: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Download do CSV do mês (?month=YYYY-MM) ou do modelo de importação (?modelo=1).
 * TODO(back): trocar o link da tela por /api/v1/exports/transactions?month=&format=csv quando a rota existir.
 */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  if (params.get("modelo") === "1") return csv(`﻿${TEMPLATE}\r\n`, "modelo-financecontrol.csv");
  const month = params.get("month");
  if (!isMonth(month)) return new Response("Mês inválido.", { status: 400 });
  const { fileName, content } = await dataExchangeDataSource.exportCsv(month);
  return csv(content, fileName);
}
