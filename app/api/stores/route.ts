import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";
import { isArchetype, normalizeArchetype, getStarterHTML, type StoreArchetype } from "@/lib/store-templates";

const JWT_SECRET = process.env.JWT_SECRET!;

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
  const { store_name, store_description, store_type, external_url, store_archetype } = body;

  if (!store_name || !store_type) {
    return NextResponse.json({ error: "Store name and type are required" }, { status: 400 });
  }

  if (store_type !== "existing" && store_type !== "fresh") {
    return NextResponse.json({ error: "Invalid store type" }, { status: 400 });
  }

  if (store_type === "existing" && !external_url) {
    return NextResponse.json({ error: "External URL is required for existing projects" }, { status: 400 });
  }

  if (store_type === "existing" && external_url) {
    let parsed: URL;
    try {
      parsed = new URL(String(external_url).trim());
    } catch {
      return NextResponse.json(
        { error: "That doesn't look like a full URL. Include https:// at the start." },
        { status: 400 }
      );
    }
    if (parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "Store links must start with https://" },
        { status: 400 }
      );
    }
  }

  // Archetype creates the starter template. Only "fresh" stores use it.
  if (store_archetype !== undefined && store_archetype !== null && !isArchetype(store_archetype)) {
    return NextResponse.json({ error: "Invalid store archetype" }, { status: 400 });
  }

  let archetype: StoreArchetype = "blank";
  if (store_type === "fresh") {
    // Default to the service template — the blue-collar lane is the beachhead.
    archetype = store_archetype ? normalizeArchetype(store_archetype) : "service";
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

  // Create store — all paying store owners get the assistant
  const starterHTML =
    store_type === "fresh" ? getStarterHTML(archetype, store_name, store_description || null) : "";

  try {
    const stores = await sql`
      INSERT INTO stores (user_id, store_name, store_description, store_type, external_url, assistant_enabled, store_archetype, store_content)
      VALUES (${userId}, ${store_name}, ${store_description || null}, ${store_type}, ${external_url || null}, true, ${archetype}, ${starterHTML || null})
      RETURNING id
    `;

    // Mark store as built + profile complete (in case webhook hasn't fired yet)
    await sql`UPDATE users SET store_built = true, profile_complete = true WHERE id = ${userId}`;

    return NextResponse.json({ store_id: stores[0].id }, { status: 201 });
  } catch (e: unknown) {
    console.error("Store creation failed:", e);
    return NextResponse.json({ error: "Something went wrong creating your store. Try again." }, { status: 500 });
  }
}
