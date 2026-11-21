import { cn } from "@/lib/utils";

export type EmptyStateArt = "wallet" | "list" | "bell" | "chart" | "folder";

/** Ilustrações de linha nos tons da paleta. */
function Illustration({ art }: { art: EmptyStateArt }) {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-36" fill="none" aria-hidden>
      <ellipse cx="80" cy="104" rx="56" ry="8" className="fill-muted" />
      <circle cx="122" cy="26" r="10" className="fill-accent-soft" />
      <path d="M28 40c6-10 18-12 22-4" className="stroke-sage" strokeWidth="2.5" strokeLinecap="round" />
      {art === "wallet" && (
        <g strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <rect x="40" y="38" width="78" height="56" rx="12" className="fill-card stroke-primary" />
          <path d="M40 52h64a14 14 0 0 1 14 14v0a14 14 0 0 1-14 14H90" className="stroke-primary" />
          <circle cx="98" cy="66" r="4" className="fill-accent-fresh" />
          <path d="M58 30l16-10 16 10" className="stroke-khaki" />
        </g>
      )}
      {art === "list" && (
        <g strokeWidth="3" strokeLinecap="round">
          <rect x="46" y="22" width="68" height="76" rx="12" className="fill-card stroke-primary" />
          <path d="M60 44h40M60 60h28M60 76h34" className="stroke-sage" />
          <circle cx="112" cy="88" r="13" className="fill-accent-fresh stroke-primary" />
          <path d="M107 88h10M112 83v10" className="stroke-card" />
        </g>
      )}
      {art === "bell" && (
        <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M58 78V58a22 22 0 0 1 44 0v20l8 8H50l8-8Z" className="fill-card stroke-primary" />
          <path d="M72 92a8 8 0 0 0 16 0" className="stroke-primary" />
          <path d="M112 44l8-4M114 58h9" className="stroke-accent-fresh" />
        </g>
      )}
      {art === "chart" && (
        <g strokeWidth="3" strokeLinecap="round">
          <path d="M44 96V30M44 96h76" className="stroke-primary" />
          <rect x="56" y="64" width="12" height="26" rx="4" className="fill-accent-soft" />
          <rect x="76" y="50" width="12" height="40" rx="4" className="fill-accent-fresh" />
          <rect x="96" y="38" width="12" height="52" rx="4" className="fill-sage" />
        </g>
      )}
      {art === "folder" && (
        <g strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M40 40a8 8 0 0 1 8-8h20l8 10h36a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V40Z"
            className="fill-card stroke-primary"
          />
          <path d="M80 60v20M71 71l9 9 9-9" className="stroke-accent-fresh" />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  art = "wallet",
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  art?: EmptyStateArt;
  className?: string;
}) {
  return (
    <div role="status" className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <Illustration art={art} />
      <h2 className="mt-4 text-base font-bold text-primary-dark">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-[280px] text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
