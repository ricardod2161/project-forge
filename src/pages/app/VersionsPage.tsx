import { useState } from "react";
import { motion } from "framer-motion";
import { History, Bot, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAllVersions } from "@/hooks/useProjectDetail";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />
);

const VersionsPage = () => {
  const { data: versions, isLoading, error } = useAllVersions();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Versões</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Controle de versões dos seus projetos
          </p>
        </div>
        {!isLoading && (versions?.length ?? 0) > 0 && (
          <span className="px-3 py-1 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {versions?.length} versões
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-xs text-destructive">Erro ao carregar versões. Tente novamente.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && (versions?.length ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border"
        >
          <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <History className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-xs text-foreground mb-1">Nenhuma versão registrada</p>
          <p className="text-2xs text-muted-foreground text-center max-w-xs">
            As versões aparecerão aqui conforme você evoluir seus projetos.
          </p>
        </motion.div>
      )}

      {/* Versions list */}
      {!isLoading && !error && (versions?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {versions!.map((v, i) => {
            const isExpanded = expanded === v.id;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Version badge */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">v{v.version_number}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {v.generated_by_ai && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20">
                          <Bot className="w-2.5 h-2.5" />
                          Gerado por IA
                        </span>
                      )}
                      <span className="text-2xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        {" às "}
                        {new Date(v.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Summary */}
                    {v.changes_summary && (
                      <p className="text-xs text-foreground leading-relaxed">{v.changes_summary}</p>
                    )}

                    {/* AI observations (expandable) */}
                    {v.ai_observations && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : v.id)}
                          className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Observações da IA
                        </button>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 p-3 rounded-lg bg-muted/40 border border-border"
                          >
                            <p className="text-2xs text-muted-foreground leading-relaxed">{v.ai_observations}</p>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Link to project */}
                  {v.project_title && (
                    <Link
                      to={`/app/projetos/${v.project_id}`}
                      className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {v.project_title}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default VersionsPage;
