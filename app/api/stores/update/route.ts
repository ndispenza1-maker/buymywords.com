import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

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

  const { store_id, llm_provider, llm_api_key, store_content, chat_history } = body;

  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const sql = getSQL();

  // Verify ownership
  const stores = await sql`SELECT id FROM stores WHERE id = ${store_id} AND user_id = ${userId}`;
  if (!stores[0]) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    // Build dynamic update
    if (llm_provider !== undefined && llm_api_key !== undefined) {
      await sql`UPDATE stores SET llm_provider = ${llm_provider}, llm_api_key = ${llm_api_key ? encrypt(llm_api_key) : null} WHERE id = ${store_id}`;
    }

    if (store_content !== undefined) {
      await sql`UPDATE stores SET store_content = ${store_content} WHERE id = ${store_id}`;
    }

    if (chat_history !== undefined) {
      await sql`UPDATE stores SET chat_history = ${JSON.stringify(chat_history)} WHERE id = ${store_id}`;
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Store update failed:", e);
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
  }
}
