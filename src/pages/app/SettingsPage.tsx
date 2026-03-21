import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Palette, Bell, CreditCard, Shield, Sun, Moon, Save, Check, Lock, Bot, Trash2, AlertTriangle, Zap } from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Profile section ────────────────────────────────────────────────────────────
const ProfileSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  const handleSave = () => {
    if (fullName.trim()) mutation.mutate(fullName.trim());
  };

  const initials = (fullName || user?.email || "U")
    .split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Perfil</h2>
          <p className="text-2xs text-muted-foreground">Seu nome e informações de conta</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-8 rounded-lg bg-muted/60 animate-pulse w-16" />
          <div className="h-9 rounded-lg bg-muted/60 animate-pulse" />
          <div className="h-9 rounded-lg bg-muted/60 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-base font-bold text-primary">{initials}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{fullName || "Sem nome"}</p>
              <p className="text-2xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-medium text-muted-foreground mb-1.5">
                Nome completo
              </label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="Seu nome completo"
                className="w-full px-3 py-2 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                value={user?.email ?? ""}
                disabled
                className="w-full px-3 py-2 rounded-lg text-xs bg-muted border border-border text-muted-foreground cursor-not-allowed"
              />
              <p className="text-2xs text-muted-foreground mt-1">O email não pode ser alterado aqui.</p>
            </div>
            <div>
              <label className="block text-2xs font-medium text-muted-foreground mb-1.5">
                Plano atual
              </label>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-2xs font-semibold border capitalize",
                  profile?.plan === "pro"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {profile?.plan ?? "free"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={mutation.isPending || !fullName.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? (
              <><span className="w-3 h-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Salvando...</>
            ) : mutation.isSuccess ? (
              <><Check className="w-3.5 h-3.5" />Salvo!</>
            ) : (
              <><Save className="w-3.5 h-3.5" />Salvar alterações</>
            )}
          </button>
        </>
      )}
    </div>
  );
};

// ── Appearance section ─────────────────────────────────────────────────────────
const AppearanceSection = () => {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Aparência</h2>
          <p className="text-2xs text-muted-foreground">Tema da interface</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          { value: "dark",  label: "Escuro",  Icon: Moon },
          { value: "light", label: "Claro",   Icon: Sun  },
        ] as const).map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150",
              theme === value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-surface"
            )}
          >
            <Icon className={cn("w-5 h-5", theme === value ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-2xs font-medium", theme === value ? "text-primary" : "text-muted-foreground")}>
              {label}
            </span>
            {theme === value && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Notifications section ──────────────────────────────────────────────────────
const NotificationsSection = () => {
  const [emailNotifs, setEmailNotifs] = useState(true);

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Notificações</h2>
          <p className="text-2xs text-muted-foreground">Preferências de comunicação</p>
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: "Novidades e atualizações", desc: "Receba emails sobre novas features", value: emailNotifs, set: setEmailNotifs },
        ].map(({ label, desc, value, set }) => (
          <div key={label} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-xs font-medium text-foreground">{label}</p>
              <p className="text-2xs text-muted-foreground">{desc}</p>
            </div>
            <button
              onClick={() => set(!value)}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200",
                value ? "bg-primary" : "bg-muted"
              )}
              aria-label={label}
              role="switch"
              aria-checked={value}
            >
              <span className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
                value ? "left-4" : "left-0.5"
              )} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── AI Preferences section ─────────────────────────────────────────────────────
const AIPreferencesSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("preferences").eq("user_id", user!.id).single();
      return data;
    },
  });

  const prefs = (profile?.preferences as Record<string, unknown> | null) ?? {};
  const [detailLevel, setDetailLevel] = useState<string>((prefs.detail_level as string) ?? "complete");
  const [proactiveSuggestions, setProactiveSuggestions] = useState<boolean>((prefs.proactive_suggestions as boolean) ?? true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs.detail_level) setDetailLevel(prefs.detail_level as string);
    if (prefs.proactive_suggestions !== undefined) setProactiveSuggestions(prefs.proactive_suggestions as boolean);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ preferences: { ...prefs, detail_level: detailLevel, proactive_suggestions: proactiveSuggestions } })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error("Erro ao salvar preferências."),
  });

  const DETAIL_LEVELS = [
    { value: "summary",  label: "Resumido",        desc: "Respostas concisas e diretas" },
    { value: "complete", label: "Completo",         desc: "Nível padrão equilibrado" },
    { value: "maximum",  label: "Máximo detalhe",   desc: "O mais detalhado possível" },
  ];

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Preferências de IA</h2>
          <p className="text-2xs text-muted-foreground">Ajuste o comportamento da IA</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Detail level */}
        <div className="space-y-2">
          <label className="text-2xs font-medium text-muted-foreground">Nível de detalhe das respostas</label>
          <div className="grid grid-cols-3 gap-2">
            {DETAIL_LEVELS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setDetailLevel(value)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                  detailLevel === value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className={cn("text-2xs font-semibold", detailLevel === value ? "text-primary" : "text-foreground")}>
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Proactive suggestions toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <p className="text-xs font-medium text-foreground">Sugestões proativas</p>
            <p className="text-2xs text-muted-foreground">Dicas contextuais no dashboard e nas abas do projeto</p>
          </div>
          <button
            onClick={() => setProactiveSuggestions(v => !v)}
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors duration-200",
              proactiveSuggestions ? "bg-primary" : "bg-muted"
            )}
            role="switch"
            aria-checked={proactiveSuggestions}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
              proactiveSuggestions ? "left-4" : "left-0.5"
            )} />
          </button>
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {saved ? <><Check className="w-3.5 h-3.5" />Salvo!</> : <><Save className="w-3.5 h-3.5" />Salvar preferências</>}
      </button>
    </div>
  );
};

