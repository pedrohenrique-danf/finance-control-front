"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_KEYS,
  CATEGORY_ICONS,
  CategoryIcon,
  iconForeground,
} from "@/components/common/category-icon";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Field, fieldA11y, Segmented } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyActionError } from "@/lib/forms/apply-action-error";
import { cn } from "@/lib/utils";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "../actions";
import {
  CATEGORY_NAME_MAX,
  type Category,
  type CategoryFormValues,
  type CategoryType,
  categoryFormSchema,
} from "../schemas";

const TYPE_OPTIONS = [
  { value: "despesa", label: "Despesa", activeClassName: "bg-expense text-primary-foreground shadow-soft" },
  { value: "receita", label: "Receita", activeClassName: "bg-income text-primary-foreground shadow-soft" },
] as const;

const FIELDS = ["name", "type", "color", "icon"] as const;

function defaults(category: Category | null, type: CategoryType): CategoryFormValues {
  return category
    ? { name: category.name, type: category.type, color: category.color, icon: category.icon ?? "sparkles" }
    : { name: "", type, color: CATEGORY_COLORS[3], icon: "cart" };
}

interface CategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = nova categoria. */
  category: Category | null;
  defaultType: CategoryType;
}

export function CategorySheet({ open, onOpenChange, category, defaultType }: CategorySheetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaults(category, defaultType),
  });
  const { errors, isSubmitting } = form.formState;
  const [color, icon] = useWatch({ control: form.control, name: ["color", "icon"] });

  useEffect(() => {
    if (open) form.reset(defaults(category, defaultType));
  }, [open, category, defaultType, form]);

  async function onSubmit(values: CategoryFormValues) {
    const result = category
      ? await updateCategoryAction(category.id, { name: values.name, color: values.color, icon: values.icon })
      : await createCategoryAction(values);
    if (!result.ok) return applyActionError(form.setError, result.error, FIELDS);
    toast.success(category ? "Categoria atualizada." : "Categoria criada.");
    onOpenChange(false);
  }

  function onDelete() {
    if (!category) return;
    startDelete(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setConfirmOpen(false);
      onOpenChange(false);
      toast.success("Categoria excluída.");
    });
  }

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title={category ? "Editar categoria" : "Nova categoria"}
        headerAction={
          category ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-expense"
              aria-label="Excluir categoria"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-5" aria-hidden />
            </Button>
          ) : null
        }
        footer={
          <Button type="submit" form="category-form" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : "Salvar"}
          </Button>
        }
      >
        <form id="category-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <FormAlert message={errors.root?.message} />
          <div className="flex items-end gap-3">
            <CategoryIcon category={{ color, icon }} className="mb-0.5 size-12" iconClassName="size-6" />
            <Field label="Nome" htmlFor="category-name" error={errors.name?.message} className="flex-1">
              <Input
                {...fieldA11y("category-name", errors.name?.message)}
                placeholder="Ex.: Mercado, Pets…"
                maxLength={CATEGORY_NAME_MAX}
                autoComplete="off"
                {...form.register("name")}
              />
            </Field>
          </div>

          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Tipo</p>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) =>
                category ? (
                  // O backend não permite trocar o tipo de uma categoria existente.
                  <p className="text-sm text-muted-foreground">
                    {field.value === "despesa" ? "Despesa" : "Receita"} · o tipo não pode ser alterado.
                  </p>
                ) : (
                  <Segmented label="Tipo" value={field.value} onChange={field.onChange} options={TYPE_OPTIONS} />
                )
              }
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-[13px] font-semibold">Cor</legend>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Cor" className="grid grid-cols-8 gap-2">
                  {CATEGORY_COLORS.map((c, index) => {
                    const active = field.value.toUpperCase() === c;
                    return (
                      // biome-ignore lint/a11y/useSemanticElements: seletor de cor visual (padrão WAI-ARIA radiogroup)
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={`Cor ${index + 1}`}
                        onClick={() => field.onChange(c)}
                        className={cn(
                          "grid aspect-square min-h-9 place-items-center rounded-full transition-transform duration-150",
                          active
                            ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "hover:scale-105",
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {active ? (
                          <Check className="size-4" strokeWidth={3} style={{ color: iconForeground(c) }} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-[13px] font-semibold">Ícone</legend>
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Ícone" className="grid grid-cols-6 gap-2 sm:grid-cols-7">
                  {CATEGORY_ICON_KEYS.map((key) => {
                    const { icon: Icon, label } = CATEGORY_ICONS[key] ?? { icon: Check, label: key };
                    const active = field.value === key;
                    return (
                      // biome-ignore lint/a11y/useSemanticElements: seletor de ícone visual (padrão WAI-ARIA radiogroup)
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={label}
                        title={label}
                        onClick={() => field.onChange(key)}
                        className={cn(
                          "grid h-12 place-items-center rounded-xl border transition-colors",
                          active
                            ? "border-primary bg-accent-soft text-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </fieldset>
        </form>
      </FormSheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir "${category?.name ?? ""}"?`}
        description="As transações e despesas fixas desta categoria serão mantidas e ficarão como “Sem categoria”."
        pending={deleting}
        onConfirm={onDelete}
      />
    </>
  );
}
