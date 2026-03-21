import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Copy, Check, Search, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAllUserPrompts } from "@/hooks/useProjectDetail";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

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
      aria-label="Copiar prompt"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
};

const PromptsPage = () => {
  const { data: prompts, isLoading, error } = useAllUserPrompts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Unique types with counts
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (prompts ?? []).forEach(p => { map[p.type] = (map[p.type] ?? 0) + 1; });
    return map;
  }, [prompts]);

  const filtered = useMemo(() =>
    (prompts ?? []).filter(p => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.project_title ?? "").toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || p.type === typeFilter;
      return matchSearch && matchType;
    }),
    [prompts, search, typeFilter]
  );

  const hasPrompts = (prompts?.length ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-4xl">
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

      {/* Search + type filters */}
      {hasPrompts && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, conteúdo ou projeto..."
              className="w-full sm:max-w-sm pl-9 pr-4 py-2.5 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>

          {/* Type filter chips */}
          {Object.keys(typeCounts).length > 1 && (
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
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
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

      {/* Empty state — no prompts at all */}
      {!isLoading && !error && !hasPrompts && (
        <EmptyState
          icon={Zap}
          title="Nenhum prompt ainda"
          description='Abra um projeto, acesse a aba "Prompts" e clique em "Gerar Prompt com IA" para criar seu primeiro prompt.'
          action={{ label: "Ver meus projetos", to: "/app/projetos" }}
          secondaryAction={{ label: "Criar novo projeto", to: "/app/projetos/novo" }}
        />
      )}

      {/* No search results */}
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
            key={`${typeFilter}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filtered.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-200 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                      {PROMPT_TYPE_LABELS[prompt.type] ?? prompt.type}
                    </span>
                    <span className="font-semibold text-xs text-foreground truncate">{prompt.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {prompt.content && <CopyButton text={prompt.content} />}
                  </div>
                </div>

                {/* Content preview */}
                {prompt.content && (
                  <pre className="text-2xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3 overflow-hidden line-clamp-4 whitespace-pre-wrap font-mono">
                    {prompt.content}
                  </pre>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                    <span className="bg-muted rounded px-1.5 py-0.5 font-mono">v{prompt.version}</span>
                    {prompt.tokens_estimate && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {prompt.tokens_estimate.toLocaleString()} tokens
                      </span>
                    )}
                    {prompt.platform && <span>{prompt.platform}</span>}
                  </div>
                  {prompt.project_title && (
                    <Link
                      to={`/app/projetos/${prompt.project_id}`}
                      className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors group-hover:text-primary/70"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{prompt.project_title}</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default PromptsPage;
