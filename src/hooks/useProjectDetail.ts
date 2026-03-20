import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    mutationFn: async (updates: Partial<Omit<Project, "metadata"> & { metadata?: Record<string, unknown> | null }>) => {
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

export function useAllUserPrompts() {
  return useQuery<(Prompt & { project_title?: string })[]>({
    queryKey: ["all-prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, projects(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        project_title: (p.projects as { title?: string } | null)?.title ?? "Projeto",
      })) as (Prompt & { project_title?: string })[];
    },
  });
}

export function useAllVersions() {
  return useQuery<(ProjectVersion & { project_title?: string })[]>({
    queryKey: ["all-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*, projects(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((v) => ({
        ...v,
        project_title: (v.projects as { title?: string } | null)?.title ?? "Projeto",
      })) as (ProjectVersion & { project_title?: string })[];
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
