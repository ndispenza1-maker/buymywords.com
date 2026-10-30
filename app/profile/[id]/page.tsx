import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <>
      <NavBar user={user} />
      <div className="pt-14 min-h-screen" style={{ background: "var(--bg)" }}>
        <ProfileClient userId={id} />
      </div>
    </>
  );
}
