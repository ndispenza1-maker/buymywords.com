import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <NavBar user={user} />
      <div className="pt-16 min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          <MessagesClient currentUserId={user.id} />
        </div>
      </div>
    </>
  );
}
