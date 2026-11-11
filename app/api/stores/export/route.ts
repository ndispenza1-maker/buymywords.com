import { NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();

  // Get this user's store
  const stores = await sql`
    SELECT store_name, store_content
    FROM stores WHERE user_id = ${user.id}
    LIMIT 1
  `;

  if (!stores[0]) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const store = stores[0];
  const html = (store.store_content as string) || "";

  if (!html.trim()) {
    return NextResponse.json({ error: "Store page is empty — nothing to export yet" }, { status: 400 });
  }

  // Sanitize store name for filename
  const safeName = ((store.store_name as string) || "my-store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  const filename = `${safeName}.html`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
