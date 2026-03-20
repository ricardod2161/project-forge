import { motion } from "framer-motion";
import { FolderOpen, Plus, Zap, BarChart3, TrendingUp, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProjectMetrics, useRecentProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "@/components/ProjectCard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  loading: boolean;
  delay?: number;
}

const MetricCard = ({ label, value, icon: Icon, loading, delay = 0 }: MetricCardProps) => (
  <motion.div
    className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-200"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    {loading ? (
      <Skeleton className="h-8 w-16 rounded-md" />
    ) : (
      <p className="font-display font-bold text-2xl text-foreground">{value}</p>
    )}
  </motion.div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────

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
    },
    {
      label: "Projetos Ativos",
      value: metricsLoading ? "…" : String(metrics?.activeProjects ?? 0),
      icon: TrendingUp,
    },
    {
      label: "Prompts Gerados",
      value: metricsLoading ? "…" : String(metrics?.totalPrompts ?? 0),
      icon: Zap,
    },
    {
      label: "Score Médio",
      value: metricsLoading ? "…" : metrics?.avgScore !== null && metrics?.avgScore !== undefined ? `${metrics.avgScore}/100` : "—",
      icon: BarChart3,
    },
  ];

  const hasProjects = (recentProjects?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display font-bold text-xl text-foreground">
          Olá, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Bem-vindo ao Arquiteto IA — seu espaço de criação técnica
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            loading={metricsLoading}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* Projetos Recentes ou Estado Vazio */}
      {projectsLoading ? (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-sm text-foreground">Projetos Recentes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
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
            <h2 className="font-display font-semibold text-sm text-foreground">Projetos Recentes</h2>
            <Link
              to="/app/projetos"
              className="text-2xs text-primary hover:underline font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects!.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
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
        /* Estado vazio */
        <motion.div
          className={cn(
            "flex flex-col items-center justify-center py-20 rounded-xl",
            "border border-dashed border-border bg-surface/30"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-sm text-foreground mb-2">
            Seu primeiro projeto espera por você
          </h3>
          <p className="text-muted-foreground text-xs text-center max-w-xs mb-6 leading-relaxed">
            Descreva sua ideia e a IA cria a arquitetura completa: módulos, telas, banco de dados e prompts prontos.
          </p>
          <Link
            to="/app/projetos/novo"
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold",
              "bg-gradient-primary text-primary-foreground",
              "hover:shadow-glow transition-all duration-200"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Criar meu primeiro projeto
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
