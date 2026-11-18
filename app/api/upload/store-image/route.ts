import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const storeId = formData.get("store_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!storeId) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  // Verify this user owns this store
  const sql = getSQL();
  const stores = await sql`
    SELECT id FROM stores WHERE id = ${storeId} AND user_id = ${user.id}
  `;
  if (!stores[0]) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Convert to base64 data URI for Cloudinary
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `themallofprojects/store-images/${storeId}`,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return NextResponse.json({
      url: result.secure_url,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    console.error("Store image upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
