import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MoreHorizontal, Zap, Calendar, Archive, Eye, StarOff, ArrowRight, Copy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToggleFavorite, useDuplicateProject } from "@/hooks/useProjects";
import { useUpdateProject } from "@/hooks/useProjectDetail";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "active" | "archived";
  score?: number;
  isFavorite?: boolean;
  niche?: string;
  updatedAt?: string;
  promptsCount?: number;
}

const statusConfig = {
  draft:    { label: "Rascunho", classes: "bg-warning/10 text-warning border-warning/20" },
  active:   { label: "Ativo",    classes: "bg-success/10 text-success border-success/20" },
  archived: { label: "Arquivado", classes: "bg-muted text-muted-foreground border-border" },
};

const scoreColor = (s: number) =>
  s >= 80 ? "text-success" : s >= 60 ? "text-primary" : s >= 40 ? "text-warning" : "text-destructive";

const scoreBg = (s: number) =>
  s >= 80 ? "bg-success" : s >= 60 ? "bg-primary" : s >= 40 ? "bg-warning" : "bg-destructive";

const ProjectCard = ({
  id, title, description, status, score, isFavorite = false, niche, updatedAt, promptsCount = 0,
}: ProjectCardProps) => {
  const statusInfo = statusConfig[status] ?? statusConfig.draft;
  const toggleFavorite = useToggleFavorite();
  const updateProject = useUpdateProject(id);
  const duplicateProject = useDuplicateProject();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    updateProject.mutate({ status: status === "archived" ? "draft" : "archived" });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite.mutate({ id, isFavorite });
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative rounded-xl border bg-card",
        "hover:border-primary/30 hover:shadow-card-hover transition-all duration-200",
        "flex flex-col"
      )}
    >
      {score !== undefined && (
        <div className={cn("h-0.5 rounded-t-xl", scoreBg(score))} style={{ width: `${score}%` }} />
      )}

      <div className="flex flex-col gap-3.5 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className={cn("px-2 py-0.5 rounded-full text-2xs font-semibold border", statusInfo.classes)}>
                {statusInfo.label}
              </span>
              {niche && (
                <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20 truncate max-w-[80px]">
                  {niche}
                </span>
              )}
            </div>
            <Link to={`/app/projetos/${id}`}>
              <h3 className={cn(
                "font-display font-semibold text-xs text-foreground leading-snug",
                "group-hover:text-primary transition-colors duration-150",
                "line-clamp-2"
              )}>
                {title}
              </h3>
            </Link>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={handleFavorite}
              className="p-1.5 rounded-md hover:bg-surface transition-all"
              aria-label={isFavorite ? "Remover favorito" : "Favoritar"}
            >
              <Star className={cn("w-3.5 h-3.5 transition-all", isFavorite ? "text-warning fill-warning" : "text-muted-foreground hover:text-warning")} />
            </button>

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-md hover:bg-surface transition-all"
                  aria-label="Opções do projeto"
                  onClick={e => e.preventDefault()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/app/projetos/${id}`)}>
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicateProject.mutate(id)}>
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  Duplicar projeto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  {status === "archived" ? "Desarquivar" : "Arquivar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {description && (
          <p className="text-2xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {score !== undefined && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", scoreBg(score))}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <span className={cn("text-2xs font-bold flex-shrink-0 tabular-nums", scoreColor(score))}>
              {score}/100
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
        <div className="flex items-center gap-3 text-2xs text-muted-foreground">
          {promptsCount > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {promptsCount}
            </span>
          )}
          {updatedAt && (
            <span className="flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{updatedAt}</span>
            </span>
          )}
        </div>
        <Link
          to={`/app/projetos/${id}`}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-semibold",
            "bg-primary/8 text-primary border border-primary/20",
            "hover:bg-primary/15 hover:border-primary/40 transition-all duration-150"
          )}
        >
          Abrir <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
