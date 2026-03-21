import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Check, FileText, ChevronDown, Package, Code, FileJson, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, type Project } from "@/hooks/useProjects";
import { useProjectPrompts } from "@/hooks/useProjectDetail";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

// ── Markdown generator ──────────────────────────────────────────────────────
const generateMarkdown = (project: Project): string => {
  const lines: string[] = [];
  const line = (s: string) => lines.push(s);
  const br = () => lines.push("");

  line(`# ${project.title}`);
  br();
  line(`**Status:** ${project.status === "active" ? "Ativo" : project.status === "draft" ? "Rascunho" : "Arquivado"}`);
  if (project.type)    line(`**Tipo:** ${project.type}`);
  if (project.niche)   line(`**Nicho:** ${project.niche}`);
  if (project.platform) line(`**Plataforma:** ${project.platform}`);
  if (project.complexity !== null) line(`**Complexidade:** ${project.complexity}/5`);
  if (project.quality_score !== null) line(`**Score de Qualidade:** ${project.quality_score}/100`);
  br();
  if (project.original_idea) { line(`## Ideia Original`); br(); line(project.original_idea); br(); }
  if (project.description) { line(`## Descrição`); br(); line(project.description); br(); }
  if (project.audience) { line(`## Público-Alvo`); br(); line(project.audience); br(); }
  if (project.features && project.features.length > 0) {
    line(`## Funcionalidades`); br();
    project.features.forEach(f => line(`- ${f}`)); br();
  }
  if (project.integrations && project.integrations.length > 0) {
    line(`## Integrações`); br();
    project.integrations.forEach(i => line(`- ${i}`)); br();
  }
  if (project.monetization) { line(`## Modelo de Monetização`); br(); line(project.monetization); br(); }
  line(`---`);
  line(`*Gerado em ${new Date().toLocaleDateString("pt-BR")} · Arquiteto IA*`);
  return lines.join("\n");
};

// ── JSON generator ──────────────────────────────────────────────────────────
const generateJSON = (project: Project): string =>
  JSON.stringify(
    {
      id: project.id,
      title: project.title,
      status: project.status,
      type: project.type,
      niche: project.niche,
      platform: project.platform,
      complexity: project.complexity,
      quality_score: project.quality_score,
      is_favorite: project.is_favorite,
      original_idea: project.original_idea,
      description: project.description,
      audience: project.audience,
      features: project.features,
      integrations: project.integrations,
      monetization: project.monetization,
      created_at: project.created_at,
      updated_at: project.updated_at,
      _exported_at: new Date().toISOString(),
      _generator: "Arquiteto IA",
    },
    null,
    2
  );

// ── Prompts Markdown generator ─────────────────────────────────────────────
interface Prompt {
  id: string;
  type: string;
  title: string;
  content: string | null;
  version: number;
  tokens_estimate: number | null;
  platform: string | null;
  created_at: string;
}

const generatePromptsMarkdown = (project: Project, prompts: Prompt[]): string => {
  if (!prompts.length) return `# ${project.title} — Prompts Gerados\n\nNenhum prompt gerado para este projeto ainda.`;
  const lines: string[] = [];
  const line = (s: string) => lines.push(s);
  const br = () => lines.push("");

  line(`# ${project.title} — Prompts Gerados`);
  br();
  line(`**Total de prompts:** ${prompts.length}`);
  line(`**Tokens totais estimados:** ${prompts.reduce((s, p) => s + (p.tokens_estimate ?? 0), 0).toLocaleString()}`);
  line(`**Exportado em:** ${new Date().toLocaleDateString("pt-BR")}`);
  br();
  line(`---`);
  br();

  prompts.forEach((p, idx) => {
    line(`## ${idx + 1}. ${p.title}`);
    br();
    line(`**Tipo:** \`${p.type}\``);
    if (p.platform) line(`**Plataforma:** ${p.platform}`);
    line(`**Versão:** v${p.version}`);
    if (p.tokens_estimate) line(`**Tokens estimados:** ${p.tokens_estimate.toLocaleString()}`);
    line(`**Gerado em:** ${new Date(p.created_at).toLocaleDateString("pt-BR")}`);
    br();
    if (p.content) {
      line("```");
      line(p.content);
      line("```");
    } else {
      line("*Sem conteúdo*");
    }
    br();
    if (idx < prompts.length - 1) { line(`---`); br(); }
  });

  line(`*Arquiteto IA · ${new Date().toLocaleDateString("pt-BR")}*`);
  return lines.join("\n");
};

