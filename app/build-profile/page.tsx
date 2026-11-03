import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import BuildProfileClient from "./BuildProfileClient";

export default async function BuildProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.profile_complete) redirect("/");

  return (
    <>
      <NavBar user={user} />
      <div className="pt-20 min-h-screen px-4" style={{ background: "var(--bg)" }}>
        <BuildProfileClient
          userId={user.id}
          displayName={user.display_name}
          isFounder={user.subscription_tier === "founders"}
        />
      </div>
    </>
  );
}
