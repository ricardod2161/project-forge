import { motion } from "framer-motion";
import { BarChart3, ExternalLink, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import ScoreRing from "@/components/ScoreRing";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />
);

const getScoreLabel = (score: number) => {
  if (score >= 80) return { label: "Avançado",      classes: "bg-success/10 text-success border-success/20" };
  if (score >= 60) return { label: "Intermediário", classes: "bg-primary/10 text-primary border-primary/20" };
  if (score >= 40) return { label: "Básico",        classes: "bg-warning/10 text-warning border-warning/20" };
  return              { label: "Inicial",           classes: "bg-destructive/10 text-destructive border-destructive/20" };
};

const EvaluationsPage = () => {
  const { data: projects, isLoading, error } = useProjects();

  const scored = (projects ?? [])
    .filter(p => p.quality_score !== null)
    .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0));

  const unscored = (projects ?? []).filter(p => p.quality_score === null);

  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, p) => s + (p.quality_score ?? 0), 0) / scored.length)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Avaliações</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Score de qualidade dos seus projetos
          </p>
        </div>
        {avgScore !== null && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-2xs text-muted-foreground">Média geral:</span>
            <span className="text-xs font-bold text-primary">{avgScore}/100</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-xs text-destructive">Erro ao carregar avaliações. Tente novamente.</p>
        </div>
      )}

      {/* Empty state — no projects at all */}
      {!isLoading && !error && (projects?.length ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border"
        >
          <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-xs text-foreground mb-1">Nenhuma avaliação ainda</p>
          <p className="text-2xs text-muted-foreground text-center max-w-xs mb-4">
            Crie um projeto e execute uma avaliação para ver o score de qualidade aqui.
          </p>
          <Link
            to="/app/projetos/novo"
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Criar primeiro projeto
          </Link>
        </motion.div>
      )}

      {/* Scored projects */}
      {!isLoading && !error && scored.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-foreground">Projetos Avaliados ({scored.length})</h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scored.map((project, i) => {
              const { label: scoreLabel, classes } = getScoreLabel(project.quality_score!);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={cn("px-2 py-0.5 rounded-full text-2xs font-semibold border mb-2 inline-block", classes)}>
                        {scoreLabel}
                      </span>
                      <h3 className="font-semibold text-xs text-foreground truncate">{project.title}</h3>
                      {project.niche && (
                        <p className="text-2xs text-muted-foreground mt-0.5">{project.niche}</p>
                      )}
                    </div>
                    <ScoreRing score={project.quality_score!} size="sm" showLabel={false} />
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full",
                          project.quality_score! >= 80 ? "bg-success" :
                          project.quality_score! >= 60 ? "bg-primary" :
                          project.quality_score! >= 40 ? "bg-warning" : "bg-destructive"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${project.quality_score}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                      />
                    </div>
                    <span className="text-2xs font-bold text-foreground">{project.quality_score}/100</span>
                  </div>

                  <Link
                    to={`/app/projetos/${project.id}`}
                    className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors mt-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver projeto
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Unscored projects */}
      {!isLoading && !error && unscored.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground">Aguardando Avaliação ({unscored.length})</h2>
          <div className="space-y-2">
            {unscored.map(project => (
              <div key={project.id}
                className="flex items-center justify-between p-4 rounded-xl border border-dashed border-border bg-card/50">
                <div>
                  <p className="text-xs font-medium text-foreground">{project.title}</p>
                  {project.niche && <p className="text-2xs text-muted-foreground">{project.niche}</p>}
                </div>
                <Link
                  to={`/app/projetos/${project.id}`}
                  className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir projeto
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationsPage;
