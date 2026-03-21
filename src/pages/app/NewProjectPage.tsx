import { useState, useEffect, KeyboardEvent } from "react";
import { ArrowLeft, Sparkles, X, Check, Plus, Loader2, Save, Cpu, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { useCreateProject } from "@/hooks/useProjects";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// ─── Constants ────────────────────────────────────────────────────────────────

const IDEA_MIN_CHARS = 30;
const AUDIENCE_MIN_CHARS = 10;

const PROJECT_TYPES = [
  { value: "saas",        label: "SaaS",          emoji: "☁️", desc: "Software como serviço" },
  { value: "app",         label: "App Mobile",    emoji: "📱", desc: "iOS / Android" },
  { value: "erp",         label: "ERP / CRM",     emoji: "🏢", desc: "Sistema de gestão" },
  { value: "ecommerce",   label: "E-commerce",    emoji: "🛒", desc: "Loja virtual" },
  { value: "marketplace", label: "Marketplace",   emoji: "🔀", desc: "Plataforma multi-vendedor" },
  { value: "landing",     label: "Landing Page",  emoji: "🎯", desc: "Página de conversão" },
];

const WEBSITE_TYPES = [
  { value: "landing",        label: "Landing Page",     emoji: "🎯", desc: "Conversão e captação de leads" },
  { value: "institucional",  label: "Institucional",    emoji: "🏢", desc: "Presença digital da empresa" },
  { value: "portfolio",      label: "Portfólio",        emoji: "🎨", desc: "Apresentação de trabalhos" },
  { value: "blog",           label: "Blog / Conteúdo",  emoji: "✍️", desc: "Artigos e publicações" },
  { value: "ecommerce_site", label: "Loja Virtual",     emoji: "🛍️", desc: "Loja com carrinho e pagamento" },
  { value: "evento",         label: "Site de Evento",   emoji: "🎪", desc: "Conferência, curso, lançamento" },
  { value: "saas_landing",   label: "SaaS Landing",     emoji: "☁️", desc: "Apresentação de software" },
  { value: "restaurante",    label: "Restaurante",      emoji: "🍽️", desc: "Cardápio, reservas, delivery" },
  { value: "clinica",        label: "Clínica / Saúde",  emoji: "🏥", desc: "Serviços e agendamento médico" },
  { value: "agencia",        label: "Agência / Freela", emoji: "💼", desc: "Serviços criativos ou técnicos" },
  { value: "imobiliaria",    label: "Imobiliária",      emoji: "🏠", desc: "Listagem e captação de imóveis" },
  { value: "outro_site",     label: "Outro",            emoji: "🌐", desc: "Outro tipo de site" },
];

const WEBSITE_SECTIONS = [
  "Hero / Capa", "Sobre / Quem somos", "Serviços / O que fazemos",
  "Portfólio / Cases", "Depoimentos / Reviews", "Preços / Planos",
  "FAQ", "Blog / Notícias", "Galeria de fotos", "Formulário de contato",
  "Mapa / Localização", "Equipe", "Parceiros / Clientes",
  "CTA / Chamada para ação", "Área do cliente (login)",
  "Checkout / Pagamento", "Newsletter", "Cronômetro / Countdown",
];

const WEBSITE_STYLES = [
  { value: "minimalista",  label: "Minimalista",    emoji: "⬜", desc: "Limpo, espaçoso, tipografia forte" },
  { value: "corporativo",  label: "Corporativo",    emoji: "🔷", desc: "Sério, confiável, profissional" },
  { value: "criativo",     label: "Criativo",       emoji: "🎨", desc: "Colorido, ousado, fora do padrão" },
  { value: "tech",         label: "Tech / Dark",    emoji: "🖥️", desc: "Escuro, futurista, moderno" },
  { value: "elegante",     label: "Elegante / Luxo",emoji: "✨", desc: "Premium, sofisticado, refinado" },
  { value: "amigavel",     label: "Amigável",       emoji: "😊", desc: "Colorido, acessível, jovem" },
  { value: "fotografico",  label: "Fotográfico",    emoji: "📸", desc: "Imagens grandes, visual forte" },
  { value: "editorial",    label: "Editorial",      emoji: "📰", desc: "Tipografia dominante" },
];

const WEBSITE_TONES = [
  "Formal e profissional", "Descontraído e próximo",
  "Técnico e especializado", "Inspirador e motivacional",
  "Jovem e dinâmico", "Luxuoso e exclusivo", "Didático e educativo",
];

const WEBSITE_CMS_OPTIONS = [
  "Sem CMS", "Notion como CMS", "Sanity", "Contentful", "Strapi", "WordPress",
];

const WEBSITE_INTEGRATIONS = [
  "Google Analytics", "Google Tag Manager", "Meta Pixel", "Hotjar",
  "WhatsApp Business", "Stripe", "MercadoPago", "Mailchimp",
  "RD Station", "HubSpot", "Calendly", "Typeform",
  "Instagram Feed", "Google Maps", "YouTube embed",
];

const NICHES = [
  "Saúde", "Educação", "Finanças", "Varejo", "Barbearia", "Academia",
  "Clínica", "Jurídico", "Imobiliário", "Restaurante", "Pet Shop",
  "Logística", "RH", "Agência", "Tecnologia", "Outro",
];

const PLATFORMS = ["Web", "iOS", "Android", "Web + Mobile", "Desktop", "API / Backend"];

const MONETIZATIONS = [
  { value: "subscription", label: "Assinatura",      desc: "Planos mensais/anuais" },
  { value: "freemium",     label: "Freemium",        desc: "Grátis com premium" },
  { value: "one-time",     label: "Licença única",   desc: "Pagamento único" },
  { value: "marketplace",  label: "Comissão",        desc: "% sobre transações" },
  { value: "ads",          label: "Publicidade",     desc: "Anúncios e banners" },
  { value: "none",         label: "Sem monetização", desc: "Uso interno / gratuito" },
];

const INTEGRATIONS_LIST = [
  "Stripe", "MercadoPago", "PagSeguro", "WhatsApp", "SendGrid",
  "Firebase", "Google Analytics", "Zapier", "OpenAI", "Twilio",
];

const LOADING_MESSAGES = [
  "Analisando sua ideia...",
  "Identificando módulos e funcionalidades...",
  "Estruturando a arquitetura do sistema...",
  "Salvando projeto no banco de dados...",
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

// ─── Step 0 — StepModo ────────────────────────────────────────────────────────

const StepModo = () => {
  const { setMode, nextStep } = useProjectWizard();

  const handleSelect = (m: "system" | "website") => {
    setMode(m);
    nextStep();
  };

  const cards = [
    {
      mode: "system" as const,
      icon: Cpu,
      title: "Sistema ou App",
      description: "Plataforma completa com banco de dados, autenticação e lógica de negócio",
      chips: ["SaaS", "ERP", "App Mobile", "Marketplace", "Dashboard"],
      gradient: "from-primary/10 to-primary/5",
      borderActive: "border-primary/60",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      mode: "website" as const,
      icon: Globe,
      title: "Site ou Página Web",
      description: "Site moderno com design, conteúdo, SEO e conversão",
      chips: ["Landing Page", "Portfólio", "Institucional", "Blog", "Loja"],
      gradient: "from-accent/10 to-accent/5",
      borderActive: "border-accent/60",
      iconBg: "bg-accent/15 text-accent",
    },
  ];

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">O que você quer criar?</h2>
        <p className="text-muted-foreground text-xs">Escolha o tipo de projeto para adaptar o fluxo.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              onClick={() => handleSelect(card.mode)}
              className={cn(
                "group relative flex flex-col items-start text-left p-6 rounded-xl border-2 transition-all duration-200",
                "border-border hover:border-primary/40 hover:shadow-card-hover bg-gradient-to-br",
                card.gradient
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all", card.iconBg)}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-2 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-2xs text-muted-foreground leading-relaxed mb-4">
                {card.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {card.chips.map(chip => (
                  <span key={chip} className="px-2 py-0.5 rounded-full text-2xs bg-background/60 border border-border text-muted-foreground">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">→</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Step 1 — Ideia ───────────────────────────────────────────────────────────

const StepIdeia = () => {
  const { idea, setIdea, nextStep, prevStep, mode } = useProjectWizard();
  const [isRefining, setIsRefining] = useState(false);
  const isValid = idea.trim().length >= IDEA_MIN_CHARS;

  const placeholder = mode === "website"
    ? "Ex: Um site institucional para uma clínica odontológica em São Paulo, com apresentação dos serviços, galeria de antes/depois, formulário de agendamento online e depoimentos de pacientes..."
    : "Ex: Um sistema de agendamento para barbearias com múltiplos profissionais, controle de estoque, caixa integrado e app para clientes acompanharem fila em tempo real...";

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
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">
          {mode === "website" ? "Descreva o site" : "Descreva sua ideia"}
        </h2>
        <p className="text-muted-foreground text-xs">Escreva livremente — sem formato obrigatório.</p>
      </div>
      <div className="relative">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={placeholder}
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
          onClick={prevStep}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-2">
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
    </div>
  );
};

// ─── Step 2a — Classificação (sistema) ───────────────────────────────────────

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
    if (!isValid) { setAttempted(true); return; }
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

// ─── Step 3a — Detalhamento (sistema) ────────────────────────────────────────

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
    if (!isAudienceValid) { setAttempted(true); return; }
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
                <button onClick={() => removeFeature(f)} className="hover:text-destructive transition-colors">
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

// ─── Step 2b — Site (website) ─────────────────────────────────────────────────

const StepSite = () => {
  const {
    type, setType,
    niche, setNiche,
    websiteSections, toggleWebsiteSection,
    websiteStyle, setWebsiteStyle,
    websiteTone, setWebsiteTone,
    websiteHasEcommerce, setWebsiteHasEcommerce,
    websiteHasBlog, setWebsiteHasBlog,
    websiteHasForm, setWebsiteHasForm,
    websiteCMS, setWebsiteCMS,
    integrations, toggleIntegration,
    nextStep, prevStep,
  } = useProjectWizard();

  const [attempted, setAttempted] = useState(false);
  const isValid = !!type && !!websiteStyle && !!niche;

  const handleNext = () => {
    if (!isValid) { setAttempted(true); return; }
    nextStep();
  };

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-7">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Configure o site</h2>
        <p className="text-muted-foreground text-xs">Detalhes para personalizar o site ao seu nicho e estilo.</p>
      </div>

      {/* Tipo de site */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Que tipo de site você quer criar?</label>
          {attempted && !type && <span className="text-2xs text-warning">Selecione um tipo</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {WEBSITE_TYPES.map((wt) => (
            <button
              key={wt.value}
              onClick={() => setType(wt.value)}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                type === wt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : attempted && !type
                    ? "border-warning/40 bg-warning/5 hover:border-warning/60 text-foreground"
                    : "border-border bg-surface/30 hover:border-primary/30 text-foreground"
              )}
            >
              <span className="text-base mb-1">{wt.emoji}</span>
              <span className="text-xs font-semibold">{wt.label}</span>
              <span className="text-2xs text-muted-foreground">{wt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nicho */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Setor / Nicho de mercado</label>
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
                  : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Seções */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Quais seções o site deve ter? (múltipla seleção)</label>
        <div className="flex flex-wrap gap-2">
          {WEBSITE_SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => toggleWebsiteSection(section)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                websiteSections.includes(section)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {websiteSections.includes(section) && <Check className="w-3 h-3 inline mr-1" />}
              {section}
            </button>
          ))}
        </div>
      </div>

      {/* Estilo visual */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Estilo visual</label>
          {attempted && !websiteStyle && <span className="text-2xs text-warning">Selecione um estilo</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WEBSITE_STYLES.map((ws) => (
            <button
              key={ws.value}
              onClick={() => setWebsiteStyle(ws.value)}
              className={cn(
                "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                websiteStyle === ws.value
                  ? "border-primary bg-primary/10 text-primary"
                  : attempted && !websiteStyle
                    ? "border-warning/40 bg-warning/5 hover:border-warning/60 text-foreground"
                    : "border-border bg-surface/30 hover:border-primary/30 text-foreground"
              )}
            >
              <span className="text-base mb-1">{ws.emoji}</span>
              <span className="text-xs font-semibold">{ws.label}</span>
              <span className="text-2xs text-muted-foreground">{ws.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tom de comunicação */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Tom de comunicação</label>
        <div className="flex flex-wrap gap-2">
          {WEBSITE_TONES.map((tone) => (
            <button
              key={tone}
              onClick={() => setWebsiteTone(tone)}
              className={cn(
                "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                websiteTone === tone
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Recursos extras */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Recursos adicionais</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs font-medium text-foreground">Loja / E-commerce</p>
              <p className="text-2xs text-muted-foreground">Catálogo, carrinho e checkout</p>
            </div>
            <Switch checked={websiteHasEcommerce} onCheckedChange={setWebsiteHasEcommerce} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs font-medium text-foreground">Blog / Conteúdo</p>
              <p className="text-2xs text-muted-foreground">Artigos e publicações dinâmicas</p>
            </div>
            <Switch checked={websiteHasBlog} onCheckedChange={setWebsiteHasBlog} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs font-medium text-foreground">Formulário de captação</p>
              <p className="text-2xs text-muted-foreground">Leads, contato ou agendamento</p>
            </div>
            <Switch checked={websiteHasForm} onCheckedChange={setWebsiteHasForm} />
          </div>
        </div>
      </div>

      {/* CMS (only if blog enabled) */}
      {websiteHasBlog && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Sistema de gerenciamento de conteúdo</label>
          <div className="flex flex-wrap gap-2">
            {WEBSITE_CMS_OPTIONS.map((cms) => (
              <button
                key={cms}
                onClick={() => setWebsiteCMS(cms)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-2xs font-medium border transition-all",
                  websiteCMS === cms
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cms}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Integrações */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Integrações desejadas</label>
        <div className="flex flex-wrap gap-2">
          {WEBSITE_INTEGRATIONS.map((integ) => (
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
            !isValid && "opacity-60"
          )}
        >
          Próximo →
        </button>
      </div>
    </div>
  );
};

// ─── Step 4 — Confirmação (sistema) ──────────────────────────────────────────

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

  // BUG 7 FIX: avoid redundant title like "Agência — Agência / Freela"
  // Only prepend niche if it's meaningfully different from the type label
  const typeLabel930 = PROJECT_TYPES.find((t) => t.value === type)?.label ?? "Projeto";
  const nicheNorm = (niche ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const typeNorm = typeLabel930.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nichePrefix = niche && !nicheNorm.startsWith(typeNorm) && !typeNorm.startsWith(nicheNorm)
    ? `${niche} — `
    : "";
  const derivedTitle = title || `${nichePrefix}${typeLabel930}`;

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
        mode: "system",
      },
      { onSuccess: () => reset() }
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

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Nome do projeto</label>
        <input
          value={title || derivedTitle}
          onChange={e => setTitle(e.target.value)}
          placeholder={derivedTitle}
          className="w-full px-4 py-2.5 rounded-lg text-xs bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

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
            <><Sparkles className="w-3.5 h-3.5" /> Gerar Projeto</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Step 3b — Confirmação Site ───────────────────────────────────────────────

const StepConfirmacaoSite = () => {
  const {
    idea, type, niche,
    websiteSections, websiteStyle, websiteTone, websiteCMS,
    websiteHasEcommerce, websiteHasBlog, websiteHasForm,
    integrations, title, setTitle, prevStep, reset,
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

  const typeLabel = WEBSITE_TYPES.find(t => t.value === type)?.label ?? type;
  const styleLabel = WEBSITE_STYLES.find(s => s.value === websiteStyle)?.label ?? websiteStyle;
  // BUG 7 FIX: avoid redundant title when niche matches type (e.g. "Agência — Agência / Freela")
  const nicheNormW = (niche ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const typeNormW = (typeLabel || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const nichePrefixW = niche && !nicheNormW.startsWith(typeNormW) && !typeNormW.startsWith(nicheNormW)
    ? `${niche} — `
    : "";
  const derivedTitle = title || `${nichePrefixW}${typeLabel || "Site"}`;

  const handleCreate = () => {
    createProject(
      {
        title: derivedTitle,
        original_idea: idea,
        type,
        niche,
        complexity: 2,
        platform: "Web",
        audience: "",
        features: websiteSections,
        monetization: "",
        integrations,
        status: "draft",
        mode: "website",
        website_sections: websiteSections,
        website_style: websiteStyle,
        website_tone: websiteTone,
        website_cms: websiteCMS,
        website_has_ecommerce: websiteHasEcommerce,
        website_has_blog: websiteHasBlog,
        website_has_form: websiteHasForm,
      },
      { onSuccess: () => reset() }
    );
  };

  const Section = ({ label, value }: { label: string; value: string | string[] | boolean }) => (
    <div className="flex gap-3">
      <span className="text-2xs text-muted-foreground w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground flex-1">
        {typeof value === "boolean"
          ? (value ? "Sim" : "Não")
          : Array.isArray(value)
            ? (value.length > 0 ? value.join(", ") : "—")
            : String(value || "—")}
      </span>
    </div>
  );

  return (
    <div className="p-8 rounded-xl border border-border bg-card space-y-6">
      <div>
        <h2 className="font-display font-semibold text-sm text-foreground mb-1">Confirme os dados do site</h2>
        <p className="text-muted-foreground text-xs">Revise antes de criar o projeto.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Nome do projeto</label>
        <input
          value={title || derivedTitle}
          onChange={e => setTitle(e.target.value)}
          placeholder={derivedTitle}
          className="w-full px-4 py-2.5 rounded-lg text-xs bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
        <Section label="Tipo de site" value={typeLabel} />
        <Section label="Nicho" value={niche} />
        <Section label="Estilo visual" value={styleLabel} />
        {websiteTone && <Section label="Tom" value={websiteTone} />}
        {websiteSections.length > 0 && <Section label="Seções" value={websiteSections} />}
        <Section label="E-commerce" value={websiteHasEcommerce} />
        <Section label="Blog/CMS" value={websiteHasBlog ? (websiteCMS || "Sim") : false} />
        <Section label="Formulário" value={websiteHasForm} />
        {integrations.length > 0 && <Section label="Integrações" value={integrations} />}
      </div>

      {idea && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descrição do site</label>
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
            <><Globe className="w-3.5 h-3.5" /> Criar Site</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const NewProjectPage = () => {
  const { currentStep, idea, type, niche, audience, mode } = useProjectWizard();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!idea && !type) return;
    const timer = setTimeout(() => setLastSaved(new Date()), 800);
    return () => clearTimeout(timer);
  }, [idea, type, niche, audience]);

  // Dynamic step arrays
  const STEPS_SYSTEM = ["Tipo", "Ideia", "Classificação", "Detalhamento", "Confirmação"];
  const STEPS_WEBSITE = ["Tipo", "Ideia", "Site", "Confirmação"];
  const STEPS = mode === "website" ? STEPS_WEBSITE : STEPS_SYSTEM;

  // Step component mapping
  // System:  0=Modo  1=Ideia  2=Classificacao  3=Detalhamento  4=Confirmacao
  // Website: 0=Modo  1=Ideia  2=StepSite       3=ConfirmacaoSite
  const getStepComponent = () => {
    if (currentStep === 0) return <StepModo key="0" />;
    if (currentStep === 1) return <StepIdeia key="1" />;
    if (currentStep === 2) {
      return mode === "website" ? <StepSite key="2w" /> : <StepClassificacao key="2s" />;
    }
    if (currentStep === 3) {
      return mode === "website" ? <StepConfirmacaoSite key="3w" /> : <StepDetalhamento key="3s" />;
    }
    if (currentStep === 4) return <StepConfirmacao key="4" />;
    return null;
  };

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
          {mode === "website"
            ? "Descreva o site e a IA vai estruturar páginas, copy, SEO e prompts prontos."
            : "Descreva sua ideia e a IA irá estruturar o projeto completo para você."}
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className={cn("flex items-center gap-1.5 flex-1", i < currentStep ? "opacity-60" : "")}>
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
          {getStepComponent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NewProjectPage;
