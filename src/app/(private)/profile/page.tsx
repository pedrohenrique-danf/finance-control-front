import type { Metadata } from "next";
import { ProfileView } from "@/features/auth";
import { NotificationPreferences, notificationsDataSource } from "@/features/notifications";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Perfil e configurações" };

export default async function ProfilePage() {
  const [{ user }, preferences] = await Promise.all([requireSession(), notificationsDataSource.listPreferences()]);
  return (
    <ProfileView
      user={{ name: user.name, email: user.email }}
      settings={<NotificationPreferences preferences={preferences} />}
    />
  );
}
