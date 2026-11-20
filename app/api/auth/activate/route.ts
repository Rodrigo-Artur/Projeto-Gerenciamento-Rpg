import { NextResponse } from "next/server";
import { activateOwner, rateAllowed } from "@/lib/server/authDatabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || (new URL(origin).host !== new URL(request.url).host &&
        new URL(origin).host !== new URL(process.env.AUTH_URL || request.url).host)) {
      return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const ip = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateAllowed("activation", ip, 15, 3600)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }
  try {
    const raw = await request.text();
    if (raw.length > 2048) return NextResponse.json({ error: "Dados muito grandes." }, { status: 413 });
    const body = JSON.parse(raw) as {token?:unknown;password?:unknown};
    const user = activateOwner(
      typeof body.token === "string" ? body.token : "",
      typeof body.password === "string" ? body.password : ""
    );
    return NextResponse.json({ email: user.email, message: "Conta proprietária ativada." },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível concluir a ativação."
    }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}

