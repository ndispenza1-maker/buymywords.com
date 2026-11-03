import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";

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

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const storeId = req.nextUrl.searchParams.get("store_id");
  if (!storeId) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const sql = getSQL();
  const stores = await sql`
    SELECT assistant_chat_history FROM stores
    WHERE id = ${storeId} AND user_id = ${userId} AND assistant_enabled = true
  `;

  if (!stores[0]) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({ messages: stores[0].assistant_chat_history || [] });
}
