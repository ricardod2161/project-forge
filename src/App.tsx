import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Auth
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Layouts
import AppLayout from "@/layouts/AppLayout";

// Páginas públicas — carregadas estaticamente (críticas para auth)
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import CadastroPage from "@/pages/auth/CadastroPage";
import RecuperarSenhaPage from "@/pages/auth/RecuperarSenhaPage";
import NotFound from "@/pages/NotFound";

// Páginas do app — lazy loaded para melhorar performance do bundle inicial
const DashboardPage    = lazy(() => import("@/pages/app/DashboardPage"));
const ProjectsPage     = lazy(() => import("@/pages/app/ProjectsPage"));
const NewProjectPage   = lazy(() => import("@/pages/app/NewProjectPage"));
const ProjectDetailPage = lazy(() => import("@/pages/app/ProjectDetailPage"));
const TemplatesPage    = lazy(() => import("@/pages/app/TemplatesPage"));
const PromptsPage      = lazy(() => import("@/pages/app/PromptsPage"));
const ExportsPage      = lazy(() => import("@/pages/app/ExportsPage"));
const VersionsPage     = lazy(() => import("@/pages/app/VersionsPage"));
const EvaluationsPage  = lazy(() => import("@/pages/app/EvaluationsPage"));
const SettingsPage     = lazy(() => import("@/pages/app/SettingsPage"));
const PlansPage        = lazy(() => import("@/pages/app/PlansPage"));
const OnboardingPage   = lazy(() => import("@/pages/app/OnboardingPage"));

// Skeleton para Suspense durante lazy loading
const PageSkeleton = () => (
  <div className="space-y-6 p-1">
    <Skeleton className="h-10 w-64" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
    </div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min cache
      retry: 1,
      refetchOnWindowFocus: false,    // evita refetch desnecessário ao voltar ao tab
      refetchOnReconnect: true,       // mantém para dados críticos
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
  <Suspense fallback={<PageSkeleton />}>
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
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;
