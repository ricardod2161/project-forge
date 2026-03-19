import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ProjectsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Meus Projetos</h1>
          <p className="text-muted-foreground text-xs mt-1">Gerencie todos os seus projetos</p>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Buscar projetos..."
          className={cn(
            "w-full max-w-sm pl-10 pr-4 py-2.5 rounded-lg text-xs",
            "bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        />
      </div>

      <div className={cn(
        "flex flex-col items-center justify-center py-20 rounded-xl",
        "border border-dashed border-border"
      )}>
        <p className="text-muted-foreground text-xs mb-4">Nenhum projeto ainda</p>
        <Link
          to="/app/projetos/novo"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
          )}
        >
          <Plus className="w-3.5 h-3.5" /> Criar projeto
        </Link>
      </div>
    </div>
  );
};

export default ProjectsPage;
