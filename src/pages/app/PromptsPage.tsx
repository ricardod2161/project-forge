import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Copy, Check, Search, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAllUserPrompts } from "@/hooks/useProjectDetail";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />
);

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

  const filtered = (prompts ?? []).filter(
    p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.project_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Prompts</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Todos os prompts gerados pelos seus projetos
          </p>
        </div>
        {!isLoading && (prompts?.length ?? 0) > 0 && (
          <span className="px-3 py-1 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {prompts?.length} prompts
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, conteúdo ou projeto..."
          className="w-full max-w-sm pl-9 pr-4 py-2 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-xs text-destructive">Erro ao carregar prompts. Tente novamente.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && (prompts?.length ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-primary/60" />
          </div>
          <p className="font-medium text-xs text-foreground mb-1">Nenhum prompt ainda</p>
          <p className="text-2xs text-muted-foreground text-center max-w-xs mb-4">
            Crie um projeto e gere seus primeiros prompts para visualizá-los aqui.
          </p>
          <Link
            to="/app/projetos/novo"
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Criar primeiro projeto
          </Link>
        </motion.div>
      )}

      {/* No results after search */}
      {!isLoading && !error && (prompts?.length ?? 0) > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border">
          <p className="text-xs text-muted-foreground">Nenhum prompt encontrado para "{search}"</p>
        </div>
      )}

      {/* Prompts list */}
      {!isLoading && filtered.length > 0 && (
        <motion.div
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
              className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-200"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {prompt.type}
                  </span>
                  <span className="font-semibold text-xs text-foreground">{prompt.title}</span>
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
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-2xs text-muted-foreground">
                  <span>v{prompt.version}</span>
                  {prompt.tokens_estimate && <span>{prompt.tokens_estimate.toLocaleString()} tokens</span>}
                  {prompt.platform && <span>{prompt.platform}</span>}
                </div>
                {prompt.project_title && (
                  <Link
                    to={`/app/projetos/${prompt.project_id}`}
                    className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {prompt.project_title}
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PromptsPage;
