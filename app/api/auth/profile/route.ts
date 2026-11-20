import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/currentUser";

export const runtime = "nodejs";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

