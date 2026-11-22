/** Título de seção dentro de uma página (h2) com ação opcional à direita. */
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-bold text-primary-dark">{title}</h2>
      {action}
    </div>
  );
}
