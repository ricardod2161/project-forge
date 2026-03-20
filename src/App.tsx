import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Auth
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Layouts
import AppLayout from "@/layouts/AppLayout";

// Páginas públicas
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import CadastroPage from "@/pages/auth/CadastroPage";
import RecuperarSenhaPage from "@/pages/auth/RecuperarSenhaPage";

// Páginas do app (autenticado)
import DashboardPage from "@/pages/app/DashboardPage";
import ProjectsPage from "@/pages/app/ProjectsPage";
import NewProjectPage from "@/pages/app/NewProjectPage";
import ProjectDetailPage from "@/pages/app/ProjectDetailPage";
import TemplatesPage from "@/pages/app/TemplatesPage";
import PromptsPage from "@/pages/app/PromptsPage";
import ExportsPage from "@/pages/app/ExportsPage";
import VersionsPage from "@/pages/app/VersionsPage";
import EvaluationsPage from "@/pages/app/EvaluationsPage";
import SettingsPage from "@/pages/app/SettingsPage";
import PlansPage from "@/pages/app/PlansPage";
import OnboardingPage from "@/pages/app/OnboardingPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Redireciona usuário logado para fora das páginas de auth
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* ── Rotas públicas ── */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    <Route path="/cadastro" element={<PublicOnlyRoute><CadastroPage /></PublicOnlyRoute>} />
    <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />

    {/* ── Rotas do app autenticado ── */}
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="projetos" element={<ProjectsPage />} />
      <Route path="projetos/novo" element={<NewProjectPage />} />
      <Route path="projetos/:id" element={<ProjectDetailPage />} />
      <Route path="templates" element={<TemplatesPage />} />
      <Route path="prompts" element={<PromptsPage />} />
      <Route path="exportacoes" element={<ExportsPage />} />
      <Route path="versoes" element={<VersionsPage />} />
      <Route path="avaliacoes" element={<EvaluationsPage />} />
      <Route path="configuracoes" element={<SettingsPage />} />
      <Route path="planos" element={<PlansPage />} />
    </Route>

    {/* Onboarding — sem sidebar */}
    <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
