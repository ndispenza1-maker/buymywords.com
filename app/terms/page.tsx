import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import TermsContent from "./TermsContent";

export default async function TermsPage() {
  const user = await getAuthUser();

  return (
    <>
      <NavBar user={user ? {
        id: user.id,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        profile_complete: user.profile_complete,
      } : null} />
      <TermsContent />
    </>
  );
}
