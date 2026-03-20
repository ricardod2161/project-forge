import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MoreHorizontal, Zap, Calendar, Archive, Eye, StarOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToggleFavorite } from "@/hooks/useProjects";
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

const ProjectCard = ({
  id, title, description, status, score, isFavorite = false, niche, updatedAt, promptsCount = 0,
}: ProjectCardProps) => {
  const statusInfo = statusConfig[status];
  const toggleFavorite = useToggleFavorite();
  const updateProject = useUpdateProject(id);
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
        "group relative p-5 rounded-xl border border-border bg-card",
        "hover:border-primary/30 hover:shadow-card-hover transition-all duration-200",
        "flex flex-col gap-4"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn("px-2 py-0.5 rounded-full text-2xs font-semibold border", statusInfo.classes)}>
              {statusInfo.label}
            </span>
            {niche && (
              <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-accent/10 text-accent border border-accent/20">
                {niche}
              </span>
            )}
          </div>
          <Link to={`/app/projetos/${id}`}>
            <h3 className={cn(
              "font-display font-semibold text-xs text-foreground leading-tight",
              "group-hover:text-primary transition-colors duration-150 truncate"
            )}>
              {title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isFavorite && <Star className="w-3.5 h-3.5 text-warning fill-warning" />}

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "p-1 rounded hover:bg-surface transition-all",
                  menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                aria-label="Opções do projeto"
                onClick={e => e.preventDefault()}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => navigate(`/app/projetos/${id}`)}>
                <Eye className="w-3.5 h-3.5 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFavorite}>
                {isFavorite
                  ? <><StarOff className="w-3.5 h-3.5 mr-2" />Remover favorito</>
                  : <><Star className="w-3.5 h-3.5 mr-2" />Adicionar favorito</>
                }
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

      {/* Descrição */}
      {description && (
        <p className="text-2xs text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Score */}
      {score !== undefined && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                score >= 80 ? "bg-success" :
                score >= 60 ? "bg-primary" :
                score >= 40 ? "bg-warning" : "bg-destructive"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <span className={cn(
            "text-2xs font-bold flex-shrink-0",
            score >= 80 ? "text-success" :
            score >= 60 ? "text-primary" :
            score >= 40 ? "text-warning" : "text-destructive"
          )}>
            {score}/100
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-3 text-2xs text-muted-foreground">
          {promptsCount > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {promptsCount} prompts
            </span>
          )}
          {updatedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {updatedAt}
            </span>
          )}
        </div>
        <Link
          to={`/app/projetos/${id}`}
          className={cn(
            "px-3 py-1 rounded-md text-2xs font-medium",
            "border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
            "transition-all duration-150 opacity-0 group-hover:opacity-100"
          )}
        >
          Abrir
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
