import { NextResponse } from "next/server";

import {
  createRpgSystem,
  createRpgTable,
  getRulebookData,
  resetDatabaseToInitialSeed,
  saveRulebookData,
} from "@/lib/server/tableSystemDatabase";
import type { RulebookData } from "@/types/rulebook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTableIdFromRequest(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("tableId") ?? undefined;
}

export async function GET(request: Request) {
  return NextResponse.json({
    ...getRulebookData(getTableIdFromRequest(request)),
    databaseMode: "sqlite-local",
  });
}

export async function PUT(request: Request) {
  const data = (await request.json()) as RulebookData;
  const tableId = data.activeTableId || getTableIdFromRequest(request);
  const systemId = data.activeSystemId;

  saveRulebookData(
    {
      rules: data.rules ?? [],
      npcs: data.npcs ?? [],
      players: data.players ?? [],
    },
    tableId,
    systemId
  );

  return NextResponse.json({
    ...getRulebookData(tableId),
    databaseMode: "sqlite-local",
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    tableId?: string;
    systemId?: string;
    name?: string;
    description?: string;
  };

  if (body.action === "reset-seed") {
    resetDatabaseToInitialSeed(body.tableId);
  }

  if (body.action === "create-system") {
    const system = createRpgSystem({
      name: body.name?.trim() || "Novo sistema",
      description: body.description?.trim() || "Sistema criado pelo Mesa do Mestre.",
    });

    return NextResponse.json({
      ...getRulebookData(body.tableId),
      createdSystemId: system.id,
      databaseMode: "sqlite-local",
    });
  }

  if (body.action === "create-table") {
    const table = createRpgTable({
      name: body.name?.trim() || "Nova mesa",
      description: body.description?.trim() || "Mesa criada pelo Mesa do Mestre.",
      systemId: body.systemId,
    });

    return NextResponse.json({
      ...getRulebookData(table.id),
      databaseMode: "sqlite-local",
    });
  }

  return NextResponse.json({
    ...getRulebookData(body.tableId),
    databaseMode: "sqlite-local",
  });
}
