import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { RecurrenceDetailView, recurrencesDataSource } from "@/features/recurrences";

export const metadata: Metadata = { title: "Despesa fixa" };

export default async function RecurrenceDetailPage({ params }: PageProps<"/recurrences/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [recurrence, categories, accounts] = await Promise.all([
    recurrencesDataSource.get(id),
    categoriesDataSource.list(),
    accountsDataSource.list(),
  ]);
  if (!recurrence) notFound();
  return <RecurrenceDetailView recurrence={recurrence} categories={categories} accounts={accounts} />;
}
