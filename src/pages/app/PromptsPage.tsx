import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PromptsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Prompts</h1>
      <p className="text-muted-foreground text-xs mt-1">Todos os prompts gerados pelos seus projetos</p>
    </div>
    <div className={cn("flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border")}>
      <Zap className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground text-xs">Gerador de prompts disponível após Etapa 5</p>
    </div>
  </div>
);

export default PromptsPage;
