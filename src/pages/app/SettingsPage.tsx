import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Palette, Bell, CreditCard, Shield, Sun, Moon, Save, Check, Lock } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const { theme, setTheme } = useTheme();

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

// ── Main ──────────────────────────────────────────────────────────────────────
const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Configurações</h1>
      <p className="text-muted-foreground text-xs mt-1">Gerencie sua conta e preferências</p>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <ProfileSection />
      <AppearanceSection />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NotificationsSection />
        <PlanSection />
      </div>
      <SecuritySection />
    </motion.div>
  </div>
);

export default SettingsPage;
