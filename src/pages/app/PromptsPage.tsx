import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Copy, Check, Search, ExternalLink, X, Trash2,
  ChevronDown, Calendar, ArrowUpDown, Eye, MoreHorizontal,
  FileText, Hash, FolderOpen, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAllUserPrompts, useDeletePrompt, type Prompt } from "@/hooks/useProjectDetail";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROMPT_TYPE_LABELS: Record<string, string> = {
  master: "Master",
  frontend: "Frontend",
  backend: "Backend",
  database: "Banco de Dados",
  deploy: "Deploy",
  mvp: "MVP",
  mobile: "Mobile",
  tests: "Testes",
  security: "Segurança",
  api: "API",
  documentation: "Documentação",
};

const SORT_OPTIONS = [
  { value: "date_desc", label: "Mais recentes" },
  { value: "date_asc", label: "Mais antigos" },
  { value: "tokens_desc", label: "Mais tokens" },
  { value: "tokens_asc", label: "Menos tokens" },
  { value: "type", label: "Tipo" },
  { value: "project", label: "Projeto" },
] as const;

type SortOption = typeof SORT_OPTIONS[number]["value"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const countLines = (text: string) => text.split("\n").filter(l => l.trim()).length;

const renderPreviewLine = (line: string, idx: number) => {
  if (line.startsWith("### ")) {
    return (
      <span key={idx} className="block font-semibold text-foreground">
        {line.replace(/^###\s*/, "")}
      </span>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <span key={idx} className="block font-bold text-foreground">
        {line.replace(/^##\s*/, "")}
      </span>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <span key={idx} className="block font-bold text-primary">
        {line.replace(/^#\s*/, "")}
      </span>
    );
  }
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <span key={idx} className="block text-muted-foreground">
        • {line.replace(/^[-*]\s*/, "")}
      </span>
    );
  }
  return (
    <span key={idx} className="block text-muted-foreground">
      {line}
    </span>
  );
};

const getPreviewLines = (content: string, max = 4) =>
  content.split("\n").filter(l => l.trim()).slice(0, max);

// ─── Markdown renderer for modal ──────────────────────────────────────────────

const ModalMarkdown = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-xs leading-relaxed font-mono">
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return <p key={i} className="text-base font-bold text-primary pt-3 pb-1">{line.replace(/^#\s*/, "")}</p>;
        if (line.startsWith("## "))
          return <p key={i} className="text-sm font-bold text-foreground pt-2">{line.replace(/^##\s*/, "")}</p>;
        if (line.startsWith("### "))
          return <p key={i} className="text-xs font-semibold text-foreground/90 pt-1">{line.replace(/^###\s*/, "")}</p>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <p key={i} className="text-muted-foreground pl-3">• {line.replace(/^[-*]\s*/, "")}</p>;
        if (line.trim() === "")
          return <div key={i} className="h-2" />;
        return <p key={i} className="text-muted-foreground">{line}</p>;
      })}
    </div>
  );
};

// ─── Copy Button ──────────────────────────────────────────────────────────────

const CopyButton = ({ text, compact = false }: { text: string; compact?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copiar conteúdo"
      className={cn(
        "flex items-center gap-1.5 rounded-md text-2xs font-medium border transition-all duration-150",
        "border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
        compact ? "px-2 py-1" : "px-2.5 py-1.5"
      )}
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ prompts }: { prompts: (Prompt & { project_title?: string })[] }) => {
  const totalTokens = prompts.reduce((acc, p) => acc + (p.tokens_estimate ?? 0), 0);
  const uniqueProjects = new Set(prompts.map(p => p.project_id)).size;
  const typeCount: Record<string, number> = {};
  prompts.forEach(p => { typeCount[p.type] = (typeCount[p.type] ?? 0) + 1; });
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { icon: Zap, label: "Tokens totais", value: totalTokens > 0 ? totalTokens.toLocaleString("pt-BR") : "—" },
    { icon: FolderOpen, label: "Projetos cobertos", value: uniqueProjects.toString() },
    { icon: TrendingUp, label: "Tipo mais gerado", value: topType ? (PROMPT_TYPE_LABELS[topType[0]] ?? topType[0]) : "—" },
    { icon: FileText, label: "Total de prompts", value: prompts.length.toString() },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{value}</p>
            <p className="text-2xs text-muted-foreground truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Prompt Detail Modal ──────────────────────────────────────────────────────

const PromptDetailModal = ({
  prompt,
  open,
  onClose,
}: {
  prompt: (Prompt & { project_title?: string }) | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!prompt?.content) return;
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!prompt) return null;
  const lines = prompt.content ? countLines(prompt.content) : 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {PROMPT_TYPE_LABELS[prompt.type] ?? prompt.type}
                </span>
                <span className="text-2xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  v{prompt.version}
                </span>
                {prompt.platform && (
                  <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {prompt.platform}
                  </span>
                )}
              </div>
              <DialogTitle className="text-base font-semibold leading-snug text-foreground">
                {prompt.title}
              </DialogTitle>
              <div className="flex items-center gap-3 text-2xs text-muted-foreground flex-wrap">
                {prompt.tokens_estimate && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {prompt.tokens_estimate.toLocaleString("pt-BR")} tokens
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {lines} linhas
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true, locale: ptBR })}
                </span>
                {prompt.project_title && (
                  <span className="text-muted-foreground/60">{prompt.project_title}</span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 max-h-[58vh] overflow-y-auto bg-muted/20">
          {prompt.content ? (
            <ModalMarkdown content={prompt.content} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem conteúdo.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-background">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar prompt"}
            </button>
            {prompt.project_title && (
              <Link
                to={`/app/projetos/${prompt.project_id}`}
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Ir para projeto
              </Link>
            )}
          </div>
          <span className="text-2xs text-muted-foreground">
            {lines} linhas · {prompt.tokens_estimate?.toLocaleString("pt-BR") ?? "—"} tokens
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Prompt Card ──────────────────────────────────────────────────────────────

const PromptCard = ({
  prompt,
  index,
  onView,
  onDelete,
}: {
  prompt: Prompt & { project_title?: string };
  index: number;
  onView: () => void;
  onDelete: () => void;
}) => {
  const previewLines = prompt.content ? getPreviewLines(prompt.content, 4) : [];
  const totalLines = prompt.content ? countLines(prompt.content) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onView}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
            {PROMPT_TYPE_LABELS[prompt.type] ?? prompt.type}
          </span>
          <span className="font-semibold text-sm text-foreground truncate">{prompt.title}</span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onView}
            title="Ver prompt completo"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-150"
          >
            <Eye className="w-3 h-3" />
            Ver completo
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Mais ações"
                className="p-1.5 rounded-md border border-border hover:border-primary/30 hover:bg-muted transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onView} className="text-xs gap-2">
                <Eye className="w-3.5 h-3.5" />
                Ver completo
              </DropdownMenuItem>
              {prompt.content && (
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => navigator.clipboard.writeText(prompt.content!)}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </DropdownMenuItem>
              )}
              {prompt.project_title && (
                <DropdownMenuItem asChild className="text-xs gap-2">
                  <Link to={`/app/projetos/${prompt.project_id}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ir para projeto
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content preview */}
      {previewLines.length > 0 && (
        <div className="bg-muted/40 rounded-lg px-3 py-2.5 mb-3 space-y-0.5">
          {previewLines.map((line, i) => renderPreviewLine(line, i))}
          {totalLines > 4 && (
            <span className="block text-2xs text-primary/70 pt-1 font-medium">
              + {totalLines - 4} linhas a mais — clique para ver completo →
            </span>
          )}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 text-2xs text-muted-foreground">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-muted rounded px-1.5 py-0.5 font-mono">v{prompt.version}</span>
          {prompt.tokens_estimate != null && (
            <span className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              {prompt.tokens_estimate.toLocaleString("pt-BR")} tokens
            </span>
          )}
          {totalLines > 0 && (
            <span className="flex items-center gap-1">
              <Hash className="w-2.5 h-2.5" />
              {totalLines} linhas
            </span>
          )}
          {prompt.platform && (
            <span className="bg-muted rounded px-1.5 py-0.5">{prompt.platform}</span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground/70">
            <Calendar className="w-2.5 h-2.5" />
            {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        {prompt.project_title && (
          <Link
            to={`/app/projetos/${prompt.project_id}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-primary transition-colors group-hover:text-primary/70 truncate max-w-[120px]"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{prompt.project_title}</span>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PromptsPage = () => {
  const { data: prompts, isLoading, error } = useAllUserPrompts();
  const deletePrompt = useDeletePrompt();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [modalPrompt, setModalPrompt] = useState<(Prompt & { project_title?: string }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Type counts
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (prompts ?? []).forEach(p => { map[p.type] = (map[p.type] ?? 0) + 1; });
    return map;
  }, [prompts]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    const base = (prompts ?? []).filter(p => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.project_title ?? "").toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || p.type === typeFilter;
      return matchSearch && matchType;
    });

    return [...base].sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "date_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "tokens_desc":
          return (b.tokens_estimate ?? 0) - (a.tokens_estimate ?? 0);
        case "tokens_asc":
          return (a.tokens_estimate ?? 0) - (b.tokens_estimate ?? 0);
        case "type":
          return a.type.localeCompare(b.type);
        case "project":
          return (a.project_title ?? "").localeCompare(b.project_title ?? "");
        default:
          return 0;
      }
    });
  }, [prompts, search, typeFilter, sortBy]);

  const hasPrompts = (prompts?.length ?? 0) > 0;
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Ordenar";

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <PageHeader
        title="Prompts"
        subtitle="Todos os prompts gerados pelos seus projetos"
        badge={hasPrompts ? prompts?.length : undefined}
      >
        <Link
          to="/app/projetos"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          Ir para projetos
        </Link>
      </PageHeader>

      {/* Stats bar */}
      {hasPrompts && !isLoading && (
        <StatsBar prompts={prompts!} />
      )}

      {/* Search + Sort + Filters */}
      {hasPrompts && (
        <div className="space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título, conteúdo ou projeto..."
                className="w-full pl-9 pr-9 py-2.5 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-border hover:border-primary/30 hover:bg-muted transition-all whitespace-nowrap flex-shrink-0">
                  <ArrowUpDown className="w-3 h-3" />
                  <span className="hidden sm:inline">{currentSortLabel}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {SORT_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      "text-xs",
                      sortBy === opt.value && "text-primary font-medium"
                    )}
                  >
                    {sortBy === opt.value && <Check className="w-3 h-3 mr-1.5" />}
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Result counter */}
          {(search || typeFilter) && (
            <p className="text-2xs text-muted-foreground">
              {filtered.length} de {prompts?.length} prompts
            </p>
          )}

          {/* Type filter chips */}
          {Object.keys(typeCounts).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTypeFilter(null)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-medium transition-all border",
                  !typeFilter
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
                <span className={cn("text-2xs px-1.5 rounded-full", !typeFilter ? "bg-white/20" : "bg-muted")}>
                  {prompts?.length}
                </span>
              </button>
              {Object.entries(typeCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-medium transition-all border",
                    typeFilter === type
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  )}
                >
                  {PROMPT_TYPE_LABELS[type] ?? type}
                  <span className={cn("text-2xs px-1.5 rounded-full", typeFilter === type ? "bg-white/20" : "bg-muted")}>
                    {count}
                  </span>
                </button>
              ))}
              {typeFilter && (
                <button
                  onClick={() => setTypeFilter(null)}
                  className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" /> Limpar filtro
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <EmptyState
          title="Erro ao carregar prompts"
          description="Tente recarregar a página."
          action={{ label: "Recarregar", onClick: () => window.location.reload() }}
          className="border-destructive/20"
        />
      )}

      {/* Empty — no prompts */}
      {!isLoading && !error && !hasPrompts && (
        <EmptyState
          icon={Zap}
          title="Nenhum prompt ainda"
          description='Abra um projeto, acesse a aba "Prompts" e clique em "Gerar Prompt com IA" para criar seu primeiro prompt.'
          action={{ label: "Ver meus projetos", to: "/app/projetos" }}
          secondaryAction={{ label: "Criar novo projeto", to: "/app/projetos/novo" }}
        />
      )}

      {/* Empty search */}
      {!isLoading && !error && hasPrompts && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="Nenhum prompt encontrado"
          description={`Nenhum resultado para "${search || typeFilter}". Tente ajustar os filtros.`}
          secondaryAction={{ label: "Limpar filtros", onClick: () => { setSearch(""); setTypeFilter(null); } }}
          compact
        />
      )}

      {/* Prompts list */}
      {!isLoading && filtered.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${typeFilter}-${search}-${sortBy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filtered.map((prompt, i) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                index={i}
                onView={() => setModalPrompt(prompt)}
                onDelete={() => setDeleteTarget(prompt.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Detail Modal */}
      <PromptDetailModal
        prompt={modalPrompt}
        open={!!modalPrompt}
        onClose={() => setModalPrompt(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O prompt será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deletePrompt.mutate(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromptsPage;
