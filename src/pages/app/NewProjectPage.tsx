import { useState, useEffect, KeyboardEvent } from "react";
import { ArrowLeft, Sparkles, X, Check, Plus, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { useCreateProject } from "@/hooks/useProjects";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["Ideia", "Classificação", "Detalhamento", "Confirmação"];
const IDEA_MIN_CHARS = 30;
const AUDIENCE_MIN_CHARS = 10;

const PROJECT_TYPES = [
  { value: "saas", label: "SaaS", emoji: "☁️", desc: "Software como serviço" },
  { value: "app", label: "App Mobile", emoji: "📱", desc: "iOS / Android" },
  { value: "erp", label: "ERP / CRM", emoji: "🏢", desc: "Sistema de gestão" },
  { value: "ecommerce", label: "E-commerce", emoji: "🛒", desc: "Loja virtual" },
  { value: "marketplace", label: "Marketplace", emoji: "🔀", desc: "Plataforma multi-vendedor" },
  { value: "landing", label: "Landing Page", emoji: "🎯", desc: "Página de conversão" },
];

const NICHES = [
  "Saúde", "Educação", "Finanças", "Varejo", "Barbearia", "Academia",
  "Clínica", "Jurídico", "Imobiliário", "Restaurante", "Pet Shop",
  "Logística", "RH", "Agência", "Tecnologia", "Outro",
];

const PLATFORMS = ["Web", "iOS", "Android", "Web + Mobile", "Desktop", "API / Backend"];

const MONETIZATIONS = [
  { value: "subscription", label: "Assinatura", desc: "Planos mensais/anuais" },
  { value: "freemium", label: "Freemium", desc: "Grátis com premium" },
  { value: "one-time", label: "Licença única", desc: "Pagamento único" },
  { value: "marketplace", label: "Comissão", desc: "% sobre transações" },
  { value: "ads", label: "Publicidade", desc: "Anúncios e banners" },
  { value: "none", label: "Sem monetização", desc: "Uso interno / gratuito" },
];

const INTEGRATIONS_LIST = [
  "Stripe", "MercadoPago", "PagSeguro", "WhatsApp", "SendGrid",
  "Firebase", "Google Analytics", "Zapier", "OpenAI", "Twilio",
];

// ─── Auto-save indicator ──────────────────────────────────────────────────────

const AutoSaveIndicator = ({ lastSaved }: { lastSaved: Date | null }) => {
  if (!lastSaved) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-2xs text-success"
    >
      <Save className="w-2.5 h-2.5" />
      Salvo automaticamente
    </motion.div>
  );
};

// ─── Step Components ──────────────────────────────────────────────────────────

