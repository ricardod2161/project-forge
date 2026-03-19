import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const steps = ["Ideia", "Classificação", "Detalhamento", "Confirmação"];

const NewProjectPage = () => {
  const currentStep = 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/app/projetos" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Novo Projeto</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Wizard inteligente de criação</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold border-2 transition-all",
                i === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < currentStep
                  ? "border-success bg-success text-success-foreground"
                  : "border-border bg-surface text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {!cn && <span className="text-2xs text-muted-foreground hidden sm:block">{step}</span>}
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-px w-12 sm:w-20 mx-2",
                  i < currentStep ? "bg-success" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between px-1">
          {steps.map((step, i) => (
            <span key={step} className={cn(
              "text-2xs",
              i === currentStep ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Etapa 1 — Ideia */}
      <div className="p-8 rounded-xl border border-border bg-card space-y-5">
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground mb-1">Descreva sua ideia</h2>
          <p className="text-muted-foreground text-xs">Escreva livremente — sem formato obrigatório.</p>
        </div>
        <textarea
          placeholder="Ex: Um sistema de agendamento para barbearias com múltiplos profissionais, controle de estoque de produtos, caixa integrado e app para clientes acompanharem fila em tempo real..."
          className={cn(
            "w-full h-40 px-4 py-3 rounded-lg text-xs resize-none",
            "bg-input border border-border text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          )}
        />
        <div className="flex items-center justify-between">
          <button className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium",
            "border border-primary/40 text-primary hover:bg-primary/10 transition-all"
          )}>
            <Sparkles className="w-3.5 h-3.5" />
            Refinar com IA
          </button>
          <button className={cn(
            "px-6 py-2 rounded-lg text-xs font-semibold",
            "bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
          )}>
            Próximo →
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;
