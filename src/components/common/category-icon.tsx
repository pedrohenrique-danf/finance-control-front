import {
  Baby,
  Book,
  Briefcase,
  Bus,
  Car,
  CircleHelp,
  Coffee,
  CreditCard,
  Droplets,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  type LucideIcon,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sparkles,
  TrendingUp,
  Tv,
  Utensils,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Ícones de categoria: a chave é gravada em `categorias.icone` (≤ 40 caracteres). */
export const CATEGORY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  utensils: { icon: Utensils, label: "Refeição" },
  cart: { icon: ShoppingCart, label: "Mercado" },
  coffee: { icon: Coffee, label: "Café" },
  home: { icon: Home, label: "Casa" },
  zap: { icon: Zap, label: "Energia" },
  water: { icon: Droplets, label: "Água" },
  wifi: { icon: Wifi, label: "Internet" },
  phone: { icon: Smartphone, label: "Celular" },
  bus: { icon: Bus, label: "Ônibus" },
  car: { icon: Car, label: "Carro" },
  fuel: { icon: Fuel, label: "Combustível" },
  plane: { icon: Plane, label: "Viagem" },
  heart: { icon: HeartPulse, label: "Saúde" },
  pill: { icon: Pill, label: "Farmácia" },
  dumbbell: { icon: Dumbbell, label: "Academia" },
  graduation: { icon: GraduationCap, label: "Educação" },
  book: { icon: Book, label: "Livros" },
  gamepad: { icon: Gamepad2, label: "Jogos" },
  film: { icon: Film, label: "Cinema" },
  music: { icon: Music, label: "Música" },
  tv: { icon: Tv, label: "Assinaturas" },
  shirt: { icon: Shirt, label: "Roupas" },
  gift: { icon: Gift, label: "Presentes" },
  paw: { icon: PawPrint, label: "Pets" },
  baby: { icon: Baby, label: "Filhos" },
  sparkles: { icon: Sparkles, label: "Outros" },
  briefcase: { icon: Briefcase, label: "Trabalho" },
  laptop: { icon: Laptop, label: "Freelance" },
  coins: { icon: HandCoins, label: "Renda extra" },
  trending: { icon: TrendingUp, label: "Investimentos" },
  piggy: { icon: PiggyBank, label: "Poupança" },
  wallet: { icon: Wallet, label: "Carteira" },
  bank: { icon: Landmark, label: "Banco" },
  card: { icon: CreditCard, label: "Cartão" },
  receipt: { icon: Receipt, label: "Contas" },
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

/** Paleta de cores sugeridas (terrosas primeiro). */
export const CATEGORY_COLORS = [
  "#636851",
  "#4E4F3D",
  "#99A285",
  "#A0B179",
  "#5E7A3A",
  "#8AA05A",
  "#A3A277",
  "#CACDA5",
  "#C9A13B",
  "#B5654A",
  "#C98B6B",
  "#8C6F5A",
  "#7C8C9A",
  "#6F8F8A",
  "#9A7FA0",
  "#C4848F",
] as const;

/** Cor da bolha de "Sem categoria" (RNF02). */
export const UNCATEGORIZED_COLOR = "#B9BBAE";

/** Cor do ícone legível sobre a cor da categoria (texto escuro em cores claras). */
export function iconForeground(hex: string): string {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#2F3127" : "#FFFFFF";
}

export function categoryIcon(key: string | null | undefined): LucideIcon {
  return (key ? CATEGORY_ICONS[key]?.icon : undefined) ?? CircleHelp;
}

/** Ícone da categoria num círculo colorido. Sem categoria → bolha cinza com "?". Decorativo. */
export function CategoryIcon({
  category,
  className,
  iconClassName,
}: {
  category: { color: string; icon: string | null } | null | undefined;
  className?: string;
  iconClassName?: string;
}) {
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const Icon = categoryIcon(category?.icon);
  return (
    <span
      className={cn("grid size-11 shrink-0 place-items-center rounded-full", className)}
      style={{ backgroundColor: color, color: iconForeground(color) }}
      aria-hidden
    >
      <Icon className={cn("size-5", iconClassName)} />
    </span>
  );
}
