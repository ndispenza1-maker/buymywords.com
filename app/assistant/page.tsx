import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import AssistantWindow from "./AssistantWindow";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { store: storeId } = await searchParams;
  if (!storeId) redirect("/");

  const sql = getSQL();
  const stores = await sql`
    SELECT id, store_name, assistant_enabled
    FROM stores WHERE id = ${storeId} AND user_id = ${user.id}
  `;

  if (!stores[0] || !stores[0].assistant_enabled) {
    redirect("/");
  }

  return (
    <AssistantWindow
      storeId={stores[0].id}
      storeName={stores[0].store_name}
    />
  );
}
