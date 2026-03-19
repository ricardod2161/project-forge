import { BookTemplate, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TemplatesPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Templates</h1>
      <p className="text-muted-foreground text-xs mt-1">Projetos pré-estruturados por nicho</p>
    </div>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input placeholder="Buscar templates..." className={cn("w-full max-w-sm pl-10 pr-4 py-2.5 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring")} />
    </div>
    <div className={cn("flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border")}>
      <BookTemplate className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground text-xs">Biblioteca de templates disponível após Etapa 7</p>
    </div>
  </div>
);

export default TemplatesPage;
