import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function BuildStorePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Store building now happens through the Mall Assistant on the store page itself
  // Redirect owners to their store page
  if (user.account_type === "store_owner") {
    redirect(`/store/${user.id}`);
  }

  redirect("/");
}
