import NavBar from "@/components/NavBar";
import { getAuthUser } from "@/lib/auth";
import PrivacyContent from "./PrivacyContent";

export default async function PrivacyPage() {
  const user = await getAuthUser();
  return (
    <>
      <NavBar user={user} />
      <div className="pt-16" style={{ background: "var(--bg)" }}>
        <PrivacyContent />
      </div>
    </>
  );
}
