import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import SubscribeClient from "./SubscribeClient";

export default async function SubscribePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <NavBar user={user} />
      <div className="pt-20 min-h-screen px-4" style={{ background: "var(--bg)" }}>
        <SubscribeClient />
      </div>
    </>
  );
}
