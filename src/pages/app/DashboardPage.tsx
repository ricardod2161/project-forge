import { motion } from "framer-motion";
import { FolderOpen, Plus, Zap, BarChart3, Star, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProjectMetrics, useRecentProjects } from "@/hooks/useProjects";
import ProjectCard from "@/components/ProjectCard";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useProjectMetrics();
  const { data: recentProjects, isLoading: projectsLoading } = useRecentProjects(6);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "usuário";
  const firstName = displayName.split(" ")[0];

  const metricItems = [
    {
      label: "Total de Projetos",
      value: metricsLoading ? "…" : String(metrics?.totalProjects ?? 0),
      icon: FolderOpen,
      description: "criados até hoje",
    },
    {
      label: "Favoritos",
      value: metricsLoading ? "…" : String(metrics?.favoriteProjects ?? 0),
      icon: Star,
      description: "projetos marcados",
      highlight: (metrics?.favoriteProjects ?? 0) > 0,
    },
    {
      label: "Prompts Gerados",
      value: metricsLoading ? "…" : String(metrics?.totalPrompts ?? 0),
      icon: Zap,
      description: "documentos de IA",
    },
    {
      label: "Score Médio",
      value:
        metricsLoading
          ? "…"
          : metrics?.avgScore !== null && metrics?.avgScore !== undefined
          ? `${metrics.avgScore}`
          : "—",
      icon: BarChart3,
      description: metrics?.avgScore ? "/ 100 pontos" : "sem avaliações",
    },
  ];

  const hasProjects = (recentProjects?.length ?? 0) > 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header premium */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-bold text-lg text-foreground">
              {getGreeting()}, <span className="text-gradient">{firstName}</span> 👋
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Seu painel de controle — acompanhe projetos, métricas e ações rápidas
          </p>
        </div>
        <Link
          to="/app/projetos/novo"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold",
            "bg-gradient-primary text-primary-foreground",
            "hover:shadow-glow transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]",
            "flex-shrink-0"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Projeto
        </Link>
      </motion.div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((m, i) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            loading={metricsLoading}
            description={m.description}
            delay={i * 0.07}
            highlight={m.highlight}
          />
        ))}
      </div>

      {/* Quick Actions */}
      {!hasProjects && !projectsLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Plus, label: "Criar Projeto", desc: "Transforme uma ideia em sistema", to: "/app/projetos/novo", primary: true },
            { icon: FolderOpen, label: "Ver Templates", desc: "Comece com um nicho pronto", to: "/app/templates", primary: false },
            { icon: Zap, label: "Gerar Prompts", desc: "Prompts prontos para IA", to: "/app/prompts", primary: false },
          ].map(({ icon: Icon, label, desc, to, primary }) => (
            <Link
              key={label}
              to={to}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                primary
                  ? "border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
                  : "border-border bg-card hover:border-primary/25 hover:shadow-card"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                primary ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
              )}>
                <Icon className={cn("w-4 h-4", primary ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-xs font-semibold", primary ? "text-primary" : "text-foreground")}>{label}</p>
                <p className="text-2xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </motion.div>
      )}

      {/* Projetos Recentes */}
      {projectsLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      ) : hasProjects ? (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display font-semibold text-xs text-foreground">Projetos Recentes</h2>
            </div>
            <Link
              to="/app/projetos"
              className="flex items-center gap-1 text-2xs text-primary hover:underline font-medium transition-colors"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects!.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <ProjectCard
                  id={project.id}
                  title={project.title}
                  description={project.description ?? undefined}
                  status={project.status}
                  score={project.quality_score ?? undefined}
                  isFavorite={project.is_favorite}
                  niche={project.niche ?? undefined}
                  updatedAt={formatDistanceToNow(new Date(project.updated_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <EmptyState
          icon={Star}
          title="Seu primeiro projeto espera por você"
          description="Descreva sua ideia e a IA cria a arquitetura completa: módulos, telas, banco de dados e prompts prontos."
          action={{ label: "Criar meu primeiro projeto", to: "/app/projetos/novo" }}
          secondaryAction={{ label: "Ver templates", to: "/app/templates" }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
