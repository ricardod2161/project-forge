import { useState } from "react";
import { motion } from "framer-motion";
import { BookTemplate, Search, Star, ArrowRight, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useProjectDetail";
import { useProjectWizard } from "@/hooks/useProjectWizard";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("rounded-md bg-muted/60 animate-pulse", className)} />
);

const nicheColors: Record<string, string> = {
  SaaS:         "bg-primary/10 text-primary border-primary/20",
  "E-commerce": "bg-success/10 text-success border-success/20",
  Clínica:      "bg-accent/10 text-accent border-accent/20",
  Academia:     "bg-warning/10 text-warning border-warning/20",
  Barbearia:    "bg-destructive/10 text-destructive border-destructive/20",
  Educação:     "bg-primary/10 text-primary border-primary/20",
  Imobiliária:  "bg-muted text-muted-foreground border-border",
  Delivery:     "bg-warning/10 text-warning border-warning/20",
};

interface TemplateContent {
  type?: string;
  platform?: string;
  complexity?: number;
  features?: string[];
  integrations?: string[];
  monetization?: string;
}

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading, error } = useTemplates();
  const { setIdea, setType, setNiche, setComplexity, setPlatform, setFeatures, setIntegrations, setMonetization } = useProjectWizard();
  const [search, setSearch] = useState("");
  const [activeNiche, setActiveNiche] = useState<string | null>(null);

  const niches = [...new Set((templates ?? []).map(t => t.niche))].sort();

  const filtered = (templates ?? []).filter(t => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      t.niche.toLowerCase().includes(search.toLowerCase());
    const matchNiche = activeNiche ? t.niche === activeNiche : true;
    return matchSearch && matchNiche;
  });

  const handleUseTemplate = (template: typeof filtered[0]) => {
    const content = template.content as TemplateContent | null;
    setIdea(`Projeto baseado no template: ${template.title}\n\n${template.description ?? ""}`);
    if (content?.type) setType(content.type);
    setNiche(template.niche);
    if (content?.complexity) setComplexity(content.complexity);
    if (content?.platform) setPlatform(content.platform);
    if (content?.features) setFeatures(content.features);
    if (content?.integrations) setIntegrations(content.integrations);
    if (content?.monetization) setMonetization(content.monetization);
    navigate("/app/projetos/novo");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-foreground">Templates</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Projetos pré-estruturados por nicho — use como ponto de partida
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar templates..."
            className="w-full sm:w-72 pl-9 pr-4 py-2 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveNiche(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all",
              !activeNiche ? "bg-primary/10 text-primary border-primary/20" : "border-border text-muted-foreground hover:text-foreground hover:bg-surface"
            )}
          >
            Todos
          </button>
          {niches.map(niche => (
            <button
              key={niche}
              onClick={() => setActiveNiche(activeNiche === niche ? null : niche)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all",
                activeNiche === niche ? "bg-primary/10 text-primary border-primary/20" : "border-border text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              {niche}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-xs text-destructive">Erro ao carregar templates. Tente novamente.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && (templates?.length ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border"
        >
          <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <BookTemplate className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-xs text-foreground mb-1">Nenhum template disponível</p>
          <p className="text-2xs text-muted-foreground">A biblioteca de templates será populada em breve.</p>
        </motion.div>
      )}

      {/* No results */}
      {!isLoading && !error && (templates?.length ?? 0) > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border">
          <p className="text-xs text-muted-foreground">Nenhum template encontrado para o filtro selecionado.</p>
        </div>
      )}

      {/* Templates grid */}
      {!isLoading && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((template, i) => {
            const content = template.content as TemplateContent | null;
            const badgeClass = nicheColors[template.niche] ?? "bg-muted text-muted-foreground border-border";
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="group relative flex flex-col p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
              >
                {template.is_featured && (
                  <div className="absolute top-3 right-3">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-2xs font-semibold border", badgeClass)}>
                    {template.niche}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-xs text-foreground mb-2 group-hover:text-primary transition-colors">
                  {template.title}
                </h3>

                {template.description && (
                  <p className="text-2xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
                    {template.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-2xs text-muted-foreground mb-4">
                  {content?.complexity && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Complexidade {content.complexity}/5
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {template.usage_count} usos
                  </span>
                </div>

                {/* Features preview */}
                {content?.features && content.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {content.features.slice(0, 3).map(f => (
                      <span key={f} className="px-1.5 py-0.5 rounded text-2xs bg-muted text-muted-foreground">
                        {f}
                      </span>
                    ))}
                    {content.features.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-2xs bg-muted text-muted-foreground">
                        +{content.features.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-150"
                >
                  Usar este template
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default TemplatesPage;