type ExportFormat = "markdown" | "json" | "prompts";

// ── Prompts fetch wrapper ──────────────────────────────────────────────────
const ExportPreview = ({
  project,
  format,
}: {
  project: Project;
  format: ExportFormat;
}) => {
  const { data: prompts, isLoading } = useProjectPrompts(project.id);

  if (format === "prompts" && isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="p-5 space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  const content =
    format === "markdown"
      ? generateMarkdown(project)
      : format === "json"
        ? generateJSON(project)
        : generatePromptsMarkdown(project, (prompts ?? []) as Prompt[]);

  const ext = format === "markdown" ? "md" : format === "json" ? "json" : "md";
  const fileName = `${project.slug ?? project.title.toLowerCase().replace(/\s+/g, "-")}-${format === "prompts" ? "prompts" : "export"}.${ext}`;

  return (
    <motion.div
      key={`${project.id}-${format}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {format === "markdown" || format === "prompts"
            ? <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            : <Code className="w-3.5 h-3.5 text-muted-foreground" />}
          <span className="text-2xs font-medium text-muted-foreground">{fileName}</span>
        </div>
        <span className="text-2xs text-muted-foreground">{content.length.toLocaleString()} chars</span>
      </div>
      <pre className="p-5 text-2xs text-foreground leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-[520px]">
        {content}
      </pre>
    </motion.div>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
const ExportsPage = () => {
  const { data: projects, isLoading, error } = useProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [copied, setCopied] = useState(false);

  const { data: prompts } = useProjectPrompts(selectedId ?? undefined);
  const selectedProject = projects?.find(p => p.id === selectedId) ?? null;

  const getContent = (): string => {
    if (!selectedProject) return "";
    if (format === "markdown") return generateMarkdown(selectedProject);
    if (format === "json") return generateJSON(selectedProject);
    return generatePromptsMarkdown(selectedProject, (prompts ?? []) as Prompt[]);
  };

  const handleCopy = async () => {
    const content = getContent();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedProject) return;
    const content = getContent();
    const ext = format === "json" ? "json" : "md";
    const mime = format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";
    const suffix = format === "prompts" ? "-prompts" : "";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProject.slug ?? selectedProject.title.toLowerCase().replace(/\s+/g, "-")}${suffix}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Arquivo .${ext} baixado!`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Exportações"
        subtitle="Exporte a documentação técnica dos seus projetos em Markdown, JSON ou Prompts gerados"
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && (
        <EmptyState
          title="Erro ao carregar projetos"
          description="Tente recarregar a página."
          action={{ label: "Recarregar", onClick: () => window.location.reload() }}
          className="border-destructive/20 bg-destructive/5"
        />
      )}

      {!isLoading && !error && (projects?.length ?? 0) === 0 && (
        <EmptyState
          icon={Package}
          title="Nenhum projeto para exportar"
          description="Crie um projeto para poder exportar sua documentação."
          action={{ label: "Criar projeto", to: "/app/projetos/novo" }}
        />
      )}

      {!isLoading && !error && (projects?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
            {/* Project selector */}
            <div className="relative">
              <select
                value={selectedId ?? ""}
                onChange={e => setSelectedId(e.target.value || null)}
                className="pl-4 pr-9 py-2.5 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none min-w-56 text-foreground"
              >
                <option value="">Selecionar projeto...</option>
                {projects!.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Format toggle */}
            <div className="flex items-center gap-1 bg-surface/60 rounded-lg p-1 border border-border">
              {([
                { value: "markdown", label: "Markdown", icon: FileText },
                { value: "json",     label: "JSON",     icon: FileJson },
                { value: "prompts",  label: "Prompts",  icon: Zap      },
              ] as { value: ExportFormat; label: string; icon: React.ElementType }[]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-2xs font-medium transition-all",
                    format === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Actions */}
            {selectedProject && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .{format === "json" ? "json" : "md"}
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          <AnimatePresence mode="wait">
            {!selectedProject ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border"
              >
                <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs text-muted-foreground">Selecione um projeto para pré-visualizar</p>
              </motion.div>
            ) : (
              <ExportPreview project={selectedProject} format={format} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ExportsPage;
