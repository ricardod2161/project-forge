import { Bell, Search, Moon, Sun, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import CommandPalette from "@/components/CommandPalette";

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);
  const { isDark, toggleTheme } = useAppTheme();

  // Atalho Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-30">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors -ml-1" />

        {/* Global search trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className={cn(
            "flex-1 max-w-xs sm:max-w-sm flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "bg-surface border border-border text-muted-foreground text-xs",
            "hover:border-primary/40 hover:text-foreground transition-all duration-200",
            "cursor-pointer group"
          )}
          aria-label="Busca global (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-primary transition-colors" />
          <span className="hidden sm:block truncate">Buscar projetos, templates...</span>
          <span className="sm:hidden">Buscar...</span>
          <kbd className="ml-auto text-2xs bg-muted px-1.5 py-0.5 rounded font-mono hidden sm:block">⌘K</kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg",
                  "hover:bg-surface transition-colors duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                aria-label="Menu do usuário"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                  {initials ? (
                    <span className="text-2xs font-bold text-primary-foreground">{initials}</span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  )}
                </div>
                <span className="text-xs font-medium text-foreground hidden sm:block max-w-[100px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
                <p className="text-2xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate("/app/configuracoes")}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/configuracoes")}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
};

export default AppHeader;
