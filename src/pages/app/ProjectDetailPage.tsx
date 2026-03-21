import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, StarOff, ArrowLeft, Copy, Check, Layers, Lightbulb, Code2,
  Monitor, Database, ScrollText, Zap, Download, BarChart3, History,
  Bot, MoreHorizontal, Trash2, Archive, Edit3, Tag, Users, Globe, Puzzle,
  RefreshCw, AlertTriangle, AlertCircle, Lightbulb as LightbulbIcon, TrendingUp, ShieldAlert,
  Plus, Loader2, FileText, ChevronDown, Maximize2, X, Share2, ChevronRight,
  Palette, ShoppingCart, Mail, Wand2, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectDetail, useProjectPrompts, useProjectVersions, useUpdateProject, useDeleteProject } from "@/hooks/useProjectDetail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToggleFavorite, useDuplicateProject, type Project } from "@/hooks/useProjects";
import AIStreamingIndicator from "@/components/AIStreamingIndicator";
import AIContentTab from "@/components/AIContentTab";
import ScreensWithMockups from "@/components/ScreensWithMockups";
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
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";


const SYSTEM_TABS = [
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
];

const WEBSITE_TABS = [
  { id: "overview",   label: "Visão Geral",   icon: Layers     },
  { id: "idea",       label: "Briefing",      icon: Lightbulb  },
  { id: "pages",      label: "Páginas",       icon: Monitor    },
  { id: "copy",       label: "Copywriting",   icon: ScrollText },
  { id: "seo",        label: "SEO",           icon: TrendingUp },
  { id: "structure",  label: "Estrutura",     icon: Code2      },
  { id: "prompts",    label: "Prompts",       icon: Zap        },
  { id: "exports",    label: "Exportações",   icon: Download   },
  { id: "eval",       label: "Avaliação",     icon: BarChart3  },
  { id: "versions",   label: "Versões",       icon: History    },
  { id: "ai",         label: "Revisão IA",    icon: Bot        },
];

type TabId = string;

const statusConfig = {
  draft:    { label: "Rascunho", classes: "bg-warning/10 text-warning border-warning/20" },
  active:   { label: "Ativo",    classes: "bg-success/10 text-success border-success/20" },
  archived: { label: "Arquivado", classes: "bg-muted text-muted-foreground border-border" },
};

const complexityLabels: Record<number, string> = {
  1: "MVP Simples", 2: "Simples", 3: "Intermediário", 4: "Complexo", 5: "Enterprise",
};

