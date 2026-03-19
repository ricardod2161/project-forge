import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const ExportsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Exportações</h1>
      <p className="text-muted-foreground text-xs mt-1">Central de exportação multiplataforma</p>
    </div>
    <div className={cn("flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border")}>
      <Upload className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground text-xs">Central de exportação disponível após Etapa 7</p>
    </div>
  </div>
);

export default ExportsPage;
