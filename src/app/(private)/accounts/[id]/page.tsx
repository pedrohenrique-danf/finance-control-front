import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountDetailView, accountsDataSource } from "@/features/accounts";

export const metadata: Metadata = { title: "Detalhe da conta" };

export default async function AccountDetailPage({ params }: PageProps<"/accounts/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const account = await accountsDataSource.get(id);
  if (!account) notFound();
  // TODO(lote 3): seção "Transações desta conta" (features/transactions) como children.
  return <AccountDetailView account={account} />;
}
