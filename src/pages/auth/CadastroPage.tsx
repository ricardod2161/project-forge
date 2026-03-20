import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const CadastroPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      if (error.toLowerCase().includes("already registered")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setError(error);
      }
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      // Auto-redirect após cadastro (email confirmado automaticamente)
      setTimeout(() => navigate("/app"), 1500);
    }
  };

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
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">
              Arquiteto <span className="text-gradient">IA</span>
            </span>
          </div>

          <h2 className="font-display font-bold text-lg mb-1">Criar conta grátis</h2>
          <p className="text-muted-foreground text-xs mb-8">Sem cartão de crédito necessário</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs mb-4">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Conta criada com sucesso! Redirecionando...
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    "disabled:opacity-50"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    "disabled:opacity-50"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    "disabled:opacity-50"
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow transition-all duration-200 active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>Criar conta <ArrowRight className="w-3.5 h-3.5" /></>
              )}
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
