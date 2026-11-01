import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { store_name, store_description, store_type, external_url, llm_provider, llm_api_key, assistant_enabled } = body;

  if (!store_name || !store_type) {
    return NextResponse.json({ error: "Store name and type are required" }, { status: 400 });
  }

  if (store_type !== "existing" && store_type !== "fresh") {
    return NextResponse.json({ error: "Invalid store type" }, { status: 400 });
  }

  if (store_type === "existing" && !external_url) {
    return NextResponse.json({ error: "External URL is required for existing projects" }, { status: 400 });
  }



  const sql = getSQL();

  // Check user is a store owner
  const users = await sql`SELECT account_type, store_built FROM users WHERE id = ${userId}`;
  if (!users[0] || users[0].account_type !== "store_owner") {
    return NextResponse.json({ error: "Only store owners can create stores" }, { status: 403 });
  }

  if (users[0].store_built) {
    return NextResponse.json({ error: "Store already exists" }, { status: 409 });
  }

  // Create store
  try {
    const stores = await sql`
      INSERT INTO stores (user_id, store_name, store_description, store_type, external_url, llm_provider, llm_api_key, assistant_enabled)
      VALUES (${userId}, ${store_name}, ${store_description || null}, ${store_type}, ${external_url || null}, ${llm_provider || null}, ${llm_api_key || null}, ${!!assistant_enabled})
      RETURNING id
    `;

    // Mark store as built
    await sql`UPDATE users SET store_built = true WHERE id = ${userId}`;

    return NextResponse.json({ store_id: stores[0].id }, { status: 201 });
  } catch (e: unknown) {
    console.error("Store creation failed:", e);
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}
