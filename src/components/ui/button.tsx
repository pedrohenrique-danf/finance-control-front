import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// Tamanhos e variantes ajustados à identidade visual do FinanceControl (alvos de toque ≥ 44 px).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary-dark",
        outline: "border-border bg-card text-foreground hover:bg-muted aria-expanded:bg-muted",
        secondary: "bg-muted text-foreground hover:bg-accent-soft/60 aria-expanded:bg-accent-soft/60",
        soft: "bg-accent-soft text-foreground hover:bg-accent-soft/80",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        destructive: "bg-expense text-primary-foreground hover:bg-expense/90 focus-visible:ring-expense/30",
        income: "bg-income text-primary-foreground hover:bg-income/90",
        expense: "bg-expense text-primary-foreground hover:bg-expense/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
