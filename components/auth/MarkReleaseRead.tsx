"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkReleaseRead({ version, alreadyRead }: { version: string; alreadyRead: boolean }) {
  const [read, setRead] = useState(alreadyRead);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (read) return null;
  async function mark() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/releases/read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!response.ok) throw new Error("Não foi possível registrar a leitura.");
      setRead(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao atualizar.");
    } finally {
      setLoading(false);
    }
  }
  return <div className="flex flex-col items-end gap-1">
    <Button variant="outline" size="sm" disabled={loading} onClick={() => void mark()}>
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
      Marcar como lida
    </Button>
    {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
  </div>;
}