const StepIdeia = () => {
  const { idea, setIdea, nextStep } = useProjectWizard();
  const [isRefining, setIsRefining] = useState(false);
  const isValid = idea.trim().length >= IDEA_MIN_CHARS;

  const handleRefineWithAI = async () => {
    if (idea.trim().length < 20) {
      toast.error("Escreva pelo menos 20 caracteres antes de refinar.");
      return;
    }
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("refine-idea", {
        body: { idea },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) {
          toast.error("Limite de requisições atingido. Aguarde alguns minutos.");
        } else if (data.error.includes("402") || data.error.includes("Créditos")) {
          toast.error("Créditos insuficientes. Acesse Configurações → Uso.");
        } else {
          toast.error(data.error);
        }
        return;
      }
      if (data?.refined) {
        setIdea(data.refined);
        toast.success("Ideia refinada com sucesso!");
      }
    } catch {
      toast.error("Erro ao refinar ideia. Tente novamente.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-5">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Descreva sua ideia</h2>
        <p className="text-muted-foreground text-xs">Escreva livremente — sem formato obrigatório.</p>
      </div>
      <div className="relative">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Ex: Um sistema de agendamento para barbearias com múltiplos profissionais, controle de estoque de produtos, caixa integrado e app para clientes acompanharem fila em tempo real..."
          className={cn(
            "w-full h-40 px-4 py-3 rounded-lg text-xs resize-none",
            "bg-input border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring transition-all",
            idea.trim().length > 0 && !isValid
              ? "border-warning/50 focus:ring-warning/30"
              : "border-border"
          )}
        />
        <span className={cn(
          "absolute bottom-3 right-3 text-2xs",
          isValid ? "text-success" : "text-muted-foreground"
        )}>
          {idea.trim().length}/{IDEA_MIN_CHARS} chars mín.
        </span>
      </div>

      {/* Inline validation message */}
      <AnimatePresence>
        {idea.trim().length > 0 && !isValid && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-2xs text-warning flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
            Descreva mais sua ideia (mín. {IDEA_MIN_CHARS} caracteres) para continuar.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button
          onClick={handleRefineWithAI}
          disabled={isRefining || idea.trim().length < 20}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
            "border border-primary/40 text-primary hover:bg-primary/10",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isRefining ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Refinando...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Refinar com IA</>
          )}
        </button>
        <button
          onClick={nextStep}
          disabled={!isValid}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
};

const StepClassificacao = () => {
  const {
    type, setType,
    niche, setNiche,
    complexity, setComplexity,
    platform, setPlatform,
    nextStep, prevStep,
  } = useProjectWizard();

  const isValid = !!type && !!niche && !!platform;
  const [attempted, setAttempted] = useState(false);

  const handleNext = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }
    nextStep();
  };

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Classifique seu projeto</h2>
        <p className="text-muted-foreground text-xs">Estas informações ajudam a IA a gerar uma arquitetura mais precisa.</p>
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Tipo de projeto</label>
          {attempted && !type && <span className="text-2xs text-warning">Selecione um tipo</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setType(pt.value)}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                type === pt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : attempted && !type
                    ? "border-warning/40 bg-warning/5 hover:border-warning/60 text-foreground"
                    : "border-border bg-surface/30 hover:border-primary/30 text-foreground"
              )}
            >
              <span className="text-base mb-1">{pt.emoji}</span>
              <span className="text-xs font-semibold">{pt.label}</span>
              <span className="text-2xs text-muted-foreground">{pt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nicho */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Nicho / Setor</label>
          {attempted && !niche && <span className="text-2xs text-warning">Selecione um nicho</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setNiche(n)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                niche === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : attempted && !niche
                    ? "border-warning/40 bg-warning/5 text-muted-foreground hover:border-warning/60 hover:text-foreground"
                    : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Complexidade */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Complexidade</label>
          <span className="text-xs font-bold text-primary">{complexity}/5</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={complexity}
          onChange={(e) => setComplexity(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-2xs text-muted-foreground">
          <span>Simples (MVP)</span>
          <span>Intermediário</span>
          <span>Complexo</span>
        </div>
      </div>

      {/* Plataforma */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Plataforma alvo</label>
          {attempted && !platform && <span className="text-2xs text-warning">Selecione uma plataforma</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                platform === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : attempted && !platform
                    ? "border-warning/40 bg-warning/5 text-muted-foreground hover:border-warning/60 hover:text-foreground"
                    : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={handleNext}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            !isValid && "opacity-60"
          )}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
};

const StepDetalhamento = () => {
  const {
    audience, setAudience,
    features, addFeature, removeFeature,
    monetization, setMonetization,
    integrations, toggleIntegration,
    nextStep, prevStep,
  } = useProjectWizard();

  const [featureInput, setFeatureInput] = useState("");
  const [attempted, setAttempted] = useState(false);
  const isAudienceValid = audience.trim().length >= AUDIENCE_MIN_CHARS;

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      addFeature(featureInput.trim());
      setFeatureInput("");
    }
  };

  const handleFeatureKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const handleNext = () => {
    if (!isAudienceValid) {
      setAttempted(true);
      return;
    }
    nextStep();
  };

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Detalhe seu projeto</h2>
        <p className="text-muted-foreground text-xs">Quanto mais detalhes, melhor a arquitetura gerada.</p>
      </div>

      {/* Público-alvo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Público-alvo</label>
          {attempted && !isAudienceValid && (
            <span className="text-2xs text-warning">Mínimo {AUDIENCE_MIN_CHARS} caracteres</span>
          )}
        </div>
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Ex: Donos de barbearias de pequeno e médio porte, sem conhecimento técnico..."
          className={cn(
            "w-full h-24 px-4 py-3 rounded-lg text-xs resize-none",
            "bg-input border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring transition-all",
            attempted && !isAudienceValid ? "border-warning/50 focus:ring-warning/30" : "border-border"
          )}
        />
        <div className="flex justify-between">
          <AnimatePresence>
            {attempted && !isAudienceValid && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-2xs text-warning">
                Descreva o público-alvo com mais detalhes para continuar.
              </motion.p>
            )}
          </AnimatePresence>
          <span className={cn("text-2xs ml-auto", isAudienceValid ? "text-success" : "text-muted-foreground")}>
            {audience.trim().length}/{AUDIENCE_MIN_CHARS}
          </span>
        </div>
      </div>

      {/* Funcionalidades */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Funcionalidades principais</label>
        <div className="flex gap-2">
          <input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={handleFeatureKeyDown}
            placeholder="Digite uma funcionalidade e pressione Enter..."
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-xs",
              "bg-input border border-border text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            )}
          />
          <button
            onClick={handleAddFeature}
            className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {features.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {f}
                <button
                  onClick={() => removeFeature(f)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Monetização */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Modelo de monetização</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MONETIZATIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMonetization(m.value)}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                monetization === m.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface/30 hover:border-primary/30 text-foreground"
              )}
            >
              <span className="text-xs font-semibold">{m.label}</span>
              <span className="text-2xs text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Integrações */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Integrações desejadas</label>
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS_LIST.map((integ) => (
            <button
              key={integ}
              onClick={() => toggleIntegration(integ)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                integrations.includes(integ)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface/30 text-muted-foreground hover:border-accent/40 hover:text-foreground"
              )}
            >
              {integrations.includes(integ) && <Check className="w-3 h-3 inline mr-1" />}
              {integ}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={handleNext}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            !isAudienceValid && "opacity-60"
          )}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
};

