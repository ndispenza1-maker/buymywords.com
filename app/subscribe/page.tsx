import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import SubscribeClient from "./SubscribeClient";

export default async function SubscribePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  // Only store owners who haven't built their store yet belong here
  if (user.account_type !== "store_owner") redirect("/");
  if (user.store_built) redirect("/");

  return (
    <>
      <NavBar user={user} />
      <div className="pt-20 min-h-screen px-4" style={{ background: "var(--bg)" }}>
        <SubscribeClient />
      </div>
    </>
  );
}
