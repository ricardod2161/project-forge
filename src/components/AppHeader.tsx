import { Bell, Search, Moon, Sun, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const AppHeader = () => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("light");
  };

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Trigger de sidebar */}
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

      {/* Barra de busca global */}
      <button
        className={cn(
          "flex-1 max-w-sm flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-surface border border-border text-muted-foreground text-xs",
          "hover:border-primary/40 hover:text-foreground transition-all duration-200",
          "cursor-pointer"
        )}
        onClick={() => {/* TODO: abrir busca global cmd+K */}}
        aria-label="Busca global (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Buscar projetos, templates...</span>
        <kbd className="ml-auto text-2xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        {/* Toggle de tema */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notificações */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
          aria-label="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </Button>

        {/* Avatar + menu de usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                "hover:bg-surface transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Menu do usuário"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground hidden sm:block">Usuário</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
