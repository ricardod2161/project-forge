import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Project } from "@/hooks/useProjects";

export interface Prompt {
  id: string;
  project_id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  platform: string | null;
  version: number;
  tokens_estimate: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  snapshot: Record<string, unknown> | null;
  changes_summary: string | null;
  generated_by_ai: boolean;
  ai_observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvalDimension {
  name: string;
  score: number;
  justification: string;
  recommendations: string[];
}

export interface Evaluation {
  id: string;
  project_id: string;
  user_id: string;
  overall_score: number;
  dimensions: EvalDimension[];
  summary: string | null;
  top_priorities: string[];
  created_at: string;
}

// Tipo seguro para updates de projeto — sem campos imutáveis
export type ProjectUpdatePayload = Partial<
  Omit<Project, "id" | "user_id" | "created_at" | "updated_at">
>;

export function useProjectDetail(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Project;
    },
  });
}

export function useProjectPrompts(projectId: string | undefined) {
  return useQuery<Prompt[]>({
    queryKey: ["prompts", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Prompt[];
    },
  });
}

export function useProjectVersions(projectId: string | undefined) {
  return useQuery<ProjectVersion[]>({
    queryKey: ["versions", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*")
        .eq("project_id", projectId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProjectVersion[];
    },
  });
}

export function useUpdateProject(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProjectUpdatePayload) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates as Record<string, unknown>)
        .eq("id", id!)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["recent-projects"] });
      toast.success("Projeto atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["recent-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-metrics"] });
      toast.success("Projeto excluído.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

// Filtra explicitamente por user_id além do RLS
export function useAllUserPrompts() {
  const { user } = useAuth();
  return useQuery<(Prompt & { project_title?: string })[]>({
    queryKey: ["all-prompts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, projects(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        project_title: (p.projects as { title?: string } | null)?.title ?? "Projeto",
      })) as (Prompt & { project_title?: string })[];
    },
  });
}

// Filtra versões via projetos do usuário
export function useAllVersions() {
  const { user } = useAuth();
  return useQuery<(ProjectVersion & { project_title?: string })[]>({
    queryKey: ["all-versions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*, projects!inner(title, user_id)")
        .eq("projects.user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((v) => ({
        ...v,
        project_title: (v.projects as { title?: string } | null)?.title ?? "Projeto",
      })) as (ProjectVersion & { project_title?: string })[];
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Prompt excluído.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Hook para buscar avaliação mais recente persistida de um projeto
export function useProjectEvaluation(projectId: string | undefined) {
  return useQuery<Evaluation | null>({
    queryKey: ["evaluation", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Evaluation | null> => {
      // Cast necessário pois a tabela evaluations não está no types.ts gerado ainda
      const { data, error } = await (supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              order: (col: string, opts: { ascending: boolean }) => {
                limit: (n: number) => {
                  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
                };
              };
            };
          };
        };
      }).from("evaluations")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id as string,
        project_id: data.project_id as string,
        user_id: data.user_id as string,
        overall_score: data.overall_score as number,
        dimensions: (data.dimensions as unknown as EvalDimension[]) ?? [],
        summary: data.summary as string | null,
        top_priorities: (data.top_priorities as unknown as string[]) ?? [],
        created_at: data.created_at as string,
      };
    },
  });
}
