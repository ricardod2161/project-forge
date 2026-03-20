import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Check, FileText, ChevronDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, type Project } from "@/hooks/useProjects";
import { toast } from "sonner";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />
);

const generateDoc = (project: Project): string => {
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
  br();

  if (project.original_idea) {
    line(`## Ideia Original`);
    br();
    line(project.original_idea);
    br();
  }

  if (project.description) {
    line(`## Descrição`);
    br();
    line(project.description);
    br();
  }

  if (project.audience) {
    line(`## Público-Alvo`);
    br();
    line(project.audience);
    br();
  }

  if (project.features && project.features.length > 0) {
    line(`## Funcionalidades`);
    br();
    project.features.forEach(f => line(`- ${f}`));
    br();
  }

  if (project.integrations && project.integrations.length > 0) {
    line(`## Integrações`);
    br();
    project.integrations.forEach(i => line(`- ${i}`));
    br();
  }

  if (project.monetization) {
    line(`## Modelo de Monetização`);
    br();
    line(project.monetization);
    br();
  }

  line(`---`);
  line(`*Gerado em ${new Date().toLocaleDateString("pt-BR")} · Arquiteto IA*`);

  return lines.join("\n");
};

const ExportsPage = () => {
  const { data: projects, isLoading, error } = useProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedProject = projects?.find(p => p.id === selectedId) ?? null;
  const docContent = selectedProject ? generateDoc(selectedProject) : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(docContent);
    setCopied(true);
    toast.success("Documentação copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedProject) return;
    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProject.slug ?? selectedProject.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-foreground">Exportações</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Exporte a documentação técnica dos seus projetos
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-xs text-destructive">Erro ao carregar projetos. Tente novamente.</p>
        </div>
      )}

      {/* No projects */}
      {!isLoading && !error && (projects?.length ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border"
        >
          <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-xs text-foreground mb-1">Nenhum projeto para exportar</p>
          <p className="text-2xs text-muted-foreground">Crie um projeto para poder exportar sua documentação.</p>
        </motion.div>
      )}

      {/* Project selector + export */}
      {!isLoading && !error && (projects?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="space-y-4">

          {/* Selector */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative">
              <select
                value={selectedId ?? ""}
                onChange={e => setSelectedId(e.target.value || null)}
                className="pl-4 pr-9 py-2.5 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none min-w-64"
              >
                <option value="">Selecionar projeto...</option>
                {projects!.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {selectedProject && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar tudo"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .md
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {!selectedProject && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
              <FileText className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground">Selecione um projeto para pré-visualizar a documentação</p>
            </div>
          )}

          {selectedProject && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-2xs font-medium text-muted-foreground">
                    {selectedProject.slug ?? selectedProject.title.toLowerCase().replace(/\s+/g, "-")}.md
                  </span>
                </div>
                <span className="text-2xs text-muted-foreground">{docContent.length} caracteres</span>
              </div>

              {/* Content */}
              <pre className="p-5 text-2xs text-foreground leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-[520px]">
                {docContent}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ExportsPage;
