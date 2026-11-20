"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActivateOwnerPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // The fragment is never sent in HTTP requests or request logs.
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    setToken(value);
    if (value) window.history.replaceState(null, "", "/activate");
  }, []);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || password.length < 12 || password !== confirm || submitting) {
      setError("Confira o link e escolha uma senha de pelo menos 12 caracteres, com confirmação igual.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json() as {error?:string;email?:string};
      if (!response.ok || !result.email) throw new Error(result.error || "Falha na ativação.");
      setSuccess(true);
      setToken("");
      const signed = await signIn("credentials", {email:result.email,password,redirect:false});
      if (signed?.ok && !signed.error) {
        window.location.assign("/");
      } else {
        setError("Conta ativada! Agora faça login normalmente com sua senha.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha na ativação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <KeyRound aria-hidden="true" className="size-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold">Ativar conta proprietária</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Defina sua senha de acesso ao Mesa do Mestre. O link é de uso único e expira após sete dias.
        </p>
        {!token && !success ? (
          <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            Link de ativação ausente. Abra o endereço completo enviado pelo administrador.
          </p>
        ) : null}
        {!success ? (
          <form onSubmit={(event)=>void activate(event)} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Nova senha
              <input type="password" required autoComplete="new-password" minLength={12} maxLength={128}
                value={password} onChange={(event)=>setPassword(event.target.value)}
                className="field mt-1.5 w-full" />
            </label>
            <label className="block text-sm font-semibold">Confirme a senha
              <input type="password" required autoComplete="new-password" minLength={12} maxLength={128}
                value={confirm} onChange={(event)=>setConfirm(event.target.value)}
                className="field mt-1.5 w-full" />
            </label>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={!token || submitting}>
              <ShieldCheck aria-hidden="true" /> {submitting ? "Ativando..." : "Ativar minha conta"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
              Conta ativada. Sua senha já foi definida.
            </p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Link href="/login" className="inline-flex rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Entrar na conta
            </Link>
          </div>
        )}
        <p className="mt-6 text-xs text-muted-foreground">A ativação não exige divulgar sua senha a ninguém.</p>
      </div>
    </main>
  );
}

