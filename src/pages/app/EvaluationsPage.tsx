import { motion } from "framer-motion";
import { BarChart3, ExternalLink, TrendingUp, Loader2, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useProjectEvaluation } from "@/hooks/useProjectDetail";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import ScoreRing from "@/components/ScoreRing";
import { Skeleton } from "@/components/ui/skeleton";

const getScoreLabel = (score: number) => {
  if (score >= 80) return { label: "Avançado",      classes: "bg-success/10 text-success border-success/20" };
  if (score >= 60) return { label: "Intermediário", classes: "bg-primary/10 text-primary border-primary/20" };
  if (score >= 40) return { label: "Básico",        classes: "bg-warning/10 text-warning border-warning/20" };
  return              { label: "Inicial",           classes: "bg-destructive/10 text-destructive border-destructive/20" };
};

const scoreBg = (s: number) =>
  s >= 80 ? "bg-success" : s >= 60 ? "bg-primary" : s >= 40 ? "bg-warning" : "bg-destructive";

const EvaluateButton = ({ projectId }: { projectId: string }) => {
  const queryClient = useQueryClient();
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-project", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) toast.error("Limite de requisições atingido. Aguarde alguns minutos.");
        else if (data.error.includes("402") || data.error.includes("Créditos")) toast.error("Créditos insuficientes.");
        else toast.error(data.error);
        return;
      }
      toast.success("Avaliação concluída!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation", projectId] });
    } catch {
      toast.error("Erro ao avaliar projeto.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <button
      onClick={handleEvaluate}
      disabled={isEvaluating}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-2xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
    >
      {isEvaluating ? (
        <><Loader2 className="w-3 h-3 animate-spin" /> Avaliando...</>
      ) : (
        <><Bot className="w-3 h-3" /> Avaliar com IA</>
      )}
    </button>
  );
};

// Card expandido para projeto avaliado mostrando dimensões persistidas
const ScoredProjectCard = ({ project, index }: { project: { id: string; title: string; niche?: string | null; quality_score: number }; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const { data: evaluation } = useProjectEvaluation(project.id);
  const { label: scoreLabel, classes } = getScoreLabel(project.quality_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={cn("px-2 py-0.5 rounded-full text-2xs font-semibold border mb-2 inline-block", classes)}>
            {scoreLabel}
          </span>
          <h3 className="font-semibold text-xs text-foreground truncate">{project.title}</h3>
          {project.niche && <p className="text-2xs text-muted-foreground mt-0.5">{project.niche}</p>}
        </div>
        <ScoreRing score={project.quality_score} size="sm" showLabel={false} />
      </div>

      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", scoreBg(project.quality_score))}
            initial={{ width: 0 }}
            animate={{ width: `${project.quality_score}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
          />
        </div>
        <span className="text-2xs font-bold text-foreground">{project.quality_score}/100</span>
      </div>

      {/* Dimensões expandidas */}
      {evaluation && evaluation.dimensions.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors mt-3"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Ocultar" : "Ver"} dimensões
          </button>

          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2 overflow-hidden">
              {evaluation.dimensions.map(dim => (
                <div key={dim.name} className="flex items-center gap-2">
                  <span className="text-2xs text-muted-foreground w-24 flex-shrink-0 truncate">{dim.name}</span>
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", scoreBg(dim.score))} style={{ width: `${dim.score}%` }} />
                  </div>
                  <span className="text-2xs font-semibold text-foreground w-8 text-right">{dim.score}</span>
                </div>
              ))}
              {evaluation.top_priorities.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-2xs font-semibold text-foreground mb-1">Prioridades:</p>
                  {evaluation.top_priorities.slice(0, 2).map((p, i) => (
                    <p key={i} className="text-2xs text-muted-foreground flex items-start gap-1">
                      <span className="text-primary font-bold">{i + 1}.</span> {p}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      <div className="flex items-center justify-between mt-3">
        <Link to={`/app/projetos/${project.id}`}
          className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink className="w-3 h-3" />
          Ver projeto
        </Link>
        <EvaluateButton projectId={project.id} />
      </div>
    </motion.div>
  );
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Avaliações</h1>
          <p className="text-muted-foreground text-xs mt-1">Score de qualidade dos seus projetos</p>
        </div>
        {avgScore !== null && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-2xs text-muted-foreground">Média geral:</span>
            <span className="text-xs font-bold text-primary">{avgScore}/100</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      )}

      {error && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-xs text-destructive">Erro ao carregar avaliações. Tente novamente.</p>
        </div>
      )}

      {!isLoading && !error && (projects?.length ?? 0) === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border">
          <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-xs text-foreground mb-1">Nenhuma avaliação ainda</p>
          <p className="text-2xs text-muted-foreground text-center max-w-xs mb-4">
            Crie um projeto e execute uma avaliação para ver o score de qualidade aqui.
          </p>
          <Link to="/app/projetos/novo"
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Criar primeiro projeto
          </Link>
        </motion.div>
      )}

      {!isLoading && !error && scored.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-foreground">Projetos Avaliados ({scored.length})</h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scored.map((project, i) => (
              <ScoredProjectCard key={project.id} project={{ ...project, quality_score: project.quality_score! }} index={i} />
            ))}
          </motion.div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <EvaluateButton projectId={project.id} />
                  <Link to={`/app/projetos/${project.id}`}
                    className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationsPage;
