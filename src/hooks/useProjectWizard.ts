import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardState {
  // Navigation
  currentStep: number;

  // Step 1 — Ideia
  idea: string;

  // Step 2 — Classificação
  type: string;
  niche: string;
  complexity: number;
  platform: string;

  // Step 3 — Detalhamento
  audience: string;
  features: string[];
  monetization: string;
  integrations: string[];

  // Derived
  title: string;

  // UI
  isSubmitting: boolean;
}

interface WizardActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setIdea: (idea: string) => void;
  setType: (type: string) => void;
  setNiche: (niche: string) => void;
  setComplexity: (complexity: number) => void;
  setPlatform: (platform: string) => void;

  setAudience: (audience: string) => void;
  addFeature: (feature: string) => void;
  removeFeature: (feature: string) => void;
  setMonetization: (monetization: string) => void;
  toggleIntegration: (integration: string) => void;

  setTitle: (title: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;

  reset: () => void;
}

export type WizardStore = WizardState & WizardActions;

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: WizardState = {
  currentStep: 0,
  idea: "",
  type: "",
  niche: "",
  complexity: 3,
  platform: "",
  audience: "",
  features: [],
  monetization: "",
  integrations: [],
  title: "",
  isSubmitting: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectWizard = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

      setIdea: (idea) => set({ idea }),
      setType: (type) => set({ type }),
      setNiche: (niche) => set({ niche }),
      setComplexity: (complexity) => set({ complexity }),
      setPlatform: (platform) => set({ platform }),

      setAudience: (audience) => set({ audience }),
      addFeature: (feature) => {
        const trimmed = feature.trim();
        if (!trimmed) return;
        const { features } = get();
        if (!features.includes(trimmed)) {
          set({ features: [...features, trimmed] });
        }
      },
      removeFeature: (feature) =>
        set((s) => ({ features: s.features.filter((f) => f !== feature) })),
      setMonetization: (monetization) => set({ monetization }),
      toggleIntegration: (integration) =>
        set((s) => ({
          integrations: s.integrations.includes(integration)
            ? s.integrations.filter((i) => i !== integration)
            : [...s.integrations, integration],
        })),

      setTitle: (title) => set({ title }),
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      reset: () => set(initialState),
    }),
    {
      name: "wizard-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        idea: state.idea,
        type: state.type,
        niche: state.niche,
        complexity: state.complexity,
        platform: state.platform,
        audience: state.audience,
        features: state.features,
        monetization: state.monetization,
        integrations: state.integrations,
        title: state.title,
      }),
    }
  )
);