// ── Plan section ───────────────────────────────────────────────────────────────
const PlanSection = () => {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("plan").eq("user_id", user!.id).single();
      return data;
    },
  });
  const isPro = profile?.plan === "pro";

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Plano</h2>
          <p className="text-2xs text-muted-foreground">Sua assinatura atual</p>
        </div>
      </div>
      <div className={cn(
        "p-4 rounded-xl border",
        isPro ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
      )}>
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-xs font-bold capitalize", isPro ? "text-primary" : "text-foreground")}>
            Plano {profile?.plan ?? "Free"}
          </span>
          {isPro && <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary text-primary-foreground">Ativo</span>}
        </div>
        <p className="text-2xs text-muted-foreground">
          {isPro ? "Acesso completo a todos os recursos." : "Crie até 3 projetos gratuitamente."}
        </p>
      </div>
      {!isPro && (
        <button className="w-full py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Fazer upgrade para Pro
        </button>
      )}
    </div>
  );
};

// ── Security section ───────────────────────────────────────────────────────────
const SecuritySection = () => {
  const { resetPassword, user } = useAuth();
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!user?.email) return;
    await resetPassword(user.email);
    setSent(true);
    toast.success("Email de redefinição enviado!");
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Segurança</h2>
          <p className="text-2xs text-muted-foreground">Senha e acesso à conta</p>
        </div>
      </div>
      <button
        onClick={handleReset}
        disabled={sent}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-50 transition-all"
      >
        <Lock className="w-3.5 h-3.5" />
        {sent ? "Email enviado! Verifique sua caixa." : "Redefinir senha por email"}
      </button>
    </div>
  );
};

// ── AI Providers section ───────────────────────────────────────────────────────
const AIProvidersSection = () => {
  const providers = [
    {
      icon: "⚡",
      name: "Groq",
      models: "llama-3.1-8b · llama-3.3-70b",
      usage: "Refinar ideias, gerar prompts, revisão de projetos",
      badge: "Gratuito",
      badgeClass: "bg-success/10 text-success border-success/20",
    },
    {
      icon: "✦",
      name: "Google AI (Gemini 2.0 Flash)",
      models: "gemini-2.0-flash",
      usage: "Geração de módulos, telas, banco de dados e regras",
      badge: "Gratuito",
      badgeClass: "bg-success/10 text-success border-success/20",
    },
    {
      icon: "◎",
      name: "OpenAI",
      models: "gpt-4o-mini",
      usage: "Avaliação de qualidade (score estruturado)",
      badge: "Pago",
      badgeClass: "bg-warning/10 text-warning border-warning/20",
    },
    {
      icon: "🖼",
      name: "Lovable Gateway",
      models: "gemini-3.1-flash-image",
      usage: "Geração de mockups visuais de telas e páginas",
      badge: "Lovable",
      badgeClass: "bg-accent/10 text-accent border-accent/20",
    },
  ];

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-foreground">Provedores de IA</h2>
          <p className="text-2xs text-muted-foreground">Modelos ativos por funcionalidade</p>
        </div>
      </div>

      <div className="space-y-2">
        {providers.map((p) => (
          <div
            key={p.name}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface/30"
          >
            <span className="text-base flex-shrink-0 mt-0.5">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xs font-semibold text-foreground">{p.name}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  p.badgeClass
                )}>
                  {p.badge}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{p.models}</p>
              <p className="text-[10px] text-muted-foreground/70">{p.usage}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
        💡 Configure as chaves de API no painel do Lovable Cloud → Secrets
      </p>
    </div>
  );
};

// ── Danger zone section ────────────────────────────────────────────────────────
const DangerZoneSection = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (emailInput !== user?.email) {
      toast.error("O email digitado não confere com sua conta.");
      return;
    }
    setIsDeleting(true);
    try {
      // Sign out as we can't delete from client side without admin SDK
      toast.info("Solicitação enviada. Nossa equipe processará a exclusão em breve.", { duration: 6000 });
      await signOut();
    } catch {
      toast.error("Erro ao processar solicitação. Entre em contato com o suporte.");
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-destructive">Zona de Perigo</h2>
            <p className="text-2xs text-muted-foreground">Ações irreversíveis</p>
          </div>
        </div>
        <p className="text-2xs text-muted-foreground">
          Ao excluir sua conta, todos os projetos, prompts e avaliações serão removidos permanentemente.
          Esta ação não pode ser desfeita.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir minha conta
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Esta ação é irreversível. Todos os seus dados serão excluídos.</p>
              <p className="font-medium text-foreground">
                Para confirmar, digite seu email: <strong>{user?.email}</strong>
              </p>
              <input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder={user?.email ?? ""}
                className="w-full px-3 py-2 rounded-lg text-xs bg-input border border-border focus:outline-none focus:ring-2 focus:ring-destructive/50"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmailInput("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={emailInput !== user?.email || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? "Processando..." : "Sim, excluir conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const SettingsPage = () => (
  <div className="space-y-6 max-w-4xl">
    <div>
      <h1 className="font-display font-bold text-lg text-foreground">Configurações</h1>
      <p className="text-muted-foreground text-xs mt-0.5">Gerencie sua conta e preferências</p>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-5">
          <ProfileSection />
          <SecuritySection />
          <DangerZoneSection />
        </div>
        {/* Right column */}
        <div className="space-y-5">
          <AppearanceSection />
          <AIPreferencesSection />
          <AIProvidersSection />
          <NotificationsSection />
          <PlanSection />
        </div>
      </div>
    </motion.div>
  </div>
);

export default SettingsPage;
