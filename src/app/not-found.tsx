import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-3 p-6">
      <h1 className="text-lg font-semibold">Página não encontrada</h1>
      <Link href="/dashboard" className="text-sm underline">
        Voltar ao resumo
      </Link>
    </div>
  );
}
