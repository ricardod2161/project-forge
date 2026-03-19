import { motion } from "framer-motion";
import { Sparkles, User, Code2, Building2, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const steps = ["Perfil", "Tipo de uso", "Primeiro projeto"];

const usageTypes = [
  { icon: Code2, label: "Desenvolvedor", desc: "Construo sistemas e aplicações" },
  { icon: Building2, label: "Produto", desc: "Gerencio produtos e roadmaps" },
  { icon: Sparkles, label: "Empreendedor", desc: "Tenho ideias para monetizar" },
  { icon: Users, label: "Agência", desc: "Atendo múltiplos clientes" },
];

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">
            Arquiteto <span className="text-gradient">IA</span>
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border-2 transition-all duration-300",
                i === step ? "border-primary bg-primary text-primary-foreground" :
                i < step ? "border-success bg-success text-success-foreground" :
                "border-border bg-surface text-muted-foreground"
              )}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={cn("w-12 h-px", i < step ? "bg-success" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Etapa 0: Perfil */}
        {step === 0 && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-1">Vamos começar!</h2>
              <p className="text-muted-foreground text-xs">Como podemos te chamar?</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Seu nome"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  )}
                />
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className={cn("w-full py-2.5 rounded-lg text-xs font-semibold bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all")}
            >
              Continuar →
            </button>
          </motion.div>
        )}

        {/* Etapa 1: Tipo de uso */}
        {step === 1 && (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-1">Como você vai usar?</h2>
              <p className="text-muted-foreground text-xs">Isso personaliza sua experiência</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {usageTypes.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setSelectedType(t.label)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all duration-150",
                    selectedType === t.label
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border bg-card hover:border-primary/30 hover:bg-surface"
                  )}
                >
                  <t.icon className={cn("w-5 h-5 mb-2", selectedType === t.label ? "text-primary" : "text-muted-foreground")} />
                  <p className={cn("text-xs font-semibold", selectedType === t.label ? "text-primary" : "text-foreground")}>{t.label}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-lg text-xs border border-border hover:bg-surface transition-all">
                ← Voltar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                className={cn("flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all",
                  selectedType ? "bg-gradient-primary text-primary-foreground hover:shadow-glow" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Continuar →
              </button>
            </div>
          </motion.div>
        )}

        {/* Etapa 2: Primeiro projeto */}
        {step === 2 && (
          <motion.div
            className="space-y-5 text-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center shadow-glow-lg">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg text-foreground">Tudo pronto!</h2>
            <p className="text-muted-foreground text-xs">Crie seu primeiro projeto ou explore os templates</p>
            <div className="flex gap-3">
              <Link
                to="/app/templates"
                className="flex-1 py-2.5 rounded-lg text-xs border border-border hover:bg-surface hover:border-primary/30 transition-all"
              >
                Ver Templates
              </Link>
              <Link
                to="/app/projetos/novo"
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
              >
                Criar Projeto
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
