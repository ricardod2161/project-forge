import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const EvaluationsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Avaliações</h1>
      <p className="text-muted-foreground text-xs mt-1">Score de qualidade dos seus projetos</p>
    </div>
    <div className={cn("flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border")}>
      <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground text-xs">Score de qualidade disponível após Etapa 5</p>
    </div>
  </div>
);

export default EvaluationsPage;
