"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserPreference } from "@/lib/server/authDatabase";

type Mode = "login" | "register";

export function AccountForm({ mode, googleEnabled, nextUrl }: { mode: Mode; googleEnabled: boolean; nextUrl: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [preference, setPreference] = useState<UserPreference>("both");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        if (password !== confirm) throw new Error("As senhas não coincidem.");
        const response = await fetch("/api/auth/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password, preference }),
        });
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error ?? "Não foi possível criar a conta.");
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result?.ok || result.error) {
        throw new Error(mode === "register"
          ? "Conta criada, mas o login automático falhou. Entre com seu e-mail e senha."
          : "E-mail ou senha incorretos.");
      }
      window.location.assign(nextUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-[460px] space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <header className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <BookOpen aria-hidden="true" className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Mesa do Mestre</h1>
          <p className="text-sm text-muted-foreground">{mode === "login"
            ? "Acesse suas campanhas e personagens."
            : "Crie uma conta e escolha como deseja participar."}</p>
        </header>

        {googleEnabled && (
          <Button variant="outline" size="lg" className="w-full" onClick={() => void signIn("google", { callbackUrl: nextUrl })}>
            <Sparkles aria-hidden="true" /> Continuar com Google
          </Button>
        )}
        {googleEnabled && <p className="text-center text-xs text-muted-foreground">Ou use e-mail e senha</p>}

        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          {mode === "register" && (
            <label className="block space-y-1.5 text-sm font-medium">Nome
              <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)}
                className="field w-full" placeholder="Como você deseja ser chamado?" />
            </label>
          )}
          <label className="block space-y-1.5 text-sm font-medium">E-mail
            <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)}
              className="field w-full" placeholder="voce@exemplo.com" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">Senha
            <span className="flex items-center gap-2">
              <input required minLength={mode === "register" ? 12 : undefined} maxLength={128}
                type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password} onChange={(event) => setPassword(event.target.value)} className="field min-w-0 flex-1" />
              <Button type="button" size="icon-sm" variant="ghost"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </span>
          </label>
          {mode === "register" && (
            <>
              <label className="block space-y-1.5 text-sm font-medium">Confirme sua senha
                <input required type={showPassword ? "text" : "password"} autoComplete="new-password"
                  minLength={12} maxLength={128} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="field w-full" />
              </label>
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Como pretende usar a plataforma?</legend>
                {([
                  ["gm", "Quero mestrar", "Preparar e gerenciar campanhas"],
                  ["player", "Sou apenas jogador", "Participar de campanhas por convite"],
                  ["both", "Quero fazer os dois", "Alternar entre mestre e jogador"],
                ] as const).map(([id, title, description]) => (
                  <label key={id} className={"flex cursor-pointer items-start gap-3 rounded-xl border p-3 " +
                    (preference === id ? "border-primary/55 bg-primary/10" : "border-border bg-background")}>
                    <input type="radio" name="profile" value={id} checked={preference === id}
                      onChange={() => setPreference(id)} className="mt-1 accent-primary" />
                    <span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-muted-foreground">{description}</span></span>
                  </label>
                ))}
                <p className="text-xs text-muted-foreground">Esta é uma preferência. O acesso a campanhas depende de convite ou propriedade.</p>
              </fieldset>
            </>
          )}
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <LockKeyhole aria-hidden="true" />
            {loading ? "Verificando..." : mode === "login" ? "Entrar" : "Criar minha conta"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Ainda não possui conta?" : "Já tem uma conta?"}{" "}
          <Link className="font-semibold text-primary hover:underline" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Criar conta" : "Entrar"}
          </Link>
        </p>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4" /> Suas campanhas são protegidas por permissões no servidor.
        </p>
      </div>
    </main>
  );
}

