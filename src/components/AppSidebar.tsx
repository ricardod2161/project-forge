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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const NavItem = ({
  item,
  collapsed,
  activeClassName,
}: {
  item: typeof navItems[0];
  collapsed: boolean;
  activeClassName: string;
}) => {
  const content = (
    <NavLink
      to={item.url}
      end={"end" in item ? item.end : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        collapsed && "justify-center px-2"
      )}
      activeClassName={activeClassName}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <NavLink to="/app" className={cn("flex items-center gap-2.5 group", collapsed && "justify-center")}>
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
        {/* Novo Projeto — both expanded and collapsed */}
        <div className={cn("mb-3", collapsed ? "px-1" : "px-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/app/projetos/novo"
                  className="flex items-center justify-center w-full p-2 rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-200 hover:scale-[1.05]"
                >
                  <Plus className="w-4 h-4" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Novo Projeto</TooltipContent>
            </Tooltip>
          ) : (
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
          )}
        </div>

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
                    <NavItem
                      item={item}
                      collapsed={collapsed}
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    />
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
                <NavItem
                  item={item}
                  collapsed={collapsed}
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
