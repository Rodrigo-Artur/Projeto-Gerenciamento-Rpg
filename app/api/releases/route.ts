import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/currentUser";
import { releaseReads } from "@/lib/server/authDatabase";
import { releases } from "@/lib/releases";

export const runtime = "nodejs";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  return NextResponse.json({ releases, read: releaseReads(user.id) }, { headers: { "Cache-Control": "private, no-store" } });
}

