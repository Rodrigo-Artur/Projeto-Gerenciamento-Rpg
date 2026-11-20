import Link from "next/link";
import { BookOpen, Crown, ShieldCheck, Users } from "lucide-react";
import type { AppUser } from "@/lib/server/authDatabase";
import { SignOutButton } from "@/components/auth/SignOutButton";

const preferences = {
  gm: "Mestre",
  player: "Jogador",
  both: "Mestre e Jogador",
};

export function AccountWelcome({ user }: { user: AppUser }) {
  return <main className="flex min-h-dvh items-center justify-center bg-background p-5 text-foreground">
    <div className="w-full max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
        {user.preference === "player" ? <Users aria-hidden="true" /> : <Crown aria-hidden="true" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Conta criada</p>
        <h1 className="mt-2 font-heading text-2xl font-bold">Bem-vindo, {user.name}!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Conta: {user.email} · Perfil: {preferences[user.preference]}</p>
      </div>
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden="true" className="size-4 text-primary" />Suas campanhas estão protegidas</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Você já pode acessar sua conta. O vínculo de campanhas compartilhadas e os convites
          serão liberados na próxima etapa. Até lá, nenhuma conta recém-criada pode visualizar
          as campanhas antigas do servidor.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" href="/updates">
          <BookOpen aria-hidden="true" className="size-4" /> Ver novidades
        </Link>
        <SignOutButton />
      </div>
    </div>
  </main>;
}

