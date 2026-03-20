import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const RecuperarSenhaPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.");
    } else {
      setSuccess(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">
            Arquiteto <span className="text-gradient">IA</span>
          </span>
        </div>

        <h2 className="font-display font-bold text-lg mb-1">Recuperar senha</h2>
        <p className="text-muted-foreground text-xs mb-8">
          Digite seu e-mail e enviaremos as instruções.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">E-mail enviado!</p>
              <p className="text-success/80">
                Verifique sua caixa de entrada em <strong>{email}</strong> e siga as instruções para redefinir sua senha.
              </p>
            </div>
          </div>
        ) : (
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
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    "disabled:opacity-50"
                  )}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar instruções"
              )}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center gap-1.5 mt-6 text-2xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
        </Link>
      </div>
    </div>
  );
};

export default RecuperarSenhaPage;
