import { redirect } from "next/navigation";

// Feed now lives at /. Redirect any old /feed links.
export default function FeedRedirect() {
  redirect("/");
}
