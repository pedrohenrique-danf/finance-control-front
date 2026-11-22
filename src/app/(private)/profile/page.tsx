import type { Metadata } from "next";
import { ProfileView } from "@/features/auth";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Perfil e configurações" };

export default async function ProfilePage() {
  const { user } = await requireSession();
  return <ProfileView user={{ name: user.name, email: user.email }} />;
}
