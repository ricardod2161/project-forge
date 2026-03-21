import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardState {
  // Navigation
  currentStep: number;

  // Mode
  mode: "system" | "website";

  // Step 1 — Ideia
  idea: string;

  // Step 2 — Classificação (system)
  type: string;
  niche: string;
  complexity: number;
  platform: string;

  // Step 3 — Detalhamento (system)
  audience: string;
  features: string[];
  monetization: string;
  integrations: string[];

  // Website-specific
  websiteSections: string[];
  websiteStyle: string;
  websiteTone: string;
  websiteCMS: string;
  websiteHasEcommerce: boolean;
  websiteHasBlog: boolean;
  websiteHasForm: boolean;

  // Derived
  title: string;

  // UI
  isSubmitting: boolean;
}

interface WizardActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setMode: (mode: "system" | "website") => void;

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

  // Website actions
  toggleWebsiteSection: (section: string) => void;
  setWebsiteStyle: (style: string) => void;
  setWebsiteTone: (tone: string) => void;
  setWebsiteCMS: (cms: string) => void;
  setWebsiteHasEcommerce: (v: boolean) => void;
  setWebsiteHasBlog: (v: boolean) => void;
  setWebsiteHasForm: (v: boolean) => void;

  setTitle: (title: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;

  reset: () => void;
}

export type WizardStore = WizardState & WizardActions;

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: WizardState = {
  currentStep: 0,
  mode: "system",
  idea: "",
  type: "",
  niche: "",
  complexity: 3,
  platform: "",
  audience: "",
  features: [],
  monetization: "",
  integrations: [],
  websiteSections: [],
  websiteStyle: "",
  websiteTone: "",
  websiteCMS: "",
  websiteHasEcommerce: false,
  websiteHasBlog: false,
  websiteHasForm: false,
  title: "",
  isSubmitting: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectWizard = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      // System: 0-4 (5 steps), Website: 0-3 (4 steps)
      nextStep: () => set((s) => {
        const max = s.mode === "website" ? 3 : 4;
        return { currentStep: Math.min(s.currentStep + 1, max) };
      }),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

      setMode: (mode) => set({ mode }),

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

      // Website actions
      toggleWebsiteSection: (section) =>
        set((s) => ({
          websiteSections: s.websiteSections.includes(section)
            ? s.websiteSections.filter((x) => x !== section)
            : [...s.websiteSections, section],
        })),
      setWebsiteStyle: (websiteStyle) => set({ websiteStyle }),
      setWebsiteTone: (websiteTone) => set({ websiteTone }),
      setWebsiteCMS: (websiteCMS) => set({ websiteCMS }),
      setWebsiteHasEcommerce: (websiteHasEcommerce) => set({ websiteHasEcommerce }),
      setWebsiteHasBlog: (websiteHasBlog) => set({ websiteHasBlog }),
      setWebsiteHasForm: (websiteHasForm) => set({ websiteHasForm }),

      setTitle: (title) => set({ title }),
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      reset: () => set(initialState),
    }),
    {
      name: "wizard-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        mode: state.mode,
        idea: state.idea,
        type: state.type,
        niche: state.niche,
        complexity: state.complexity,
        platform: state.platform,
        audience: state.audience,
        features: state.features,
        monetization: state.monetization,
        integrations: state.integrations,
        websiteSections: state.websiteSections,
        websiteStyle: state.websiteStyle,
        websiteTone: state.websiteTone,
        websiteCMS: state.websiteCMS,
        websiteHasEcommerce: state.websiteHasEcommerce,
        websiteHasBlog: state.websiteHasBlog,
        websiteHasForm: state.websiteHasForm,
        title: state.title,
      }),
    }
  )
);
