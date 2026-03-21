import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useProjects";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FREE_PROJECT_LIMIT = 3;

const FreePlanBanner = () => {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const { data: projects } = useProjects();

  if (profile?.plan !== "free") return null;

  const count = projects?.length ?? 0;
  const pct = Math.min((count / FREE_PROJECT_LIMIT) * 100, 100);
  const isAtLimit = count >= FREE_PROJECT_LIMIT;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 px-4 py-2 border-b text-2xs",
        isAtLimit
          ? "bg-warning/10 border-warning/20 text-warning"
          : "bg-surface border-border text-muted-foreground"
      )}
    >
      <Zap className={cn("w-3 h-3 flex-shrink-0", isAtLimit ? "text-warning" : "text-primary")} />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium">
          {count}/{FREE_PROJECT_LIMIT} projetos · Plano Free
        </span>
        <div className="h-1 w-20 rounded-full bg-muted overflow-hidden hidden sm:block">
          <div
            className={cn("h-full rounded-full transition-all", isAtLimit ? "bg-warning" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isAtLimit && (
          <span className="text-warning font-medium">Limite atingido</span>
        )}
      </div>
      <Link
        to="/app/planos"
        className={cn(
          "flex-shrink-0 px-2.5 py-1 rounded-full text-2xs font-semibold transition-all",
          isAtLimit
            ? "bg-warning text-warning-foreground hover:bg-warning/90"
            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
        )}
      >
        Fazer upgrade
      </Link>
    </motion.div>
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader />
          <FreePlanBanner />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
