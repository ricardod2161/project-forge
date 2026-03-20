import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, StarOff, ArrowLeft, Copy, Check, Layers, Lightbulb, Code2,
  Monitor, Database, ScrollText, Zap, Download, BarChart3, History,
  Bot, MoreHorizontal, Trash2, Archive, Edit3, Tag, Users, Globe, Puzzle,
  RefreshCw, AlertTriangle, AlertCircle, Lightbulb as LightbulbIcon, TrendingUp, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProjectDetail, useProjectPrompts, useProjectVersions, useUpdateProject, useDeleteProject } from "@/hooks/useProjectDetail";
import { useToggleFavorite } from "@/hooks/useProjects";
import AIStreamingIndicator from "@/components/AIStreamingIndicator";
import ScoreRing from "@/components/ScoreRing";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABS = [
  { id: "overview",  label: "Visão Geral",    icon: Layers     },
  { id: "idea",      label: "Ideia Original", icon: Lightbulb  },
  { id: "modules",   label: "Módulos",        icon: Puzzle     },
  { id: "screens",   label: "Telas",          icon: Monitor    },
  { id: "database",  label: "Banco de Dados", icon: Database   },
  { id: "rules",     label: "Regras",         icon: ScrollText },
  { id: "prompts",   label: "Prompts",        icon: Zap        },
  { id: "exports",   label: "Exportações",    icon: Download   },
  { id: "eval",      label: "Avaliação",      icon: BarChart3  },
  { id: "versions",  label: "Versões",        icon: History    },
  { id: "ai",        label: "Revisão IA",     icon: Bot        },
] as const;

type TabId = typeof TABS[number]["id"];

const statusConfig = {
  draft:    { label: "Rascunho", classes: "bg-warning/10 text-warning border-warning/20" },
  active:   { label: "Ativo",    classes: "bg-success/10 text-success border-success/20" },
  archived: { label: "Arquivado", classes: "bg-muted text-muted-foreground border-border" },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />
);

// ── Empty tab content ─────────────────────────────────────────────────────────
const EmptyTab = ({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border"
  >
    <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-muted-foreground/50" />
    </div>
    <p className="font-medium text-xs text-foreground mb-1">{title}</p>
    <p className="text-2xs text-muted-foreground text-center max-w-xs">{sub}</p>
  </motion.div>
);

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-150"
      aria-label="Copiar conteúdo"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
};

// ── Info chip ─────────────────────────────────────────────────────────────────
const InfoChip = ({ label }: { label: string }) => (
  <span className="px-2.5 py-1 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20">
    {label}
  </span>
);

// ── Tab: Overview ─────────────────────────────────────────────────────────────
const OverviewTab = ({ project }: { project: ReturnType<typeof useProjectDetail>["data"] }) => {
  if (!project) return null;
  const fields = [
    { icon: Tag,    label: "Tipo",          value: project.type     },
    { icon: Layers, label: "Nicho",         value: project.niche    },
    { icon: Globe,  label: "Plataforma",    value: project.platform },
    { icon: Users,  label: "Público-alvo",  value: project.audience },
    { icon: Code2,  label: "Monetização",   value: project.monetization },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-6">
      {/* Campos principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.filter(f => f.value).map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-2xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{value}</p>
          </div>
        ))}
        {project.complexity !== null && (
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-2xs text-muted-foreground font-medium">Complexidade</span>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < (project.complexity ?? 0) ? "bg-primary" : "bg-muted")} />
              ))}
              <span className="text-xs font-semibold text-foreground ml-1">{project.complexity}/5</span>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      {project.features && project.features.length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Funcionalidades
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.features.map((f) => <InfoChip key={f} label={f} />)}
          </div>
        </div>
      )}

      {/* Integrações */}
      {project.integrations && project.integrations.length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
            <Puzzle className="w-3.5 h-3.5 text-primary" />
            Integrações
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.integrations.map((i) => <InfoChip key={i} label={i} />)}
          </div>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-semibold text-foreground mb-2">Descrição</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
        </div>
      )}
    </motion.div>
  );
};

// ── Tab: Idea ─────────────────────────────────────────────────────────────────
const IdeaTab = ({ idea }: { idea: string | null | undefined }) => {
  if (!idea) return (
    <EmptyTab icon={Lightbulb} title="Ideia original não registrada"
      sub="Adicione a ideia original do projeto para referência futura." />
  );
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-foreground">Ideia Original</h3>
          <CopyButton text={idea} />
        </div>
        <p className="text-xs text-foreground leading-loose whitespace-pre-wrap">{idea}</p>
      </div>
    </motion.div>
  );
};

