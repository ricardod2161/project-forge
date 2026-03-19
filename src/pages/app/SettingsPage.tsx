import { Settings, User, Palette, Bell, CreditCard, Shield, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { icon: User, label: "Perfil", desc: "Avatar, nome, email, bio" },
  { icon: Palette, label: "Aparência", desc: "Tema, densidade" },
  { icon: Bell, label: "Notificações", desc: "Email, in-app, sugestões" },
  { icon: CreditCard, label: "Plano", desc: "Uso, limites, upgrade" },
  { icon: Shield, label: "Segurança", desc: "Senha, sessões, 2FA" },
  { icon: Database, label: "Dados", desc: "Exportar, excluir conta" },
];

const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="font-display font-bold text-xl text-foreground">Configurações</h1>
      <p className="text-muted-foreground text-xs mt-1">Gerencie sua conta e preferências</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sections.map((s) => (
        <button key={s.label} className={cn(
          "p-5 rounded-xl border border-border bg-card text-left",
          "hover:border-primary/30 hover:bg-surface transition-all duration-150"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-xs text-foreground">{s.label}</span>
          </div>
          <p className="text-2xs text-muted-foreground">{s.desc}</p>
        </button>
      ))}
    </div>
  </div>
);

export default SettingsPage;
