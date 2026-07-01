import { NextResponse } from "next/server";

import {
  getRulebookData,
  resetDatabaseToInitialSeed,
  saveRulebookData,
} from "@/lib/server/localDatabase";
import type { RulebookData } from "@/types/rulebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ...getRulebookData(),
    databaseMode: "sqlite-local",
  });
}

export async function PUT(request: Request) {
  const data = (await request.json()) as RulebookData;

  saveRulebookData({
    rules: data.rules ?? [],
    npcs: data.npcs ?? [],
    players: data.players ?? [],
  });

  return NextResponse.json({
    ...getRulebookData(),
    databaseMode: "sqlite-local",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string };

  if (body.action === "reset-seed") {
    resetDatabaseToInitialSeed();
  }

  return NextResponse.json({
    ...getRulebookData(),
    databaseMode: "sqlite-local",
  });
}
