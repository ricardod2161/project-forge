import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  original_idea: string | null;
  type: string | null;
  niche: string | null;
  complexity: number | null;
  platform: string | null;
  audience: string | null;
  features: string[] | null;
  monetization: string | null;
  integrations: string[] | null;
  status: "draft" | "active" | "archived";
  quality_score: number | null;
  is_favorite: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  original_idea: string;
  type?: string;
  niche?: string;
  complexity?: number;
  platform?: string;
  audience?: string;
  features?: string[];
  monetization?: string;
  integrations?: string[];
  description?: string;
  status?: "draft" | "active" | "archived";
}

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  favoriteProjects: number;
  totalPrompts: number;
  avgScore: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useProjectMetrics() {
  const { user } = useAuth();

  return useQuery<ProjectMetrics>({
    queryKey: ["project-metrics", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const userId = user!.id;

      const [projectsRes, promptsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("status, quality_score")
          .eq("user_id", userId),
        supabase
          .from("prompts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      const projects = projectsRes.data ?? [];
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p) => p.status === "active").length;
      const totalPrompts = promptsRes.count ?? 0;

      const scored = projects.filter((p) => p.quality_score !== null);
      const avgScore =
        scored.length > 0
          ? Math.round(scored.reduce((sum, p) => sum + (p.quality_score ?? 0), 0) / scored.length)
          : null;

      return { totalProjects, activeProjects, totalPrompts, avgScore };
    },
  });
}

export function useRecentProjects(limit = 6) {
  const { user } = useAuth();

  return useQuery<Project[]>({
    queryKey: ["recent-projects", user?.id, limit],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });
}

export function useProjects() {
  const { user } = useAuth();

  return useQuery<Project[]>({
    queryKey: ["projects", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: input.title,
          slug: slugify(input.title),
          original_idea: input.original_idea,
          description: input.description ?? null,
          type: input.type ?? null,
          niche: input.niche ?? null,
          complexity: input.complexity ?? 3,
          platform: input.platform ?? null,
          audience: input.audience ?? null,
          features: input.features ?? [],
          monetization: input.monetization ?? null,
          integrations: input.integrations ?? [],
          status: input.status ?? "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["recent-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Projeto criado com sucesso!");
      navigate(`/app/projetos/${project.id}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("projects")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["recent-projects"] });
    },
  });
}
