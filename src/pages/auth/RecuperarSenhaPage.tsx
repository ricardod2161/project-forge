import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const RecuperarSenhaPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">Arquiteto <span className="text-gradient">IA</span></span>
        </div>

        <h2 className="font-display font-bold text-lg mb-1">Recuperar senha</h2>
        <p className="text-muted-foreground text-xs mb-8">
          Digite seu e-mail e enviaremos as instruções.
        </p>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
          <button
            type="submit"
            className={cn(
              "w-full py-2.5 rounded-lg text-xs font-semibold",
              "bg-gradient-primary text-primary-foreground",
              "hover:shadow-glow transition-all duration-200"
            )}
          >
            Enviar instruções
          </button>
        </form>

        <Link to="/login" className="flex items-center gap-1.5 mt-6 text-2xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
        </Link>
      </div>
    </div>
  );
};

export default RecuperarSenhaPage;
