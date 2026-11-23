"use client";

import { Download, FileSpreadsheet, FileUp, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { SectionHeader } from "@/components/common/section-header";
import { type BadgeTone, StatusBadge } from "@/components/common/status-badge";
import { PageSection } from "@/components/layout/page-section";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatMonthLabel, isMonth } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { previewImportAction } from "../actions";
import {
  ACCEPT_ATTRIBUTE,
  type DataOperation,
  type ExchangeAccount,
  type ExchangeCategory,
  exportCsvHref,
  type ImportPreview,
  MAX_FILE_BYTES,
} from "../schemas";
import { ImportReview } from "./import-review";

const STATUS: Record<DataOperation["status"], { tone: BadgeTone; label: string }> = {
  concluida: { tone: "success", label: "Concluída" },
  concluida_com_erros: { tone: "warning", label: "Com erros" },
  falhou: { tone: "danger", label: "Falhou" },
  pendente: { tone: "muted", label: "Pendente" },
  processando: { tone: "neutral", label: "Processando" },
};

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function ImportCard({ onPreview }: { onPreview: (preview: ImportPreview) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function read() {
    if (!file) {
      setError("Escolha um arquivo CSV, OFX ou PDF.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("O arquivo tem mais de 5 MB.");
      return;
    }
    setError(undefined);
    const form = new FormData();
    form.set("file", file);
    startTransition(async () => {
      const result = await previewImportAction(form);
      if (!result.ok) {
        setError(result.error.fieldErrors?.file ?? result.error.message);
        return;
      }
      onPreview(result.data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-soft lg:p-5">
      <SectionHeader title="Importar transações" />
      <FormAlert message={error} />
      <label
        htmlFor="import-file"
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          file ? "border-primary bg-accent-soft/40" : "border-border hover:bg-muted/50",
        )}
      >
        <FileUp className="size-7 text-primary" aria-hidden />
        <span className="text-sm font-semibold break-all">{file ? file.name : "Escolher arquivo CSV, OFX ou PDF"}</span>
        <span className="text-xs text-muted-foreground">
          {file
            ? `${(file.size / 1024).toFixed(0)} KB`
            : "Extrato ou fatura em OFX ou CSV de qualquer banco, ou PDF do Nubank · até 5 MB"}
        </span>
        <input
          ref={inputRef}
          id="import-file"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(undefined);
          }}
        />
      </label>
      <Button size="lg" className="w-full" onClick={read} disabled={pending || !file}>
        <Upload aria-hidden /> {pending ? "Lendo arquivo…" : "Ler arquivo"}
      </Button>
      <details className="rounded-2xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
        <summary className="flex min-h-9 cursor-pointer items-center font-semibold text-foreground">
          Quais arquivos posso enviar?
        </summary>
        <p className="mt-1">
          <strong className="text-foreground">Do banco:</strong> no app ou internet banking, exporte o extrato ou a
          fatura em OFX (também chamado de Money ou Quicken) ou em CSV. O banco e as colunas são reconhecidos sozinhos.
          Do Nubank, o PDF também funciona.
        </p>
        <p className="mt-2">
          <strong className="text-foreground">Planilha própria:</strong>
          Padrão do Excel em português: colunas separadas por ponto e vírgula, data dd/mm/aaaa e valor 1.234,56.
          Obrigatórias: data, descricao, valor e tipo (receita ou despesa).
        </p>
        <pre className="no-scrollbar mt-2 overflow-x-auto rounded-xl bg-card p-2 text-[11px] text-foreground">
          {
            "data;descricao;valor;tipo;natureza;situacao;categoria;conta\n05/11/2026;Salário;4.200,00;receita;;efetivada;Salário;Nubank"
          }
        </pre>
        <a
          href="/import-export/export?modelo=1"
          className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
        >
          <FileSpreadsheet className="size-4" aria-hidden /> Baixar modelo
        </a>
      </details>
    </section>
  );
}

function ExportCard({ defaultMonth }: { defaultMonth: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(defaultMonth);
  const valid = isMonth(month);
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-soft lg:p-5">
      <SectionHeader title="Exportar transações" />
      <p className="text-sm text-muted-foreground">
        Baixe as transações do mês em CSV, no mesmo formato aceito pela importação.
      </p>
      <Field label="Mês" htmlFor="export-month" error={valid ? undefined : "Escolha um mês."}>
        <Input id="export-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </Field>
      <a
        href={valid ? exportCsvHref(month) : undefined}
        aria-disabled={!valid}
        onClick={() => setTimeout(() => router.refresh(), 1500)}
        className={cn(
          buttonVariants({ size: "lg", variant: "secondary", className: "w-full" }),
          !valid && "pointer-events-none opacity-50",
        )}
      >
        <Download aria-hidden /> Baixar CSV {valid ? `de ${formatMonthLabel(month)}` : ""}
      </a>
    </section>
  );
}

export function ImportExportView({
  history,
  categories,
  accounts,
  defaultMonth,
}: {
  history: DataOperation[];
  categories: readonly ExchangeCategory[];
  accounts: readonly ExchangeAccount[];
  defaultMonth: string;
}) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  return (
    <PageSection
      title="Importar / Exportar"
      description="Traga extratos e planilhas para o FinanceControl ou leve seus dados."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        {preview ? (
          <ImportReview
            key={`${preview.fileName}-${preview.rows.length}`}
            preview={preview}
            categories={categories}
            accounts={accounts}
            onDone={() => setPreview(null)}
            onCancel={() => setPreview(null)}
          />
        ) : (
          <ImportCard onPreview={setPreview} />
        )}
        <ExportCard defaultMonth={defaultMonth} />
      </div>

      <section>
        <SectionHeader title="Histórico" />
        {history.length === 0 ? (
          <EmptyState
            art="folder"
            title="Nenhuma importação ou exportação"
            description="As operações que você fizer aparecem aqui, com o resultado de cada uma."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {history.map((op) => {
              const status = STATUS[op.status];
              const isImport = op.type === "importacao";
              return (
                <li key={op.id} className="flex items-center gap-3 px-3 py-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      isImport ? "bg-income-soft text-income" : "bg-accent-soft text-foreground",
                    )}
                  >
                    {isImport ? (
                      <Upload className="size-[18px]" aria-hidden />
                    ) : (
                      <Download className="size-[18px]" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {op.fileName ?? (isImport ? "Importação" : "Exportação")}
                    </p>
                    <p className="num text-xs text-muted-foreground">
                      {isImport ? "Importação" : "Exportação"} · {op.format.toUpperCase()} ·{" "}
                      {dateTime.format(new Date(op.createdAt))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {op.successRows} {op.successRows === 1 ? "transação" : "transações"}
                      {op.errorRows ? ` · ${op.errorRows} com erro` : ""}
                      {op.periodStart && op.periodEnd
                        ? ` · ${formatDate(op.periodStart)} a ${formatDate(op.periodEnd)}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge tone={status.tone} label={status.label} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageSection>
  );
}
