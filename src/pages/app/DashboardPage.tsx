import { motion } from "framer-motion";
import { FolderOpen, Plus, Zap, BarChart3, TrendingUp, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const metrics = [
  { label: "Total de Projetos", value: "0", icon: FolderOpen, delta: null },
  { label: "Projetos Ativos", value: "0", icon: TrendingUp, delta: null },
  { label: "Prompts Gerados", value: "0", icon: Zap, delta: null },
  { label: "Score Médio", value: "—", icon: BarChart3, delta: null },
];

const DashboardPage = () => {
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display font-bold text-xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-xs mt-1">Bem-vindo ao Arquiteto IA</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-200"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <m.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="font-display font-bold text-2xl text-foreground">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Estado vazio */}
      <motion.div
        className={cn(
          "flex flex-col items-center justify-center py-20 rounded-xl",
          "border border-dashed border-border bg-surface/30"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-2">
          Seu primeiro projeto espera por você
        </h3>
        <p className="text-muted-foreground text-xs text-center max-w-xs mb-6 leading-relaxed">
          Descreva sua ideia e a IA cria a arquitetura completa: módulos, telas, banco de dados e prompts prontos.
        </p>
        <Link
          to="/app/projetos/novo"
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold",
            "bg-gradient-primary text-primary-foreground",
            "hover:shadow-glow transition-all duration-200"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Criar meu primeiro projeto
        </Link>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
