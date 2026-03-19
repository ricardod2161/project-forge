import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  BookTemplate,
  Zap,
  Upload,
  History,
  BarChart3,
  Settings,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Meus Projetos", url: "/app/projetos", icon: FolderOpen },
  { title: "Templates", url: "/app/templates", icon: BookTemplate },
  { title: "Prompts", url: "/app/prompts", icon: Zap },
  { title: "Exportações", url: "/app/exportacoes", icon: Upload },
  { title: "Versões", url: "/app/versoes", icon: History },
  { title: "Avaliações", url: "/app/avaliacoes", icon: BarChart3 },
];

const bottomItems = [
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
  { title: "Planos", url: "/app/planos", icon: CreditCard },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string, end = false) => {
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <NavLink to="/app" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sm text-foreground leading-tight">
              Arquiteto <span className="text-gradient">IA</span>
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Ação rápida: Novo Projeto */}
        {!collapsed && (
          <div className="px-2 mb-3">
            <NavLink
              to="/app/projetos/novo"
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium",
                "bg-gradient-primary text-primary-foreground",
                "hover:shadow-glow transition-all duration-200",
                "hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Novo Projeto</span>
            </NavLink>
          </div>
        )}

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground text-2xs uppercase tracking-wider px-2 mb-1">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold border-glow"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
