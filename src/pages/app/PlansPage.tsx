import { CheckCircle, Star, Zap, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { motion } from "framer-motion";

// Feature comparison data
const ALL_FEATURES = [
  { label: "Projetos ativos",        free: "3",         pro: "Ilimitados",  expert: "Ilimitados"  },
  { label: "Prompts gerados/mês",    free: "10",        pro: "Ilimitados",  expert: "Ilimitados"  },
  { label: "Score de qualidade",     free: "✓",         pro: "✓",           expert: "✓"           },
  { label: "Templates básicos",      free: "✓",         pro: "✓",           expert: "✓"           },
  { label: "Todos os templates",     free: "—",         pro: "✓",           expert: "✓"           },
  { label: "Revisão automática IA",  free: "—",         pro: "✓",           expert: "✓"           },
  { label: "Exportação completa",    free: "—",         pro: "✓",           expert: "✓"           },
  { label: "Múltiplos membros",      free: "—",         pro: "—",           expert: "5 membros"   },
  { label: "White-label",            free: "—",         pro: "—",           expert: "✓"           },
  { label: "Suporte SLA",            free: "—",         pro: "—",           expert: "✓"           },
];

const PLANS = [
  { id: "free",   name: "Free",   price: "R$ 0",    period: "",     desc: "Para começar" },
  { id: "pro",    name: "Pro",    price: "R$ 47",   period: "/mês", desc: "Para profissionais", popular: true },
  { id: "expert", name: "Expert", price: "R$ 147",  period: "/mês", desc: "Para agências" },
];

const PlansPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile-plan", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Planos"
        subtitle="Escolha o plano ideal para seu ritmo de criação"
      />

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const isCurrent = currentPlan === plan.id;
          const isUpgrade = PLANS.findIndex(p => p.id === currentPlan) < PLANS.findIndex(p => p.id === plan.id);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative p-6 rounded-xl border flex flex-col",
                plan.popular && !isCurrent ? "border-primary/50 shadow-glow bg-card ring-1 ring-primary/10" : "border-border bg-card"
              )}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-2xs font-bold bg-primary text-primary-foreground shadow-glow">
                    <Star className="w-2.5 h-2.5 fill-current" /> Mais popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-2xs font-bold bg-success text-white">
                    <CheckCircle className="w-2.5 h-2.5" /> Plano atual
                  </span>
                </div>
              )}

              <div className="mt-2 mb-4">
                <h3 className="font-display font-bold text-sm mb-0.5">{plan.name}</h3>
                <p className="text-2xs text-muted-foreground">{plan.desc}</p>
              </div>

              <div className="mb-5">
                <span className="font-bold text-2xl text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>

              {/* Features for this plan */}
              <ul className="space-y-2 mb-6 flex-1">
                {ALL_FEATURES.filter(f => {
                  const val = plan.id === "free" ? f.free : plan.id === "pro" ? f.pro : f.expert;
                  return val !== "—";
                }).slice(0, 5).map(f => {
                  const val = plan.id === "free" ? f.free : plan.id === "pro" ? f.pro : f.expert;
                  return (
                    <li key={f.label} className="flex items-start gap-2 text-2xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                      <span>{f.label}{val !== "✓" ? `: ${val}` : ""}</span>
                    </li>
                  );
                })}
              </ul>

              <button
                disabled={isCurrent}
                onClick={() => {
                  if (isCurrent) return;
                  if (plan.id === "free") navigate("/app/configuracoes");
                  else window.open("mailto:contato@arquitetoai.com?subject=Upgrade para " + plan.name, "_blank");
                }}
                className={cn(
                  "w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2",
                  isCurrent
                    ? "border border-success/30 text-success cursor-default"
                    : plan.popular
                    ? "bg-gradient-primary text-primary-foreground hover:shadow-glow"
                    : plan.id === "expert"
                    ? "border border-border hover:border-primary/40 hover:bg-surface text-foreground"
                    : "border border-border hover:border-primary/40 hover:bg-surface text-foreground"
                )}
              >
                {isCurrent ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Plano atual</>
                ) : isUpgrade ? (
                  <><ArrowRight className="w-3.5 h-3.5" /> Entrar em contato</>
                ) : (
                  <>Mudar para {plan.name}</>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="font-display font-semibold text-xs text-foreground">Comparação completa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-2xs font-medium text-muted-foreground w-1/2">Recurso</th>
                {PLANS.map(p => (
                  <th key={p.id} className={cn(
                    "text-center px-4 py-3 text-2xs font-bold",
                    currentPlan === p.id ? "text-success" : p.popular ? "text-primary" : "text-foreground"
                  )}>
                    {p.name}
                    {currentPlan === p.id && <span className="block text-2xs font-normal text-success/70">atual</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((feature, i) => (
                <tr key={feature.label} className={cn("border-b border-border/50 last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                  <td className="px-5 py-3 text-2xs text-muted-foreground">{feature.label}</td>
                  {[feature.free, feature.pro, feature.expert].map((val, vi) => (
                    <td key={vi} className="text-center px-4 py-3 text-2xs">
                      {val === "✓" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-success mx-auto" />
                      ) : val === "—" ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <span className="font-medium text-foreground">{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <div className="p-4 rounded-xl border border-border bg-card/50 flex items-center gap-3">
        <Zap className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-2xs text-muted-foreground">
          Para fazer upgrade ou downgrade do seu plano, entre em contato pelo email <span className="text-primary font-medium">contato@arquitetoai.com</span>.
        </p>
      </div>
    </div>
  );
};

export default PlansPage;
