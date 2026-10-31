import { redirect } from "next/navigation";

// Profiles are now overlay cards on the hub. Redirect any direct links.
export default function ProfileRedirect() {
  redirect("/");
}
