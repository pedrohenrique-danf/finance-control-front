import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Resumo" },
  { href: "/transactions", label: "Transações" },
  { href: "/categories", label: "Categorias" },
  { href: "/recurrences", label: "Recorrências" },
  { href: "/import-export", label: "Importar/Exportar" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-accent focus-visible:outline-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
