"use client";

import * as React from "react";
import { BookOpen, CircleHelp, FolderOpen, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";

const swatches = [
  { label: "Fundo", token: "--mdm-canvas" },
  { label: "Superfície", token: "--mdm-surface" },
  { label: "Elevada", token: "--mdm-surface-raised" },
  { label: "Dourado", token: "--mdm-gold" },
  { label: "Azul", token: "--mdm-blue" },
  { label: "Verde", token: "--mdm-green" },
  { label: "Vermelho", token: "--mdm-red" },
  { label: "Texto", token: "--mdm-text" },
];

export default function DesignSystemPreviewPage() {
  const [name, setName] = React.useState("");
  const [feedback, setFeedback] = React.useState("Clique em um botão para verificar seu estado.");
  const [open, setOpen] = React.useState(false);

  return (
    <main className="min-h-screen bg-background px-5 py-10 font-sans text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <Badge variant="warning"><Sparkles aria-hidden="true" /> Etapa A1 · v5.0</Badge>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Design System — Mesa do Mestre</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Ambiente isolado de demonstração dos componentes. Não utiliza nem altera dados de mesas, regras ou fichas.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/"><BookOpen aria-hidden="true" /> Voltar ao Mesa do Mestre</a>
          </Button>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tokens de cor</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
            {swatches.map((swatch) => (
              <div key={swatch.token} className="min-w-0 space-y-2">
                <div className="h-16 rounded-lg border border-border shadow-sm" style={{ backgroundColor: `var(${swatch.token})` }} />
                <p className="text-xs font-semibold">{swatch.label}</p>
                <code className="block break-all text-[10px] text-muted-foreground">{swatch.token}</code>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Botões e estados</CardTitle>
              <CardDescription>Hover, teclado, foco e carregamento são parte do padrão.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => setFeedback("Ação primária acionada.")}>Primário</Button>
              <Button variant="secondary" onClick={() => setFeedback("Ação secundária acionada.")}>Secundário</Button>
              <Button variant="outline" onClick={() => setFeedback("Ação de contorno acionada.")}>Contorno</Button>
              <Button variant="ghost" onClick={() => setFeedback("Ação discreta acionada.")}>Discreto</Button>
              <Button variant="destructive" onClick={() => setFeedback("Prévia de ação perigosa (nenhum dado excluído).")}>Perigoso</Button>
              <Button loading disabled>Salvando...</Button>
              <Button variant="secondary" disabled>Desativado</Button>
            </CardContent>
            <CardFooter><p role="status" className="text-xs text-muted-foreground">{feedback}</p></CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicadores semânticos</CardTitle>
              <CardDescription>Os estados sempre têm texto, além da cor.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Selecionado</Badge>
              <Badge variant="secondary">Neutro</Badge>
              <Badge variant="success">Salvo</Badge>
              <Badge variant="warning">Aviso</Badge>
              <Badge variant="info">Informação</Badge>
              <Badge variant="destructive">Erro</Badge>
              <Badge variant="outline">Contorno</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campos acessíveis</CardTitle>
              <CardDescription>Rótulos vinculados aos campos e mensagens de erro anunciadas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <TextField
                label="Nome da campanha"
                placeholder="Ex.: Ecos da Terra Oca"
                value={name}
                onChange={(event) => setName(event.target.value)}
                hint="Exemplo de formulário; os dados não são enviados ao servidor."
              />
              <TextField label="Campo com erro" defaultValue="!" error="Exemplo de validação: informe um nome válido." />
              <div className="grid gap-2">
                <label htmlFor="preview-note" className="text-sm font-medium">Notas de sessão</label>
                <Textarea id="preview-note" placeholder="Descreva a próxima cena..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diálogos seguros</CardTitle>
              <CardDescription>Com título acessível, foco gerenciado e fechamento por Esc.</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button variant="outline"><ShieldCheck aria-hidden="true" /> Testar diálogo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar ação de exemplo</DialogTitle>
                    <DialogDescription>Este diálogo demonstra a experiência de confirmação. Nenhum dado será alterado.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={() => { setFeedback("Confirmação demonstrada."); setOpen(false); }}>Confirmar exemplo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <EmptyState
            icon={<FolderOpen />}
            title="Nenhuma ficha nesta mesa"
            description="Quando você criar ou importar um personagem, ele aparecerá nesta área."
            action={<Button variant="secondary" onClick={() => setFeedback("Prévia de ação de criar ficha.")}>Criar ficha (prévia)</Button>}
          />
          <Card>
            <CardHeader>
              <CardTitle>Carregamento e contraste</CardTitle>
              <CardDescription>Skeletons não mostram conteúdo falso durante o carregamento.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3" aria-label="Exemplo de carregamento">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CircleHelp aria-hidden="true" className="size-4" />
                Os dados do RPG permanecem intactos durante a migração visual.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
