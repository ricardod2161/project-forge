import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      if (error.toLowerCase().includes("email not confirmed")) {
        setError("E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.");
      } else if (error.toLowerCase().includes("invalid login credentials") || error.toLowerCase().includes("invalid credentials")) {
        setError("E-mail ou senha inválidos. Verifique e tente novamente.");
      } else {
        setError(error);
      }
    } else {
      navigate("/app");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Coluna esquerda — identidade visual */}
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
            Transforme ideias em sistemas completos com inteligência artificial.
          </p>
        </div>
      </div>

      {/* Coluna direita — formulário */}
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

          <h2 className="font-display font-bold text-lg mb-1">Bem-vindo de volta</h2>
          <p className="text-muted-foreground text-xs mb-8">Entre com sua conta para continuar</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                    "transition-all duration-150 disabled:opacity-50"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-xs",
                    "bg-input border border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                    "transition-all duration-150 disabled:opacity-50"
                  )}
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <Link to="/recuperar-senha" className="text-2xs text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
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
                  Entrando...
                </>
              ) : (
                <>Entrar <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-2xs text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-primary hover:underline font-medium">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
