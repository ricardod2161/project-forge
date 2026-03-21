import { useState, KeyboardEvent } from "react";
import { ArrowLeft, Sparkles, X, Check, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { useCreateProject } from "@/hooks/useProjects";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["Ideia", "Classificação", "Detalhamento", "Confirmação"];

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

// ─── Step Components ──────────────────────────────────────────────────────────

const StepIdeia = () => {
  const { idea, setIdea, nextStep } = useProjectWizard();
  const [isRefining, setIsRefining] = useState(false);

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
    } catch (err) {
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
            "bg-input border border-border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          )}
        />
        <span className="absolute bottom-3 right-3 text-2xs text-muted-foreground">
          {idea.length} chars
        </span>
      </div>
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
          disabled={idea.trim().length < 20}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          Próximo →
        </button>
      </div>
      {idea.trim().length > 0 && idea.trim().length < 20 && (
        <p className="text-2xs text-muted-foreground">Escreva pelo menos 20 caracteres para continuar.</p>
      )}
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

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Classifique seu projeto</h2>
        <p className="text-muted-foreground text-xs">Estas informações ajudam a IA a gerar uma arquitetura mais precisa.</p>
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Tipo de projeto</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setType(pt.value)}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                type === pt.value
                  ? "border-primary bg-primary/10 text-primary"
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
        <label className="text-xs font-medium text-foreground">Nicho / Setor</label>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setNiche(n)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                niche === n
                  ? "border-primary bg-primary text-primary-foreground"
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
        <label className="text-xs font-medium text-foreground">Plataforma alvo</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                platform === p
                  ? "border-primary bg-primary text-primary-foreground"
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
          onClick={nextStep}
          disabled={!type || !niche || !platform}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            "disabled:opacity-40 disabled:cursor-not-allowed"
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

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Detalhe seu projeto</h2>
        <p className="text-muted-foreground text-xs">Quanto mais detalhes, melhor a arquitetura gerada.</p>
      </div>

      {/* Público-alvo */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Público-alvo</label>
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Ex: Donos de barbearias de pequeno e médio porte, sem conhecimento técnico..."
          className={cn(
            "w-full h-24 px-4 py-3 rounded-lg text-xs resize-none",
            "bg-input border border-border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          )}
        />
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
          onClick={nextStep}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow"
          )}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
};

const StepConfirmacao = () => {
  const {
    idea, type, niche, complexity, platform,
    audience, features, monetization, integrations,
    title, setTitle, prevStep, reset,
  } = useProjectWizard();

  const { mutate: createProject, isPending } = useCreateProject();

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
        <p className="text-muted-foreground text-xs">Revise tudo antes de criar o projeto.</p>
      </div>

      {/* Título editável */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Nome do projeto</label>
        <input
          value={title || derivedTitle}
          onChange={(e) => setTitle(e.target.value)}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg text-xs font-semibold",
            "bg-input border border-border text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          )}
        />
        <p className="text-2xs text-muted-foreground">Você pode editar o nome do projeto aqui.</p>
      </div>

      {/* Resumo */}
      <div className="p-4 rounded-lg bg-surface/50 border border-border space-y-3">
        <h3 className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Resumo
        </h3>
        <Section label="Ideia" value={idea.slice(0, 120) + (idea.length > 120 ? "…" : "")} />
        <Section label="Tipo" value={PROJECT_TYPES.find((t) => t.value === type)?.label ?? type} />
        <Section label="Nicho" value={niche} />
        <Section label="Complexidade" value={`${complexity}/5`} />
        <Section label="Plataforma" value={platform} />
        <Section label="Público-alvo" value={audience} />
        <Section label="Funcionalidades" value={features} />
        <Section label="Monetização" value={MONETIZATIONS.find((m) => m.value === monetization)?.label ?? monetization} />
        <Section label="Integrações" value={integrations} />
      </div>

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
            "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition-all",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow",
            "disabled:opacity-60 disabled:cursor-wait"
          )}
        >
          {isPending ? (
            <>
              <motion.div
                className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Criando…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Criar Projeto
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const NewProjectPage = () => {
  const { currentStep, setStep } = useProjectWizard();

  const stepComponents = [
    <StepIdeia key="ideia" />,
    <StepClassificacao key="classificacao" />,
    <StepDetalhamento key="detalhamento" />,
    <StepConfirmacao key="confirmacao" />,
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/app/projetos"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Novo Projeto</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Wizard inteligente de criação</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < currentStep && setStep(i)}
                disabled={i > currentStep}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold border-2 transition-all flex-shrink-0",
                  i === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "border-success bg-success text-success-foreground cursor-pointer"
                    : "border-border bg-surface text-muted-foreground"
                )}
              >
                {i < currentStep ? <Check className="w-3 h-3" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2 transition-colors",
                    i < currentStep ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {STEPS.map((step, i) => (
            <span
              key={step}
              className={cn(
                "text-2xs",
                i === currentStep ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {stepComponents[currentStep]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NewProjectPage;
