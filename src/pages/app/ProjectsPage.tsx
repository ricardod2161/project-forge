import { useState } from "react";
import { Plus, Search, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import ProjectCard from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

type StatusFilter = "all" | "draft" | "active" | "archived";

const ProjectsPage = () => {
  const { data: projects, isLoading, error } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = (projects ?? []).filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.niche?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || p.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: "Todos", value: "all" },
    { label: "Rascunho", value: "draft" },
    { label: "Ativo", value: "active" },
    { label: "Arquivado", value: "archived" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Meus Projetos</h1>
          <p className="text-muted-foreground text-xs mt-1">
            {isLoading ? "Carregando…" : `${projects?.length ?? 0} projeto${(projects?.length ?? 0) !== 1 ? "s" : ""} no total`}
          </p>
        </div>
        <Link
          to="/app/projetos/novo"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
          )}
        >
          <Plus className="w-3.5 h-3.5" /> Novo Projeto
        </Link>
      </div>

      {/* Busca + Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
              "bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          />
        </div>

        <div className="flex items-center gap-1 bg-surface/50 rounded-lg p-1 border border-border">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-2xs font-medium transition-all",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className={cn(
          "flex flex-col items-center justify-center py-16 rounded-xl",
          "border border-dashed border-destructive/30 bg-destructive/5"
        )}>
          <p className="text-destructive text-xs font-medium mb-2">Erro ao carregar projetos</p>
          <p className="text-muted-foreground text-2xs">{(error as Error).message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex flex-col items-center justify-center py-20 rounded-xl",
            "border border-dashed border-border"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-foreground text-xs font-semibold mb-1">
            {search || statusFilter !== "all" ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
          </p>
          <p className="text-muted-foreground text-2xs mb-5 text-center max-w-xs">
            {search || statusFilter !== "all"
              ? "Tente ajustar a busca ou os filtros"
              : "Crie seu primeiro projeto e transforme sua ideia em sistema"}
          </p>
          {!search && statusFilter === "all" && (
            <Link
              to="/app/projetos/novo"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold",
                "bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
              )}
            >
              <Plus className="w-3.5 h-3.5" /> Criar projeto
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
      )}
    </div>
  );
};

export default ProjectsPage;
