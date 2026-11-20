import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, History, ShieldCheck, Sparkles, Wrench, Bug, Link2, CheckCircle2 } from "lucide-react";
import { currentUser } from "@/lib/server/currentUser";
import { releaseReads } from "@/lib/server/authDatabase";
import { releases } from "@/lib/releases";
import { MarkReleaseRead } from "@/components/auth/MarkReleaseRead";

const icons = {
  new: Sparkles,
  improvement: Wrench,
  fix: Bug,
  security: ShieldCheck,
  integration: Link2,
};
const labels = {
  new: "Novidade",
  improvement: "Melhoria",
  fix: "Correção",
  security: "Segurança",
  integration: "Integração",
};

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fupdates");
  const read = new Set(releaseReads(user.id));
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl space-y-7">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft className="size-4" />Voltar ao Mesa do Mestre</Link>
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><History className="size-4" />Atualizações</div>
          <h1 className="font-heading text-3xl font-bold">Novidades do Mesa do Mestre</h1>
          <p className="text-sm text-muted-foreground">Acompanhe recursos, melhorias, segurança e correções de cada versão.</p>
        </header>
        <div className="space-y-5">
          {releases.map((release) => (
            <article key={release.version} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">{release.version}</span>
                    {release.status === "development" && <span className="text-xs text-muted-foreground">Em desenvolvimento</span>}
                    {read.has(release.version) && <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-3.5" />Lida</span>}
                  </div>
                  <h2 className="text-xl font-semibold">{release.title}</h2>
                  <p className="text-sm text-muted-foreground">{release.summary}</p>
                </div>
                <MarkReleaseRead version={release.version} alreadyRead={read.has(release.version)} />
              </div>
              <ul className="mt-5 space-y-2.5">
                {release.changes.map((change, index) => {
                  const Icon = icons[change.category];
                  return <li key={index} className="flex gap-3 text-sm">
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span><span className="font-semibold">{labels[change.category]}:</span> <span className="text-muted-foreground">{change.text}</span></span>
                  </li>;
                })}
              </ul>
              {release.pullRequests && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                {release.pullRequests.map((id) =>
                  <a key={id} href={"https://github.com/Rodrigo-Artur/Projeto-Gerenciamento-Rpg/pull/" + id} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PR #{id}</a>
                )}
              </div>}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

