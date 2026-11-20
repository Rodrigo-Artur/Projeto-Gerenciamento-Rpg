import { NextResponse } from "next/server";
import { rateAllowed, registerPasswordAccount, type UserPreference } from "@/lib/server/authDatabase";

export const runtime = "nodejs";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const target = new URL(request.url);
  const expected = process.env.AUTH_URL ? new URL(process.env.AUTH_URL) : target;
  return new URL(origin).host === expected.host || new URL(origin).host === target.host;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateAllowed("register", clientIp, 5, 3600)) {
    return NextResponse.json({ error: "Muitos cadastros. Tente novamente mais tarde." }, { status: 429 });
  }
  try {
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: "Dados muito grandes." }, { status: 413 });
    const body = JSON.parse(text) as { email?: unknown; name?: unknown; password?: unknown; preference?: unknown };
    const account = registerPasswordAccount({
      email: typeof body.email === "string" ? body.email : "",
      name: typeof body.name === "string" ? body.name : "",
      password: typeof body.password === "string" ? body.password : "",
      preference: (body.preference ?? "both") as UserPreference,
    });
    return NextResponse.json({ id: account.id, message: "Conta criada. Faça login para continuar." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível concluir o cadastro." }, { status: 400 });
  }
}

