import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Mail, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const CadastroPage = () => {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-surface overflow-hidden p-12">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial-primary" />
        <div className="relative text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center shadow-glow-lg mb-6">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-3">
            Arquiteto <span className="text-gradient">IA</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            Crie sua conta e comece a transformar ideias em sistemas completos.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="font-display font-bold text-lg mb-1">Criar conta grátis</h2>
          <p className="text-muted-foreground text-xs mb-8">Sem cartão de crédito necessário</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  )}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  )}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow transition-all duration-200 active:scale-[0.98]"
              )}
            >
              Criar conta <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-center text-2xs text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CadastroPage;