// ── Tab: Prompts ───────────────────────────────────────────────────────────────
const PromptsTab = ({ projectId }: { projectId: string }) => {
  const { data: prompts, isLoading } = useProjectPrompts(projectId);

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  if (!prompts?.length) return (
    <EmptyTab icon={Zap} title="Nenhum prompt gerado ainda"
      sub="Acesse o módulo de Prompts para gerar os primeiros prompts deste projeto." />
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-3">
      {prompts.map((p) => (
        <div key={p.id} className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-primary/10 text-primary border border-primary/20 mr-2">
                {p.type}
              </span>
              <span className="text-xs font-semibold text-foreground">{p.title}</span>
            </div>
            {p.content && <CopyButton text={p.content} />}
          </div>
          {p.content && (
            <p className="text-2xs text-muted-foreground line-clamp-3 leading-relaxed font-mono bg-muted/30 rounded-lg p-3">
              {p.content}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-2xs text-muted-foreground">
            <span>v{p.version}</span>
            {p.tokens_estimate && <span>{p.tokens_estimate} tokens</span>}
            {p.platform && <span>{p.platform}</span>}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// ── Types for AI Review ───────────────────────────────────────────────────────
interface Finding {
  category: "lacuna" | "inconsistencia" | "melhoria" | "risco";
  severity: "critico" | "importante" | "sugestao";
  title: string;
  description: string;
  recommendation: string;
}

const severityConfig = {
  critico: {
    label: "Crítico",
    classes: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
    icon: ShieldAlert,
  },
  importante: {
    label: "Importante",
    classes: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning",
    icon: AlertTriangle,
  },
  sugestao: {
    label: "Sugestão",
    classes: "bg-success/10 text-success border-success/30",
    dot: "bg-success",
    icon: LightbulbIcon,
  },
} as const;

const categoryConfig = {
  lacuna:       { label: "Lacuna",        classes: "bg-accent/10 text-accent border-accent/20" },
  inconsistencia: { label: "Inconsistência", classes: "bg-warning/10 text-warning border-warning/20" },
  melhoria:     { label: "Melhoria",      classes: "bg-primary/10 text-primary border-primary/20" },
  risco:        { label: "Risco",         classes: "bg-destructive/10 text-destructive border-destructive/20" },
} as const;

// ── Tab: AI Review ────────────────────────────────────────────────────────────
const AIReviewTab = ({ projectId }: { projectId: string }) => {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState<Finding["severity"] | "all">("all");

  const runReview = useCallback(async () => {
    setIsLoading(true);
    setFindings(null);
    try {
      const { data, error } = await supabase.functions.invoke("review-project", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Limite") || data.error.includes("429")) {
          toast.error("Limite de requisições atingido. Aguarde alguns minutos e tente novamente.");
        } else if (data.error.includes("Créditos") || data.error.includes("402")) {
          toast.error("Créditos insuficientes. Acesse Configurações → Uso para adicionar créditos.");
        } else {
          toast.error(data.error);
        }
        return;
      }
      setFindings(data.findings ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao executar revisão";
      if (msg.includes("rate") || msg.includes("429")) {
        toast.error("Limite de requisições atingido. Aguarde alguns minutos.");
      } else if (msg.includes("402")) {
        toast.error("Créditos insuficientes. Acesse Configurações → Uso para adicionar créditos.");
      } else {
        toast.error(`Erro na revisão: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const filtered = findings
    ? activeSeverity === "all"
      ? findings
      : findings.filter((f) => f.severity === activeSeverity)
    : [];

  const counts = findings
    ? {
        critico: findings.filter((f) => f.severity === "critico").length,
        importante: findings.filter((f) => f.severity === "importante").length,
        sugestao: findings.filter((f) => f.severity === "sugestao").length,
      }
    : null;

  // ── Initial state ─────────────────────────────────────────────────────────
  if (!isLoading && !findings) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <Bot className="w-7 h-7 text-primary/60" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Revisão Automática por IA</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A IA analisa completude de requisitos, inconsistências entre campos, riscos técnicos,
            lacunas de nicho e oportunidades de melhoria — retornando achados priorizados por severidade.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-2xs text-muted-foreground">
          {[
            { icon: ShieldAlert, label: "Críticos" },
            { icon: AlertTriangle, label: "Importantes" },
            { icon: TrendingUp, label: "Sugestões" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface">
              <Icon className="w-3 h-3" />
              {label}
            </span>
          ))}
        </div>
        <button
          onClick={runReview}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <Bot className="w-4 h-4" />
          Analisar Projeto com IA
        </button>
      </motion.div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <AIStreamingIndicator label="IA analisando projeto..." size="md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted/60 rounded w-2/3" />
                  <div className="h-2 bg-muted/40 rounded w-full" />
                  <div className="h-2 bg-muted/40 rounded w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-4 flex-wrap">
          {counts && (
            <>
              <span className="text-2xs font-medium text-muted-foreground">{findings!.length} achados</span>
              {counts.critico > 0 && (
                <span className="flex items-center gap-1 text-2xs font-semibold text-destructive">
                  <ShieldAlert className="w-3 h-3" />
                  {counts.critico} crítico{counts.critico !== 1 ? "s" : ""}
                </span>
              )}
              {counts.importante > 0 && (
                <span className="flex items-center gap-1 text-2xs font-semibold text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  {counts.importante} importante{counts.importante !== 1 ? "s" : ""}
                </span>
              )}
              {counts.sugestao > 0 && (
                <span className="flex items-center gap-1 text-2xs font-semibold text-success">
                  <LightbulbIcon className="w-3 h-3" />
                  {counts.sugestao} sugestão{counts.sugestao !== 1 ? "ões" : ""}
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={runReview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-2xs font-medium text-muted-foreground transition-all duration-150"
        >
          <RefreshCw className="w-3 h-3" />
          Reanalisar
        </button>
      </div>

      {/* Severity filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "critico", "importante", "sugestao"] as const).map((s) => {
          const isAll = s === "all";
          const cfg = !isAll ? severityConfig[s] : null;
          const count = !isAll && counts ? counts[s] : findings?.length ?? 0;
          return (
            <button
              key={s}
              onClick={() => setActiveSeverity(s)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-medium border transition-all duration-150",
                activeSeverity === s
                  ? isAll
                    ? "bg-foreground text-background border-foreground"
                    : cn(cfg?.classes, "shadow-sm")
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              {cfg?.icon && <cfg.icon className="w-3 h-3" />}
              {isAll ? "Todos" : cfg?.label}
              <span className={cn(
                "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeSeverity === s ? "bg-white/20" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Findings list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filtered.map((finding, index) => {
            const sev = severityConfig[finding.severity];
            const cat = categoryConfig[finding.category];
            const SevIcon = sev.icon;
            return (
              <motion.div
                key={`${finding.title}-${index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5", sev.classes)}>
                    <SevIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-2xs font-semibold border", sev.classes)}>
                        {sev.label}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-2xs font-medium border", cat.classes)}>
                        {cat.label}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground mb-1">{finding.title}</h4>
                    <p className="text-2xs text-muted-foreground leading-relaxed mb-3">{finding.description}</p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <AlertCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-2xs text-foreground leading-relaxed">
                        <span className="font-semibold text-primary">Recomendação: </span>
                        {finding.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border">
              <Check className="w-8 h-8 text-success mb-3" />
              <p className="text-xs font-medium text-foreground">Nenhum achado nesta categoria</p>
              <p className="text-2xs text-muted-foreground mt-1">Tente outro filtro ou reanalisar o projeto.</p>
            </div>
          )}
        </div>
      </AnimatePresence>
    </motion.div>
  );
};

// ── Tab: Versions ─────────────────────────────────────────────────────────────
const VersionsTab = ({ projectId }: { projectId: string }) => {
  const { data: versions, isLoading } = useProjectVersions(projectId);

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  if (!versions?.length) return (
    <EmptyTab icon={History} title="Sem versões registradas"
      sub="As versões do projeto aparecerão aqui conforme você evoluir sua estrutura." />
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-3">
      {versions.map((v) => (
        <div key={v.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">v{v.version_number}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {v.generated_by_ai && (
                <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20">
                  IA
                </span>
              )}
              <span className="text-2xs text-muted-foreground">
                {new Date(v.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            {v.changes_summary && <p className="text-xs text-foreground">{v.changes_summary}</p>}
            {v.ai_observations && <p className="text-2xs text-muted-foreground mt-1">{v.ai_observations}</p>}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const { data: project, isLoading, error } = useProjectDetail(id);
  const toggleFavorite = useToggleFavorite();
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();

  const handleStatusChange = (status: "draft" | "active" | "archived") => {
    updateProject.mutate({ status });
  };

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft !== project?.title) {
      updateProject.mutate({ title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleDelete = () => {
    deleteProject.mutate(id!, {
      onSuccess: () => navigate("/app/projetos"),
    });
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => <Skeleton key={t.id} className="h-8 w-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !project) return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border">
      <p className="font-medium text-xs text-foreground mb-1">Projeto não encontrado</p>
      <p className="text-2xs text-muted-foreground mb-4">Este projeto não existe ou você não tem acesso.</p>
      <button onClick={() => navigate("/app/projetos")}
        className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Voltar para projetos
      </button>
    </div>
  );

  const statusInfo = statusConfig[project.status as keyof typeof statusConfig] ?? statusConfig.draft;

  return (
    <>
      <div className="space-y-5">
        {/* ── Back link ── */}
        <button onClick={() => navigate("/app/projetos")}
          className="flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Todos os projetos
        </button>

        {/* ── Header card ── */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Status + badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={cn("px-2.5 py-1 rounded-full text-2xs font-semibold border", statusInfo.classes)}>
                  {statusInfo.label}
                </span>
                {project.niche && (
                  <span className="px-2.5 py-1 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20">
                    {project.niche}
                  </span>
                )}
                {project.type && (
                  <span className="px-2.5 py-1 rounded-full text-2xs font-medium bg-muted text-muted-foreground border border-border">
                    {project.type}
                  </span>
                )}
              </div>

              {/* Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={e => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") setEditingTitle(false); }}
                    className="font-display font-bold text-xl text-foreground bg-transparent border-b-2 border-primary outline-none w-full"
                  />
                </div>
              ) : (
                <h1
                  className="font-display font-bold text-xl text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-2 group"
                  onClick={() => { setTitleDraft(project.title); setEditingTitle(true); }}
                >
                  {project.title}
                  <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                </h1>
              )}

              <p className="text-2xs text-muted-foreground mt-1">
                Atualizado em {new Date(project.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>

            {/* Score + actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {project.quality_score !== null && (
                <ScoreRing score={project.quality_score} size="sm" showLabel={false} />
              )}

              <button
                onClick={() => toggleFavorite.mutate({ id: project.id, isFavorite: project.is_favorite })}
                className={cn("p-2 rounded-lg border transition-all duration-150",
                  project.is_favorite
                    ? "bg-warning/10 border-warning/30 text-warning"
                    : "border-border hover:border-warning/30 hover:text-warning text-muted-foreground"
                )}
                aria-label={project.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                {project.is_favorite ? <Star className="w-4 h-4 fill-warning" /> : <StarOff className="w-4 h-4" />}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg border border-border hover:border-primary/30 hover:bg-surface transition-all duration-150 text-muted-foreground"
                    aria-label="Mais opções">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleStatusChange("active")} disabled={project.status === "active"}>
                    <Check className="w-3.5 h-3.5 mr-2 text-success" />
                    Marcar como Ativo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("draft")} disabled={project.status === "draft"}>
                    <Edit3 className="w-3.5 h-3.5 mr-2" />
                    Marcar como Rascunho
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("archived")} disabled={project.status === "archived"}>
                    <Archive className="w-3.5 h-3.5 mr-2" />
                    Arquivar Projeto
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Excluir Projeto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 flex-wrap border-b border-border pb-1 overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all whitespace-nowrap",
                activeTab === tabId
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div>
          {activeTab === "overview"  && <OverviewTab project={project} />}
          {activeTab === "idea"      && <IdeaTab idea={project.original_idea} />}
          {activeTab === "prompts"   && <PromptsTab projectId={project.id} />}
          {activeTab === "versions"  && <VersionsTab projectId={project.id} />}
          {activeTab === "modules"   && <EmptyTab icon={Puzzle}     title="Módulos em construção"   sub="A decomposição em módulos será gerada por IA com base na sua ideia e requisitos." />}
          {activeTab === "screens"   && <EmptyTab icon={Monitor}    title="Telas em construção"     sub="O mapeamento de telas e jornadas será gerado automaticamente após análise do projeto." />}
          {activeTab === "database"  && <EmptyTab icon={Database}   title="Banco de dados"          sub="A estrutura de entidades e relacionamentos será gerada após a análise de módulos." />}
          {activeTab === "rules"     && <EmptyTab icon={ScrollText} title="Regras de negócio"       sub="As regras de negócio serão extraídas e documentadas automaticamente pela IA." />}
          {activeTab === "exports"   && <EmptyTab icon={Download}   title="Exportações"             sub="Exporte a documentação técnica completa do projeto em diferentes formatos." />}
          {activeTab === "eval"      && <EmptyTab icon={BarChart3}  title="Avaliação de qualidade"  sub="O score de qualidade será calculado após a análise completa do projeto." />}
          {activeTab === "ai"        && <AIReviewTab projectId={project.id} />}
        </div>
      </div>

      {/* ── Delete dialog ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto <strong>"{project.title}"</strong> e todos os dados associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectDetailPage;
