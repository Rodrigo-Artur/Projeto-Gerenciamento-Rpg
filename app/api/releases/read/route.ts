import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/currentUser";
import { markReleaseRead } from "@/lib/server/authDatabase";
import { releases } from "@/lib/releases";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host &&
      origin !== process.env.AUTH_URL) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }
  const data = (await request.json()) as { version?: unknown };
  if (typeof data.version !== "string" || !releases.some((item) => item.version === data.version)) {
    return NextResponse.json({ error: "Versão inválida." }, { status: 400 });
  }
  markReleaseRead(user.id, data.version);
  return NextResponse.json({ ok: true });
}

