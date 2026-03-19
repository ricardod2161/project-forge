import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  "Visão Geral", "Ideia Original", "Requisitos", "Módulos",
  "Telas", "Banco de Dados", "Regras", "Prompts",
  "Exportações", "Avaliação", "Versões", "Revisão IA",
];

const ProjectDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">Projeto #{id}</h1>
            <p className="text-muted-foreground text-xs mt-1">Clique no título para editar</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-2xs font-semibold bg-success/10 text-success border border-success/20">
            Ativo
          </span>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap border-b border-border pb-1">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={cn(
              "px-3 py-1.5 rounded-lg text-2xs font-medium transition-all",
              i === 0
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-8 rounded-xl border border-dashed border-border text-center">
        <p className="text-muted-foreground text-xs">
          Conteúdo do projeto será exibido aqui após integração com Supabase.
        </p>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
