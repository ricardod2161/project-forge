import { CheckCircle, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    desc: "Para começar",
    features: ["3 projetos ativos", "10 prompts/mês", "Templates básicos", "Score de qualidade"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 47",
    period: "/mês",
    desc: "Para profissionais",
    popular: true,
    features: ["Projetos ilimitados", "Prompts ilimitados", "Todos os templates", "Revisão IA", "Exportação completa"],
  },
  {
    id: "expert",
    name: "Expert",
    price: "R$ 147",
    period: "/mês",
    desc: "Para agências",
    features: ["Tudo do Pro", "5 membros", "White-label", "Onboarding personalizado", "SLA de suporte"],
  },
];

const PlansPage = () => {
  const { user } = useAuth();

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
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-xl text-foreground">Planos</h1>
        <p className="text-muted-foreground text-xs mt-1">Escolha o plano ideal para você</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const isCurrent = currentPlan === p.id;
          return (
            <div key={p.name} className={cn(
              "p-6 rounded-xl border",
              p.popular ? "border-primary/50 shadow-glow bg-card" : "border-border bg-card"
            )}>
              {p.popular && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                  <Star className="w-2.5 h-2.5" /> Mais popular
                </span>
              )}
              {isCurrent && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-semibold bg-success/10 text-success border border-success/20 mb-3">
                  <CheckCircle className="w-2.5 h-2.5" /> Plano atual
                </span>
              )}
              <h3 className="font-display font-bold text-sm mb-0.5">{p.name}</h3>
              <p className="text-2xs text-muted-foreground mb-3">{p.desc}</p>
              <p className="text-2xl font-bold text-foreground mb-5">
                {p.price}<span className="text-xs text-muted-foreground">{p.period}</span>
              </p>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={cn(
                "w-full py-2.5 rounded-lg text-xs font-semibold transition-all",
                p.popular && !isCurrent
                  ? "bg-gradient-primary text-primary-foreground hover:shadow-glow"
                  : isCurrent
                  ? "border border-border text-muted-foreground cursor-default"
                  : "border border-border hover:border-primary/40 hover:bg-surface"
              )}>
                {isCurrent ? "Plano atual" : `Assinar ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl border border-border bg-card/50 flex items-center gap-3">
        <Zap className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-2xs text-muted-foreground">
          Para fazer upgrade ou downgrade do seu plano, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default PlansPage;
