import {
  ArrowLeftRight,
  Bell,
  CreditCard,
  Home,
  LayoutGrid,
  type LucideIcon,
  ReceiptText,
  Repeat,
  Settings,
  User,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Menu completo (menu lateral no mobile, barra lateral no desktop). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transactions", label: "Extrato mensal", icon: ReceiptText },
  { href: "/categories", label: "Categorias", icon: LayoutGrid },
  { href: "/recurrences", label: "Despesas fixas", icon: Repeat },
  { href: "/accounts", label: "Contas e cartões", icon: CreditCard },
  { href: "/import-export", label: "Importar / Exportar", icon: ArrowLeftRight },
  { href: "/notifications", label: "Notificações", icon: Bell },
  { href: "/profile", label: "Perfil e configurações", icon: Settings },
];

/** Barra inferior do mobile (o botão central "+" fica entre o 2º e o 3º item). */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transactions", label: "Extrato", icon: ReceiptText },
  { href: "/categories", label: "Categorias", icon: LayoutGrid },
  { href: "/profile", label: "Perfil", icon: User },
];

/** Item ativo: rota exata ou sub-rota (ex.: /recurrences/:id ativa "Despesas fixas"). */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
