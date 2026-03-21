import { useState } from "react";
import { Plus, Search, FolderOpen, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import ProjectCard from "@/components/ProjectCard";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

type StatusFilter = "all" | "draft" | "active" | "archived";
type SortBy = "updated" | "title" | "score";

const ProjectsPage = () => {
  const { data: projects, isLoading, error } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("updated");

  const filtered = (projects ?? [])
    .filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.niche?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "score") return (b.quality_score ?? -1) - (a.quality_score ?? -1);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const statusTabs: { label: string; value: StatusFilter; count?: number }[] = [
    { label: "Todos", value: "all", count: projects?.length },
    { label: "Rascunho", value: "draft", count: projects?.filter(p => p.status === "draft").length },
    { label: "Ativo", value: "active", count: projects?.filter(p => p.status === "active").length },
    { label: "Arquivado", value: "archived", count: projects?.filter(p => p.status === "archived").length },
  ];

  const sortOptions: { label: string; value: SortBy }[] = [
    { label: "Mais recente", value: "updated" },
    { label: "Título A–Z", value: "title" },
    { label: "Maior score", value: "score" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Meus Projetos"
        subtitle={
          isLoading
            ? "Carregando…"
            : `${projects?.length ?? 0} projeto${(projects?.length ?? 0) !== 1 ? "s" : ""} no total`
        }
      >
        <Link
          to="/app/projetos/novo"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
          )}
        >
          <Plus className="w-3.5 h-3.5" /> Novo Projeto
        </Link>
      </PageHeader>

      {/* Busca + Filtros + Sort */}
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, nicho ou descrição..."
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                "bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring",
                "placeholder:text-muted-foreground text-foreground transition-all"
              )}
            />
          </div>

          {/* Sort select */}
          <div className="relative flex-shrink-0">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="pl-9 pr-4 py-2.5 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none text-foreground cursor-pointer"
            >
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status tabs — scroll on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-medium transition-all flex-shrink-0",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-surface/50 border border-border hover:border-primary/30"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "text-2xs px-1.5 py-0.5 rounded-full font-bold",
                  statusFilter === tab.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={FolderOpen}
          title="Erro ao carregar projetos"
          description={(error as Error).message}
          action={{ label: "Tentar novamente", onClick: () => window.location.reload() }}
          className="border-destructive/20 bg-destructive/5"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search || statusFilter !== "all" ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
          description={
            search || statusFilter !== "all"
              ? "Tente ajustar a busca ou os filtros para encontrar o que procura."
              : "Crie seu primeiro projeto e transforme sua ideia em sistema completo."
          }
          action={
            !search && statusFilter === "all"
              ? { label: "Criar primeiro projeto", to: "/app/projetos/novo" }
              : undefined
          }
          secondaryAction={
            search || statusFilter !== "all"
              ? {
                  label: "Limpar filtros",
                  onClick: () => { setSearch(""); setStatusFilter("all"); },
                }
              : undefined
          }
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${statusFilter}-${sortBy}-${search}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProjectCard
                  id={project.id}
                  title={project.title}
                  description={project.description ?? undefined}
                  status={project.status as "draft" | "active" | "archived"}
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
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default ProjectsPage;
