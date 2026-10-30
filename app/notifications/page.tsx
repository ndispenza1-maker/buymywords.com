import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <NavBar user={user} />
      <div className="pt-16 min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-xl mx-auto px-4">
          <h1 className="text-xl font-bold mb-4">Notifications</h1>
          <NotificationsClient />
        </div>
      </div>
    </>
  );
}