const LOADING_MESSAGES = [
  "Analisando sua ideia...",
  "Identificando módulos e funcionalidades...",
  "Estruturando a arquitetura do sistema...",
  "Salvando projeto no banco de dados...",
];

const StepConfirmacao = () => {
  const {
    idea, type, niche, complexity, platform,
    audience, features, monetization, integrations,
    title, setTitle, prevStep, reset,
  } = useProjectWizard();

  const { mutate: createProject, isPending } = useCreateProject();
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPending]);

  const derivedTitle = title || `${niche ? niche + " — " : ""}${
    PROJECT_TYPES.find((t) => t.value === type)?.label ?? "Projeto"
  }`;

  const handleCreate = () => {
    createProject(
      {
        title: derivedTitle,
        original_idea: idea,
        type,
        niche,
        complexity,
        platform,
        audience,
        features,
        monetization,
        integrations,
        status: "draft",
      },
      {
        onSuccess: () => reset(),
      }
    );
  };

  const Section = ({ label, value }: { label: string; value: string | string[] | number }) => (
    <div className="flex gap-3">
      <span className="text-2xs text-muted-foreground w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground flex-1">
        {Array.isArray(value) ? (value.length > 0 ? value.join(", ") : "—") : String(value || "—")}
      </span>
    </div>
  );

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Confirme os dados</h2>
        <p className="text-muted-foreground text-xs">Revise e confirme antes de gerar o projeto.</p>
      </div>

      {/* Título editável */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Nome do projeto</label>
        <input
          value={title || derivedTitle}
          onChange={e => setTitle(e.target.value)}
          placeholder={derivedTitle}
          className="w-full px-4 py-2.5 rounded-lg text-xs bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Resumo dos dados */}
      <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
        <Section label="Tipo" value={PROJECT_TYPES.find(t => t.value === type)?.label ?? type} />
        <Section label="Nicho" value={niche} />
        <Section label="Plataforma" value={platform} />
        <Section label="Complexidade" value={`${complexity}/5`} />
        {audience && <Section label="Público-alvo" value={audience} />}
        {features.length > 0 && <Section label="Funcionalidades" value={features} />}
        {monetization && <Section label="Monetização" value={monetization} />}
        {integrations.length > 0 && <Section label="Integrações" value={integrations} />}
      </div>

      {/* Ideia resumida */}
      {idea && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Ideia original</label>
          <p className="text-xs text-foreground leading-relaxed line-clamp-4 bg-muted/20 rounded-lg p-3 border border-border">
            {idea}
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40"
        >
          ← Voltar
        </button>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all min-w-[160px] justify-center",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            "disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-90"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="truncate"
                >
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </motion.span>
              </AnimatePresence>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Projeto
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const NewProjectPage = () => {
  const { currentStep, idea, type, niche, audience } = useProjectWizard();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save indicator — triggers whenever wizard state changes
  useEffect(() => {
    if (!idea && !type) return;
    const timer = setTimeout(() => setLastSaved(new Date()), 800);
    return () => clearTimeout(timer);
  }, [idea, type, niche, audience]);

  const stepComponents = [
    <StepIdeia key="0" />,
    <StepClassificacao key="1" />,
    <StepDetalhamento key="2" />,
    <StepConfirmacao key="3" />,
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/projetos"
          className="flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para projetos
        </Link>
        <AnimatePresence>
          <AutoSaveIndicator lastSaved={lastSaved} />
        </AnimatePresence>
      </div>

      <div>
        <h1 className="font-display font-bold text-xl text-foreground">Novo Projeto</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Descreva sua ideia e a IA irá estruturar o projeto completo para você.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className={cn(
              "flex items-center gap-1.5 flex-1",
              i < currentStep ? "opacity-60" : ""
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border-2 transition-all flex-shrink-0",
                i < currentStep
                  ? "bg-success border-success text-white"
                  : i === currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-transparent border-border text-muted-foreground"
              )}>
                {i < currentStep ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-2xs font-medium hidden sm:block",
                i === currentStep ? "text-foreground" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-px flex-1 mx-2 transition-all",
                i < currentStep ? "bg-success/60" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {stepComponents[currentStep]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NewProjectPage;