const getScoreClassification = (score: number) => {
  if (score >= 90) return { label: "Enterprise", color: "text-success" };
  if (score >= 80) return { label: "Sênior",      color: "text-success" };
  if (score >= 65) return { label: "Avançado",    color: "text-primary" };
  if (score >= 40) return { label: "Intermediário", color: "text-warning" };
  return { label: "Básico", color: "text-destructive" };
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
import { Skeleton } from "@/components/ui/skeleton";

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
  const projectMeta = (project.metadata as Record<string, unknown>) ?? {};
  const isWebsite = projectMeta.mode === "website";

  const systemFields = [
    { icon: Tag,    label: "Tipo",          value: project.type     },
    { icon: Layers, label: "Nicho",         value: project.niche    },
    { icon: Globe,  label: "Plataforma",    value: project.platform },
    { icon: Users,  label: "Público-alvo",  value: project.audience },
    { icon: Code2,  label: "Monetização",   value: project.monetization },
  ];

  const websiteFields = [
    { icon: Tag,           label: "Tipo de site",  value: project.type     },
    { icon: Layers,        label: "Nicho",          value: project.niche    },
    { icon: Palette,       label: "Estilo visual",  value: String(projectMeta.website_style ?? "") || null },
    { icon: FileText,      label: "Tom de voz",     value: String(projectMeta.website_tone ?? "") || null },
    { icon: Globe,         label: "Plataforma",     value: project.platform },
  ];

  const fields = isWebsite ? websiteFields : systemFields;

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
            <p className="text-2xs text-muted-foreground mt-1.5 font-medium">
              {complexityLabels[project.complexity ?? 3] ?? "Intermediário"}
            </p>
          </div>
        )}
      </div>

      {/* Site-specific: sections */}
      {isWebsite && Array.isArray(projectMeta.website_sections) && (projectMeta.website_sections as string[]).length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Seções do Site
          </h3>
          <div className="flex flex-wrap gap-2">
            {(projectMeta.website_sections as string[]).map(s => (
              <InfoChip key={s} label={s} />
            ))}
          </div>
        </div>
      )}

      {/* Site-specific: features (ecommerce / blog / form) */}
      {isWebsite && (
        (() => {
          const items = [
            { label: "E-commerce", value: projectMeta.website_has_ecommerce, icon: ShoppingCart },
            { label: "Blog / CMS", value: projectMeta.website_has_blog,      icon: FileText     },
            { label: "Formulário", value: projectMeta.website_has_form,      icon: Mail         },
          ].filter(item => item.value);
          if (!items.length) return null;
          return (
            <div className="p-5 rounded-xl border border-border bg-card">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Recursos
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map(({ label, icon: Icon }) => (
                  <span key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium bg-success/10 text-success border border-success/20">
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          );
        })()
      )}

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
const PROMPT_TYPES_LIST = [
  { value: "master",        label: "Mestre",         shortLabel: "Mestre",    platform: "Lovable",          desc: "Prompt completo com toda a arquitetura do projeto." },
  { value: "frontend",      label: "Frontend",       shortLabel: "Frontend",  platform: "Lovable",          desc: "Componentes, páginas e design system do frontend." },
  { value: "backend",       label: "Backend",        shortLabel: "Backend",   platform: "Supabase",         desc: "Banco de dados, funções edge e regras de negócio." },
  { value: "database",      label: "Banco",          shortLabel: "Banco",     platform: "Supabase",         desc: "Schema SQL completo com tabelas, índices e RLS." },
  { value: "dashboard",     label: "Dashboard",      shortLabel: "Dash",      platform: "Lovable",          desc: "Painel administrativo com métricas e gráficos." },
  { value: "mvp",           label: "MVP",            shortLabel: "MVP",       platform: "Lovable",          desc: "Versão mínima viável com as funcionalidades core." },
  { value: "premium",       label: "Premium",        shortLabel: "Premium",   platform: "Lovable",          desc: "Versão avançada com todas as funcionalidades." },
  { value: "correction",    label: "Correção",       shortLabel: "Correção",  platform: "Lovable",          desc: "Guia para correção de bugs e melhorias de qualidade." },
  { value: "refactoring",   label: "Refatoração",    shortLabel: "Refactor",  platform: "Lovable",          desc: "Reestruturação de código para escalabilidade." },
  { value: "multiplatform", label: "Multiplataforma",shortLabel: "Multi",     platform: "Bubble",           desc: "Versão para múltiplas plataformas e dispositivos." },
];

const WEBSITE_PROMPT_TYPES_LIST = [
  { value: "site_master",      label: "Mestre do Site",  shortLabel: "Mestre",    platform: "Lovable",          desc: "Prompt mestre completo para construir todo o site." },
  { value: "site_copy",        label: "Copywriting",     shortLabel: "Copy",      platform: "Geral",            desc: "Textos persuasivos para todas as seções do site." },
  { value: "site_seo",         label: "Estratégia SEO",  shortLabel: "SEO",       platform: "Geral",            desc: "Keywords, meta tags, schema markup e checklist SEO." },
  { value: "site_design",      label: "Design System",   shortLabel: "Design",    platform: "Figma / Lovable",  desc: "Paleta de cores, tipografia e componentes visuais." },
  { value: "site_sections",    label: "Seções do Site",  shortLabel: "Seções",    platform: "Lovable",          desc: "Código detalhado para cada seção selecionada." },
  { value: "site_performance", label: "Performance",     shortLabel: "Perf",      platform: "Geral",            desc: "Lazy loading, Core Web Vitals e checklist lighthouse." },
  { value: "site_forms",       label: "Formulários",     shortLabel: "Forms",     platform: "Lovable",          desc: "Formulários com validação, integração e LGPD." },
  { value: "site_ecommerce",   label: "E-commerce",      shortLabel: "Loja",      platform: "Lovable",          desc: "Catálogo, carrinho, checkout e painel admin." },
  { value: "site_cms",         label: "Blog / CMS",      shortLabel: "CMS",       platform: "Lovable",          desc: "Blog com paginação, SEO e integração com CMS." },
  { value: "site_deploy",      label: "Deploy",          shortLabel: "Deploy",    platform: "Vercel / Netlify", desc: "Guia completo de deploy e go-live." },
];

const platformBadgeClasses: Record<string, string> = {
  "Lovable":          "bg-primary/10 text-primary border-primary/20",
  "Supabase":         "bg-success/10 text-success border-success/20",
  "Bubble":           "bg-accent/10 text-accent border-accent/20",
  "Geral":            "bg-muted text-muted-foreground border-border",
  "Figma / Lovable":  "bg-primary/10 text-primary border-primary/20",
  "Vercel / Netlify": "bg-muted text-muted-foreground border-border",
};

interface FocusModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
}
const FocusModal = ({ open, onClose, title, content }: FocusModalProps) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold text-foreground">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-2xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado!" : "Copiar tudo"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 p-5">
          <pre className="text-2xs font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const PromptsTab = ({ projectId, isWebsite }: { projectId: string; isWebsite: boolean }) => {
  const queryClient = useQueryClient();
  const { data: prompts, isLoading } = useProjectPrompts(projectId);
  const activeTypesList = isWebsite ? WEBSITE_PROMPT_TYPES_LIST : PROMPT_TYPES_LIST;
  const [selectedType, setSelectedType] = useState(() => isWebsite ? "site_master" : "master");
  const [generatingTypes, setGeneratingTypes] = useState<Set<string>>(new Set());
  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({});
  const [focusPrompt, setFocusPrompt] = useState<{ title: string; content: string } | null>(null);

  // BUG 2 FIX: sync selectedType when isWebsite changes (e.g. navigating between projects)
  useEffect(() => {
    setSelectedType(isWebsite ? "site_master" : "master");
    setSelectedVersions({});
  }, [isWebsite]);

  // Group prompts by type, sorted by version DESC
  const promptsByType = useMemo(() => {
    const grouped: Record<string, typeof prompts extends undefined ? never[] : NonNullable<typeof prompts>> = {};
    activeTypesList.forEach(t => { grouped[t.value] = []; });
    (prompts ?? []).forEach(p => {
      if (grouped[p.type] !== undefined) grouped[p.type].push(p);
      else grouped[p.type] = [p];
    });
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => b.version - a.version);
    });
    return grouped;
  }, [prompts, activeTypesList]);

  const currentTypeMeta = activeTypesList.find(t => t.value === selectedType) ?? activeTypesList[0];
  const typePrompts = promptsByType[selectedType] ?? [];
  const latestVersion = typePrompts[0]?.version;
  const selectedVersion = selectedVersions[selectedType] ?? latestVersion;
  const activePrompt = typePrompts.find(p => p.version === selectedVersion) ?? typePrompts[0];
  const isCurrentGenerating = generatingTypes.has(selectedType);
  const isOldVersion = activePrompt && latestVersion && activePrompt.version < latestVersion;

  const handleGenerate = async (type: string) => {
    setGeneratingTypes(prev => new Set(prev).add(type));
    try {
      const { data, error } = await supabase.functions.invoke("generate-prompt", {
        body: { project_id: projectId, prompt_type: type },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) toast.error("Limite de requisições atingido.");
        else toast.error(data.error);
        return;
      }
      toast.success("Prompt gerado e salvo!");
      setSelectedVersions(prev => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["prompts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["all-prompts"] });
    } catch {
      toast.error("Erro ao gerar prompt.");
    } finally {
      setGeneratingTypes(prev => { const s = new Set(prev); s.delete(type); return s; });
    }
  };

  const lineCount = activePrompt?.content ? activePrompt.content.split("\n").length : 0;
  const formattedDate = activePrompt?.created_at
    ? new Date(activePrompt.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-0">

      {/* ── Type sub-tabs ─────────────────────────────────────────────────── */}
      <ScrollArea className="w-full" type="scroll">
        <div className="flex gap-1 border-b border-border pb-0 mb-0 overflow-x-auto">
          {activeTypesList.map(t => {
            const tPrompts = promptsByType[t.value] ?? [];
            const hasPrompt = tPrompts.length > 0;
            const isGeneratingThis = generatingTypes.has(t.value);
            const isActive = selectedType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2.5 text-2xs font-medium whitespace-nowrap transition-all duration-150 border-b-2 -mb-px shrink-0",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {isGeneratingThis ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                ) : hasPrompt ? (
                  <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                )}
                {t.shortLabel}
                {hasPrompt && !isGeneratingThis && (
                  <span className={cn(
                    "px-1 py-0.5 rounded text-[9px] font-bold leading-none",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    v{tPrompts[0].version}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* ── Content panel ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedType}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="pt-4"
        >
          {/* State 1: Generating */}
          {isCurrentGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-10">
                <AIStreamingIndicator label={`Gerando prompt ${currentTypeMeta.label}...`} size="md" />
              </div>
              <div className="space-y-2">
                {[100, 85, 92, 70, 80].map((w, i) => (
                  <Skeleton key={i} className="h-3 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* State 2: Not generated */}
          {!isCurrentGenerating && !activePrompt && (
            <div className="flex flex-col items-center justify-center py-14 rounded-xl border border-dashed border-border gap-5">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <div className="text-center max-w-xs">
                <p className="text-xs font-semibold text-foreground mb-1">{currentTypeMeta.label}</p>
                <p className="text-2xs text-muted-foreground leading-relaxed">{currentTypeMeta.desc}</p>
                <span className={cn(
                  "inline-flex mt-2 px-2 py-0.5 rounded-full text-2xs font-medium border",
                  platformBadgeClasses[currentTypeMeta.platform] ?? "bg-muted text-muted-foreground border-border"
                )}>
                  {currentTypeMeta.platform}
                </span>
              </div>
              <button
                onClick={() => handleGenerate(selectedType)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
              >
                <Bot className="w-3.5 h-3.5" />
                Gerar com IA
              </button>
            </div>
          )}

          {/* State 3: Has prompt */}
          {!isCurrentGenerating && activePrompt && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-2xs font-semibold border",
                    platformBadgeClasses[currentTypeMeta.platform] ?? "bg-muted text-muted-foreground border-border"
                  )}>
                    {currentTypeMeta.platform}
                  </span>
                  {/* Version selector */}
                  {typePrompts.length > 1 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold border transition-colors",
                          isOldVersion
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : "border-success/30 bg-success/10 text-success"
                        )}>
                          v{activePrompt.version}
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[120px]">
                        {typePrompts.map(p => (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => setSelectedVersions(prev => ({ ...prev, [selectedType]: p.version }))}
                            className={cn("text-2xs", activePrompt.version === p.version && "text-primary font-semibold")}
                          >
                            v{p.version}
                            {p.version === latestVersion && <span className="ml-1.5 text-[9px] text-success font-bold">ATUAL</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold border border-success/30 bg-success/10 text-success">
                      v{activePrompt.version}
                    </span>
                  )}
                  {activePrompt.tokens_estimate && (
                    <span className="text-2xs text-muted-foreground font-medium">
                      {activePrompt.tokens_estimate.toLocaleString()} tokens
                    </span>
                  )}
                  {isOldVersion && (
                    <span className="text-2xs text-warning font-medium">versão antiga</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setFocusPrompt({ title: `${currentTypeMeta.label} · v${activePrompt.version}`, content: activePrompt.content ?? "" })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                    title="Modo foco"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  {activePrompt.content && <CopyButton text={activePrompt.content} />}
                  <button
                    onClick={() => handleGenerate(selectedType)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerar
                  </button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="h-[480px]">
                <pre className="p-4 text-2xs font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                  {activePrompt.content ?? ""}
                </pre>
              </ScrollArea>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
                <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                  {formattedDate && <span>Gerado em {formattedDate}</span>}
                  <span>{lineCount} linhas</span>
                  {typePrompts.length > 1 && (
                    <span>v{activePrompt.version} de {typePrompts.length} versões</span>
                  )}
                </div>
                {isOldVersion && (
                  <button
                    onClick={() => setSelectedVersions(prev => { const n = { ...prev }; delete n[selectedType]; return n; })}
                    className="text-2xs text-primary hover:underline font-medium"
                  >
                    Ver versão atual →
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Focus Modal */}
      {focusPrompt && (
        <FocusModal
          open={!!focusPrompt}
          onClose={() => setFocusPrompt(null)}
          title={focusPrompt.title}
          content={focusPrompt.content}
        />
      )}
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

interface FindingWithStatus extends Finding {
  status: "pending" | "applying" | "applied" | "dismissed";
  appliedFields?: string[];
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
  lacuna:         { label: "Lacuna",         classes: "bg-accent/10 text-accent border-accent/20" },
  inconsistencia: { label: "Inconsistência", classes: "bg-warning/10 text-warning border-warning/20" },
  melhoria:       { label: "Melhoria",       classes: "bg-primary/10 text-primary border-primary/20" },
  risco:          { label: "Risco",          classes: "bg-destructive/10 text-destructive border-destructive/20" },
} as const;

// ── Tab: AI Review ────────────────────────────────────────────────────────────
const AIReviewTab = ({
  projectId,
  onProjectUpdate,
}: {
  projectId: string;
  onProjectUpdate: (updates: Record<string, unknown>) => void;
}) => {
  const [findings, setFindings] = useState<FindingWithStatus[] | null>(null);
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
        } else {
          toast.error(data.error);
        }
        return;
      }
      const raw: Finding[] = data.findings ?? [];
      setFindings(raw.map(f => ({ ...f, status: "pending" as const })));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao executar revisão";
      if (msg.includes("rate") || msg.includes("429")) {
        toast.error("Limite de requisições atingido. Aguarde alguns minutos.");
      } else {
        toast.error(`Erro na revisão: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const handleApply = useCallback(async (index: number) => {
    if (!findings) return;
    const finding = findings[index];

    setFindings(prev => prev
      ? prev.map((f, i) => i === index ? { ...f, status: "applying" } : f)
      : prev
    );

    try {
      const { data, error } = await supabase.functions.invoke("apply-finding", {
        body: { project_id: projectId, finding },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setFindings(prev => prev
          ? prev.map((f, i) => i === index ? { ...f, status: "pending" } : f)
          : prev
        );
        return;
      }

      const updates = data.updates as Record<string, unknown>;
      const fields: string[] = data.fields ?? [];

      onProjectUpdate(updates);

      setFindings(prev => prev
        ? prev.map((f, i) => i === index ? { ...f, status: "applied", appliedFields: fields } : f)
        : prev
      );

      const fieldNames: Record<string, string> = {
        description: "Descrição",
        audience: "Público-alvo",
        monetization: "Monetização",
        platform: "Plataforma",
        complexity: "Complexidade",
        features: "Funcionalidades",
        integrations: "Integrações",
      };
      const readableFields = fields.map(f => fieldNames[f] ?? f).join(", ");
      toast.success(`Melhoria aplicada! ${readableFields ? `Campos atualizados: ${readableFields}` : ""}`, { duration: 4000 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao aplicar melhoria";
      toast.error(msg.includes("429") ? "Limite de requisições atingido." : msg);
      setFindings(prev => prev
        ? prev.map((f, i) => i === index ? { ...f, status: "pending" } : f)
        : prev
      );
    }
  }, [findings, projectId, onProjectUpdate]);

  const handleDismiss = useCallback((index: number) => {
    setFindings(prev => prev
      ? prev.map((f, i) => i === index ? { ...f, status: "dismissed" } : f)
      : prev
    );
  }, []);

  const filtered = findings
    ? (activeSeverity === "all"
        ? findings
        : findings.filter((f) => f.severity === activeSeverity))
    : [];

  const counts = findings
    ? {
        critico:   findings.filter((f) => f.severity === "critico").length,
        importante: findings.filter((f) => f.severity === "importante").length,
        sugestao:  findings.filter((f) => f.severity === "sugestao").length,
      }
    : null;

  const resolvedCount = findings
    ? findings.filter(f => f.status === "applied" || f.status === "dismissed").length
    : 0;
  const totalCount = findings?.length ?? 0;
  const allResolved = totalCount > 0 && resolvedCount === totalCount;
  const resolutionPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

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

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary bar */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {counts && (
              <>
                <span className="text-2xs font-medium text-muted-foreground">{totalCount} achados</span>
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
          <div className="flex items-center gap-2">
            {allResolved ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30 text-success text-2xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tudo revisado ✓
              </span>
            ) : (
              <span className="text-2xs text-muted-foreground font-medium">
                {resolvedCount} de {totalCount} resolvidos
              </span>
            )}
            <button
              onClick={runReview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-2xs font-medium text-muted-foreground transition-all duration-150"
            >
              <RefreshCw className="w-3 h-3" />
              Reanalisar
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full transition-colors", allResolved ? "bg-success" : "bg-primary")}
                initial={{ width: 0 }}
                animate={{ width: `${resolutionPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Severity filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "critico", "importante", "sugestao"] as const).map((s) => {
          const isAll = s === "all";
          const cfg = !isAll ? severityConfig[s] : null;
          const count = !isAll && counts ? counts[s] : totalCount;
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
            const originalIndex = findings!.indexOf(finding);
            const sev = severityConfig[finding.severity];
            const cat = categoryConfig[finding.category];
            const SevIcon = sev.icon;
            const isApplied = finding.status === "applied";
            const isDismissed = finding.status === "dismissed";
            const isApplying = finding.status === "applying";
            const isResolved = isApplied || isDismissed;

            return (
              <motion.div
                key={`${finding.title}-${originalIndex}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: isResolved ? 0.55 : 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className={cn(
                  "p-4 rounded-xl border bg-card transition-colors",
                  isApplied && "border-success/30 bg-success/3",
                  isDismissed && "border-border/50",
                  !isResolved && "border-border hover:border-border/80",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                    isApplied ? "bg-success/10 border-success/30 text-success" : sev.classes
                  )}>
                    {isApplied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <SevIcon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-2xs font-semibold border",
                        isApplied ? "bg-success/10 text-success border-success/30" : sev.classes
                      )}>
                        {isApplied ? "Aplicado" : isDismissed ? "Dispensado" : sev.label}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-2xs font-medium border", cat.classes)}>
                        {cat.label}
                      </span>
                      {isApplied && finding.appliedFields && finding.appliedFields.length > 0 && (
                        <span className="text-2xs text-success font-medium">
                          → {finding.appliedFields.join(", ")}
                        </span>
                      )}
                    </div>
                    <h4 className={cn(
                      "text-xs font-semibold mb-1 transition-colors",
                      isDismissed ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {finding.title}
                    </h4>
                    {!isResolved && (
                      <>
                        <p className="text-2xs text-muted-foreground leading-relaxed mb-3">{finding.description}</p>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 mb-3">
                          <AlertCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-2xs text-foreground leading-relaxed">
                            <span className="font-semibold text-primary">Recomendação: </span>
                            {finding.recommendation}
                          </p>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApply(originalIndex)}
                            disabled={isApplying}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-2xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none shadow-sm"
                          >
                            {isApplying ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Aplicando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3 h-3" />
                                Aplicar melhoria
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDismiss(originalIndex)}
                            disabled={isApplying}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-2xs font-medium hover:border-border/80 hover:text-foreground active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
                          >
                            <X className="w-3 h-3" />
                            Dispensar
                          </button>
                        </div>
                      </>
                    )}
                    {isDismissed && (
                      <p className="text-2xs text-muted-foreground mt-1">Dispensado — não será aplicado ao projeto.</p>
                    )}
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

// ── Tab: AI Evaluate ─────────────────────────────────────────────────────────
interface EvalDimension {
  name: string;
  score: number;
  justification: string;
  recommendations: string[];
}
interface EvalResult {
  dimensions: EvalDimension[];
  overall_score: number;
  summary: string;
  top_priorities: string[];
}

const EvalTab = ({
  projectId,
  currentScore,
  cachedResult,
  onResultCached,
}: {
  projectId: string;
  currentScore: number | null;
  cachedResult: EvalResult | null;
  onResultCached: (r: EvalResult) => void;
}) => {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<EvalResult | null>(cachedResult);
  const [isLoading, setIsLoading] = useState(false);

  const handleEvaluate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-project", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) toast.error("Limite de requisições atingido.");
        else toast.error(data.error);
        return;
      }
      setResult(data.evaluation);
      onResultCached(data.evaluation);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Avaliação concluída! Score salvo no projeto.");
    } catch {
      toast.error("Erro ao avaliar projeto.");
    } finally {
      setIsLoading(false);
    }
  };

  const radarData = result?.dimensions.map(d => ({ subject: d.name, score: d.score })) ?? [];

  if (!isLoading && !result) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border gap-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-primary/60" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Score de Qualidade</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Avalie seu projeto em 7 dimensões: Escopo, Estrutura, Técnico, Completude, Viabilidade, Monetização e Maturidade.
            {currentScore !== null && <span className="block mt-2 text-primary font-medium">Score atual: {currentScore}/100</span>}
          </p>
        </div>
        <button
          onClick={handleEvaluate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
        >
          <BarChart3 className="w-4 h-4" />
          {currentScore !== null ? "Reavaliar Projeto" : "Calcular Score com IA"}
        </button>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-center py-10">
          <AIStreamingIndicator label="IA avaliando projeto em 7 dimensões..." size="md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-5">
      {/* Score geral */}
      <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-6">
        <ScoreRing score={result!.overall_score} size="md" showLabel />
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-foreground mb-1">Score Geral</h3>
          <p className="text-2xs text-muted-foreground leading-relaxed">{result!.summary}</p>
        </div>
        <button onClick={handleEvaluate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 text-2xs text-muted-foreground hover:text-primary transition-all flex-shrink-0">
          <RefreshCw className="w-3 h-3" />
          Reavaliar
        </button>
      </div>

      {/* Radar chart */}
      {radarData.length > 0 && (
        <div className="p-5 rounded-xl border border-border bg-card">
          <h4 className="text-xs font-semibold text-foreground mb-4">Mapa de Dimensões</h4>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dimensões detalhadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {result!.dimensions.map(dim => (
          <div key={dim.name} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">{dim.name}</span>
              <span className={cn("text-xs font-bold",
                dim.score >= 80 ? "text-success" : dim.score >= 60 ? "text-primary" : dim.score >= 40 ? "text-warning" : "text-destructive"
              )}>{dim.score}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <motion.div
                className={cn("h-full rounded-full",
                  dim.score >= 80 ? "bg-success" : dim.score >= 60 ? "bg-primary" : dim.score >= 40 ? "bg-warning" : "bg-destructive"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${dim.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-2xs text-muted-foreground leading-relaxed">{dim.justification}</p>
            {dim.recommendations.length > 0 && (
              <ul className="mt-2 space-y-1">
                {dim.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="text-2xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">›</span>
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Prioridades */}
      {result!.top_priorities.length > 0 && (
        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            Principais Prioridades
          </h4>
          <ul className="space-y-2">
            {result!.top_priorities.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-2xs text-foreground">
                <span className="font-bold text-primary w-4 flex-shrink-0">{i + 1}.</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// ── Tab: Versions ─────────────────────────────────────────────────────────────
const VersionsTab = ({ projectId }: { projectId: string }) => {
  const queryClient = useQueryClient();
  const { data: versions, isLoading } = useProjectVersions(projectId);
  const [isCreating, setIsCreating] = useState(false);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCreateVersion = async () => {
    setIsCreating(true);
    try {
      // BUG 8 FIX: use max version_number to handle gaps from deletions
      const nextVersion = versions && versions.length > 0
        ? Math.max(...versions.map(v => v.version_number)) + 1
        : 1;
      const { error } = await supabase
        .from("project_versions")
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          changes_summary: note.trim() || `Versão ${nextVersion} criada manualmente.`,
          generated_by_ai: false,
          ai_observations: null,
        });
      if (error) throw error;
      toast.success(`v${nextVersion} criada!`);
      setNote("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["versions", projectId] });
    } catch {
      toast.error("Erro ao criar versão.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <span className="text-2xs text-muted-foreground font-medium">
          {versions?.length ?? 0} versão(ões) registrada(s)
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border border-border hover:border-primary/40 hover:text-primary transition-all"
        >
          <Plus className="w-3 h-3" />
          Nova versão
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3"
        >
          <label className="block text-2xs font-medium text-foreground">
            Nota desta versão (opcional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex: Adicionei novos módulos e refinei o público-alvo"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateVersion}
              disabled={isCreating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Criar versão
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Versions list */}
      {!versions?.length ? (
        <EmptyTab icon={History} title="Sem versões registradas"
          sub="As versões do projeto aparecerão aqui conforme você evoluir sua estrutura." />
      ) : (
        <div className="space-y-3">
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
        </div>
      )}
    </motion.div>
  );
};

// ── AIContentTabWrapper — estado persistido no pai ────────────────────────────
const AIContentTabWrapper = ({
  projectId,
  contentType,
  icon,
  title,
  description,
  persistedContent,
  onContentGenerated,
}: {
  projectId: string;
  contentType: "modules" | "screens" | "database" | "rules" | "site_pages" | "site_copy" | "site_seo" | "site_structure";
  icon: React.ElementType;
  title: string;
  description: string;
  persistedContent: string | null;
  onContentGenerated: (contentType: string, content: string) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-ai-content", {
        body: { project_id: projectId, content_type: contentType },
      });
      if (invokeError) throw invokeError;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) {
          setError("Limite de requisições atingido. Aguarde alguns minutos.");
        } else {
          setError(data.error);
        }
        return;
      }
      const generated = data?.content ?? "";
      onContentGenerated(contentType, generated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar conteúdo";
      if (msg.includes("429") || msg.includes("rate")) {
        setError("Limite de requisições atingido. Aguarde alguns minutos.");
      } else {
        setError("Erro ao gerar conteúdo. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIContentTab
      contentType={contentType}
      projectId={projectId}
      icon={icon}
      title={title}
      description={description}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      content={persistedContent}
      error={error}
    />
  );
};

// ── ScreensTabWrapper ─────────────────────────────────────────────────────────
const ScreensTabWrapper = ({
  projectId,
  persistedContent,
  onContentGenerated,
  projectMetadata,
  onUpdateMetadata,
  projectPlatform,
}: {
  projectId: string;
  persistedContent: string | null;
  onContentGenerated: (contentType: string, content: string) => void;
  projectMetadata: Record<string, unknown> | null;
  onUpdateMetadata: (patch: Record<string, unknown>) => void;
  projectPlatform?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialMockups = (projectMetadata?.mockups ?? {}) as Record<string, string>;

  const handleMockupSaved = (screenName: string, url: string) => {
    if (url.startsWith("data:")) return;
    const existingMockups = (projectMetadata?.mockups ?? {}) as Record<string, string>;
    onUpdateMetadata({ ...projectMetadata, mockups: { ...existingMockups, [screenName]: url } });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-ai-content", {
        body: { project_id: projectId, content_type: "screens" },
      });
      if (invokeError) throw invokeError;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) {
          setError("Limite de requisições atingido. Aguarde alguns minutos.");
        } else {
          setError(data.error);
        }
        return;
      }
      const generated = data?.content ?? "";
      onContentGenerated("screens", generated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar conteúdo";
      if (msg.includes("429") || msg.includes("rate")) {
        setError("Limite de requisições atingido. Aguarde alguns minutos.");
      } else {
        setError("Erro ao gerar telas. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreensWithMockups
      projectId={projectId}
      persistedContent={persistedContent}
      onContentGenerated={onContentGenerated}
      isLoading={isLoading}
      error={error}
      onGenerate={handleGenerate}
      initialMockups={initialMockups}
      onMockupSaved={handleMockupSaved}
      projectPlatform={projectPlatform}
    />
  );
};

// ── PagesTabWrapper ───────────────────────────────────────────────────────────
const PagesTabWrapper = ({
  projectId,
  persistedContent,
  onContentGenerated,
  projectMetadata,
  onUpdateMetadata,
}: {
  projectId: string;
  persistedContent: string | null;
  onContentGenerated: (contentType: string, content: string) => void;
  projectMetadata: Record<string, unknown> | null;
  onUpdateMetadata: (patch: Record<string, unknown>) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialMockups = (projectMetadata?.page_mockups ?? {}) as Record<string, string>;

  const handleMockupSaved = (pageName: string, url: string) => {
    if (url.startsWith("data:")) return;
    const existing = (projectMetadata?.page_mockups ?? {}) as Record<string, string>;
    onUpdateMetadata({ ...projectMetadata, page_mockups: { ...existing, [pageName]: url } });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-ai-content", {
        body: { project_id: projectId, content_type: "site_pages" },
      });
      if (invokeError) throw invokeError;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) {
          setError("Limite de requisições atingido. Aguarde alguns minutos.");
        } else {
          setError(data.error);
        }
        return;
      }
      const generated = data?.content ?? "";
      onContentGenerated("site_pages", generated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar conteúdo";
      if (msg.includes("429") || msg.includes("rate")) {
        setError("Limite de requisições atingido. Aguarde alguns minutos.");
      } else {
        setError("Erro ao gerar páginas. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreensWithMockups
      projectId={projectId}
      persistedContent={persistedContent}
      onContentGenerated={onContentGenerated}
      isLoading={isLoading}
      error={error}
      onGenerate={handleGenerate}
      initialMockups={initialMockups}
      onMockupSaved={handleMockupSaved}
      projectPlatform="Web"
      sectionLabel="página"
      emptyTitle="Páginas do Site + Mockups Visuais"
      emptyDescription="A IA detalhará cada página e seção do site e gerará mockups visuais de alta fidelidade para que você visualize exatamente como ficará cada parte."
    />
  );
};

// ── Tab: Inline Export ───────────────────────────────────────────────────────
const generateDocFromProject = (project: Project): string => {
  const lines: string[] = [];
  const line = (s: string) => lines.push(s);
  const br = () => lines.push("");
  line(`# ${project.title}`);
  br();
  line(`**Status:** ${project.status === "active" ? "Ativo" : project.status === "draft" ? "Rascunho" : "Arquivado"}`);
  if (project.type)       line(`**Tipo:** ${project.type}`);
  if (project.niche)      line(`**Nicho:** ${project.niche}`);
  if (project.platform)   line(`**Plataforma:** ${project.platform}`);
  if (project.complexity !== null && project.complexity !== undefined) line(`**Complexidade:** ${project.complexity}/5`);
  br();
  if (project.original_idea) { line(`## Ideia Original`); br(); line(project.original_idea); br(); }
  if (project.description)   { line(`## Descrição`); br(); line(project.description); br(); }
  if (project.audience)      { line(`## Público-Alvo`); br(); line(project.audience); br(); }
  if (project.features && project.features.length > 0) {
    line(`## Funcionalidades`); br();
    project.features.forEach(f => line(`- ${f}`));
    br();
  }
  if (project.integrations && project.integrations.length > 0) {
    line(`## Integrações`); br();
    project.integrations.forEach(i => line(`- ${i}`));
    br();
  }
  if (project.monetization) { line(`## Modelo de Monetização`); br(); line(project.monetization); br(); }
  line(`---`);
  line(`*Gerado em ${new Date().toLocaleDateString("pt-BR")} · Arquiteto IA*`);
  return lines.join("\n");
};

const InlineExportTab = ({ project }: { project: Project }) => {
  const { data: projectPrompts } = useProjectPrompts(project.id);
  const [copied, setCopied] = useState(false);
  const [exportMode, setExportMode] = useState<"doc" | "prompts">("doc");

  const docContent = generateDocFromProject(project);
  const docFileName = `${project.slug ?? project.title.toLowerCase().replace(/\s+/g, "-")}.md`;

  const generatePromptsDoc = (): string => {
    if (!projectPrompts?.length) return "Nenhum prompt gerado ainda.";
    const lines: string[] = [
      `# Prompts — ${project.title}`,
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} · Arquiteto IA`,
      "",
    ];
    projectPrompts.forEach(p => {
      lines.push(`${"═".repeat(60)}`);
      lines.push(`## ${p.title}`);
      lines.push(`Tipo: ${p.type} · Plataforma: ${p.platform ?? "Geral"} · v${p.version}`);
      lines.push(`Tokens estimados: ~${p.tokens_estimate ?? "—"}`);
      lines.push("");
      lines.push(p.content ?? "(sem conteúdo)");
      lines.push("");
    });
    return lines.join("\n");
  };

  const exportContent = exportMode === "doc" ? docContent : generatePromptsDoc();
  const exportFileName = exportMode === "doc" ? docFileName : `${project.slug ?? project.id}-prompts.txt`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportContent);
    setCopied(true);
    toast.success(exportMode === "doc" ? "Documentação copiada!" : "Prompts copiados!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setExportMode("doc")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
            exportMode === "doc"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          <FileText className="w-3 h-3" />
          Documentação Técnica
        </button>
        <button
          onClick={() => setExportMode("prompts")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
            exportMode === "prompts"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          <Zap className="w-3 h-3" />
          Todos os Prompts
          {(projectPrompts?.length ?? 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary">
              {projectPrompts?.length}
            </span>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all">
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
        <button onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
          <Download className="w-3.5 h-3.5" />
          Baixar {exportMode === "doc" ? ".md" : ".txt"}
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-2xs font-medium text-muted-foreground">{exportFileName}</span>
          </div>
          <span className="text-2xs text-muted-foreground">{exportContent.length} caracteres</span>
        </div>
        <pre className="p-5 text-2xs text-foreground leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-[480px]">
          {exportContent}
        </pre>
      </div>
    </motion.div>
  );
};


const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [aiContentCache, setAiContentCache] = useState<Record<string, string | null>>({});
  const [cacheInitialized, setCacheInitialized] = useState(false);
  const [evalResultCache, setEvalResultCache] = useState<EvalResult | null>(null);

  const { data: project, isLoading, error } = useProjectDetail(id);
  const { data: prompts } = useProjectPrompts(id ?? "");
  const toggleFavorite = useToggleFavorite();
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();
  // BUG 1 FIX: use the shared hook with proper slugify + cache invalidation
  const duplicateProject = useDuplicateProject();

  // Hydrate cache from persisted metadata on first load
  useEffect(() => {
    if (project && !cacheInitialized) {
      const meta = (project.metadata as Record<string, unknown>) ?? {};
      const saved = (meta.ai_content ?? {}) as Record<string, string>;
      if (Object.keys(saved).length > 0) {
        setAiContentCache(saved);
      }
      setCacheInitialized(true);
    }
  }, [project, cacheInitialized]);

  // UX FIX: scroll the AppLayout main container (not window) to top on tab change
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // When AI generates content: update in-memory cache AND persist to project.metadata
  const handleContentGenerated = useCallback((contentType: string, content: string) => {
    setAiContentCache(prev => ({ ...prev, [contentType]: content }));
    if (project) {
      const currentMeta = (project.metadata as Record<string, unknown>) ?? {};
      const currentAI = (currentMeta.ai_content ?? {}) as Record<string, string>;
      updateProject.mutate({
        metadata: {
          ...currentMeta,
          ai_content: { ...currentAI, [contentType]: content },
        } as never,
        _silent: true,
      } as never);
    }
  }, [project, updateProject]);

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

  // BUG 1 FIX: delegate to useDuplicateProject hook (uses slugify, invalidates queries correctly)
  const handleDuplicate = () => {
    if (!project) return;
    duplicateProject.mutate(project.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/app/projetos/${project?.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="space-y-5">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-36 rounded" />
      {/* Header card skeleton */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
            </div>
            <Skeleton className="h-7 w-64 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
            {/* Progress bar */}
            <Skeleton className="h-3 w-full rounded-full mt-2" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-1 flex-wrap border-b border-border pb-1">
        {SYSTEM_TABS.map(t => <Skeleton key={t.id} className="h-8 w-24 rounded-lg" />)}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
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
  const projectMeta = (project.metadata as Record<string, unknown>) ?? {};
  const isWebsite = projectMeta.mode === "website";
  const TABS = isWebsite ? WEBSITE_TABS : SYSTEM_TABS;

  // Compute tab content indicators
  const tabHasContent: Record<string, boolean> = {
    overview:       true,
    idea:           !!project.original_idea,
    modules:        !!aiContentCache["modules"],
    screens:        !!aiContentCache["screens"],
    database:       !!aiContentCache["database"],
    rules:          !!aiContentCache["rules"],
    pages:          !!aiContentCache["site_pages"],
    copy:           !!aiContentCache["site_copy"],
    seo:            !!aiContentCache["site_seo"],
    structure:      !!aiContentCache["site_structure"],
    prompts:        (prompts?.length ?? 0) > 0,
    eval:           project.quality_score !== null,
    versions:       false,   // BUG 4 FIX: versions query lives in VersionsTab, default to false to avoid misleading dot
    exports:        true,
    ai:             false,
  };

  // Compute project completeness
  const completionItems = [
    !!project.original_idea,
    !!aiContentCache[isWebsite ? "site_pages" : "modules"],
    !!aiContentCache[isWebsite ? "site_copy" : "screens"],
    !!aiContentCache[isWebsite ? "site_seo" : "database"],
    !!aiContentCache[isWebsite ? "site_structure" : "rules"],
    (prompts?.length ?? 0) > 0,
  ];
  const completedSections = completionItems.filter(Boolean).length;
  const totalSections = completionItems.length;
  const completionPercent = Math.round((completedSections / totalSections) * 100);

  const scoreClassification = project.quality_score !== null
    ? getScoreClassification(project.quality_score)
    : null;

  return (
    <>
      <div className="space-y-5">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-2xs text-muted-foreground" aria-label="Breadcrumb">
          <button
            onClick={() => navigate("/app/projetos")}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Meus Projetos
          </button>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{project.title}</span>
        </nav>

        {/* ── Header card ── */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-xl border border-border bg-card overflow-hidden relative">

          {/* Score-based gradient line at top */}
          {project.quality_score !== null && (
            <div
              className="h-0.5 w-full absolute top-0 left-0 right-0"
              style={{
                background: project.quality_score >= 80
                  ? "linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))"
                  : project.quality_score >= 60
                    ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                    : project.quality_score >= 40
                      ? "linear-gradient(90deg, hsl(var(--warning)), hsl(var(--primary)))"
                      : "linear-gradient(90deg, hsl(var(--destructive)), hsl(var(--warning)))",
                width: `${project.quality_score}%`,
              }}
            />
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Status + badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={cn("px-2.5 py-1 rounded-full text-2xs font-semibold border", statusInfo.classes)}>
                    {statusInfo.label}
                  </span>
                  {isWebsite && (
                    <span className="px-2.5 py-1 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/25 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      Site
                    </span>
                  )}
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
                    title="Clique para editar"
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

                {/* Completion bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-muted-foreground font-medium">Completude do projeto</span>
                    <span className="text-2xs font-semibold text-foreground">{completionPercent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <p className="text-2xs text-muted-foreground">
                    {completedSections} de {totalSections} seções geradas
                  </p>
                </div>
              </div>

              {/* Score + actions */}
              <div className="flex items-start gap-3 flex-shrink-0">
                {project.quality_score !== null && (
                  <div className="flex flex-col items-center gap-1">
                    <ScoreRing score={project.quality_score} size="sm" showLabel={false} />
                    {scoreClassification && (
                      <span className={cn("text-[10px] font-semibold", scoreClassification.color)}>
                        {scoreClassification.label}
                      </span>
                    )}
                  </div>
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
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Duplicar projeto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="w-3.5 h-3.5 mr-2" />
                      Copiar link do projeto
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 flex-wrap border-b border-border pb-1 overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium transition-all whitespace-nowrap",
                activeTab === tabId
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
              {/* Content indicator dot */}
              {tabHasContent[tabId] && activeTab !== tabId && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-success" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content with AnimatePresence ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview"   && <OverviewTab project={project} />}
            {activeTab === "idea"       && <IdeaTab idea={project.original_idea} />}
            {activeTab === "prompts"    && <PromptsTab projectId={project.id} isWebsite={isWebsite} />}
            {activeTab === "versions"   && <VersionsTab projectId={project.id} />}
            {/* System tabs */}
            {activeTab === "modules"   && !isWebsite && <AIContentTabWrapper projectId={project.id} contentType="modules" icon={Puzzle} title="Módulos do Sistema" description="A IA decomporá o projeto em módulos bem definidos, com funcionalidades, dependências e complexidade de cada um." persistedContent={aiContentCache["modules"] ?? null} onContentGenerated={handleContentGenerated} />}
            {activeTab === "screens"   && !isWebsite && <ScreensTabWrapper projectId={project.id} persistedContent={aiContentCache["screens"] ?? null} onContentGenerated={handleContentGenerated} projectMetadata={(project.metadata as Record<string, unknown>) ?? {}} onUpdateMetadata={(patch) => updateProject.mutate({ metadata: patch as never, _silent: true } as never)} projectPlatform={project.platform ?? undefined} />}
            {activeTab === "database"  && !isWebsite && <AIContentTabWrapper projectId={project.id} contentType="database" icon={Database} title="Esquema do Banco de Dados" description="A IA gerará o schema SQL completo com tabelas, relacionamentos, índices e RLS policies." persistedContent={aiContentCache["database"] ?? null} onContentGenerated={handleContentGenerated} />}
            {activeTab === "rules"     && !isWebsite && <AIContentTabWrapper projectId={project.id} contentType="rules" icon={ScrollText} title="Regras de Negócio" description="A IA documentará todas as regras de negócio, validações e fluxos condicionais do sistema." persistedContent={aiContentCache["rules"] ?? null} onContentGenerated={handleContentGenerated} />}
            {/* Website tabs */}
            {activeTab === "pages"     && isWebsite && <PagesTabWrapper projectId={project.id} persistedContent={aiContentCache["site_pages"] ?? null} onContentGenerated={handleContentGenerated} projectMetadata={(project.metadata as Record<string, unknown>) ?? {}} onUpdateMetadata={(patch) => updateProject.mutate({ metadata: patch as never, _silent: true } as never)} />}
            {activeTab === "copy"      && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_copy" icon={ScrollText} title="Copywriting e Textos" description="Textos persuasivos para cada seção, adaptados ao tom de comunicação escolhido." persistedContent={aiContentCache["site_copy"] ?? null} onContentGenerated={handleContentGenerated} />}
            {activeTab === "seo"       && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_seo" icon={TrendingUp} title="Estratégia SEO" description="Keywords, meta tags, schema markup e checklist técnico de SEO." persistedContent={aiContentCache["site_seo"] ?? null} onContentGenerated={handleContentGenerated} />}
            {activeTab === "structure" && isWebsite && <AIContentTabWrapper projectId={project.id} contentType="site_structure" icon={Code2} title="Arquitetura e Estrutura" description="Stack técnica, estrutura de pastas, componentes e configuração de deploy." persistedContent={aiContentCache["site_structure"] ?? null} onContentGenerated={handleContentGenerated} />}
            {activeTab === "exports"   && <InlineExportTab project={project} />}
            {activeTab === "eval"      && (
              <EvalTab
                projectId={project.id}
                currentScore={project.quality_score}
                cachedResult={evalResultCache}
                onResultCached={setEvalResultCache}
              />
            )}
            {activeTab === "ai"        && <AIReviewTab projectId={project.id} />}
          </motion.div>
        </AnimatePresence>
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
