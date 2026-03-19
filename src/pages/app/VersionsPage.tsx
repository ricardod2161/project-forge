import { History } from "lucide-react";
import { cn } from "@/lib/utils";

const VersionsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Versões</h1>
      <p className="text-muted-foreground text-xs mt-1">Controle de versões dos seus projetos</p>
    </div>
    <div className={cn("flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border")}>
      <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground text-xs">Versionamento disponível após Etapa 6</p>
    </div>
  </div>
);

export default VersionsPage;
