import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Copy, Check, RefreshCw, Monitor, ImageIcon, Loader2,
  Maximize2, X, Download, Wand2, CloudOff, Cloud, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AIStreamingIndicator from "@/components/AIStreamingIndicator";
import { Progress } from "@/components/ui/progress";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MockupState {
  url: string | null;
  prevUrl: string | null;      // keep previous for undo-visual
  isLoading: boolean;
  error: string | null;
  persisted: boolean;          // true = saved in Storage, false = base64 fallback
}

export interface ScreensWithMockupsProps {
  projectId: string;
  persistedContent: string | null;
  onContentGenerated: (contentType: string, content: string) => void;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
  /** pre-loaded mockups from project.metadata.mockups */
  initialMockups?: Record<string, string>;
  /** called whenever a new mockup is generated, for persistence */
  onMockupSaved?: (screenName: string, url: string) => void;
  /** project platform for aspect ratio detection */
  projectPlatform?: string;
}

// ── Robust screen parser — collects up to 800 chars of full description ────────
// Handles: ## Tela: X / ## Tela X: / ### Tela: / ## Screen: / ## 1. Tela / ## Tela 1 - X
// Also handles generic headers that are likely screen names in context
export function parseScreens(markdown: string): Array<{ name: string; description: string }> {
  const screens: Array<{ name: string; description: string }> = [];
  const lines = markdown.split("\n");
  let currentScreen: { name: string; descLines: string[] } | null = null;

  const SCREEN_PATTERNS = [
    /^#{2,3}\s+Tela\s*[:–-]\s*(.+)$/i,                       // ## Tela: X  /  ## Tela - X
    /^#{2,3}\s+Tela\s+\d+\s*[:–-]\s*(.+)$/i,                // ## Tela 1: X
    /^#{2,3}\s+\d+[\.\)]\s+(.+(?:tela|screen|page|página|login|dashboard|painel|lista|detalhe|formulário|form|perfil|configuração|chat|notifica|onboard|cadastro|busca|search).*)$/i, // ## 1. Login Screen
    /^#{2,3}\s+Screen\s*[:–-]\s*(.+)$/i,                      // ## Screen: X
    /^#{2,3}\s+Página\s*[:–-]\s*(.+)$/i,                      // ## Página: X
    /^#{2,3}\s+(.+)\s+(?:Screen|Tela|Page|Página)$/i,         // ## Login Screen
    /^#{2,3}\s+(?:\d+[\.\)]\s+)?(\w[^#\n]{2,40})$/i,          // ## Dashboard / ## Login / ## Cadastro (generic short h2/h3)
  ];

  const pushCurrent = () => {
    if (!currentScreen) return;
    const description = currentScreen.descLines
      .join(" ")
      .trim()
      .slice(0, 800); // ← 800 chars (was 400) for richer AI context
    screens.push({ name: currentScreen.name, description });
  };

  for (const line of lines) {
    let matched = false;
    for (const pattern of SCREEN_PATTERNS) {
      const m = line.match(pattern);
      if (m) {
        pushCurrent();
        currentScreen = { name: m[1].trim(), descLines: [] };
        matched = true;
        break;
      }
    }
    if (!matched && currentScreen && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
      // Collect ALL non-header lines (up to 800 chars when joined)
      const joined = currentScreen.descLines.join(" ");
      if (joined.length < 800) {
        currentScreen.descLines.push(line.replace(/^[-*•]\s*/, "").trim());
      }
    }
  }

  pushCurrent();
  return screens.slice(0, 10); // max 10 screens
}

// ── Inline Markdown renderer ───────────────────────────────────────────────────
const InlineMarkdown = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") || part.startsWith("__")) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-xs font-bold text-foreground mt-4 mb-1.5">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-sm font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-base font-bold text-foreground mt-4 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* ") || lines[i].startsWith("• "))) {
        items.push(lines[i].replace(/^[-*•]\s*/, "")); i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-2 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-xs text-muted-foreground leading-relaxed"><InlineMarkdown text={item} /></li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, "")); i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-1 my-2 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-xs text-muted-foreground leading-relaxed"><InlineMarkdown text={item} /></li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("```")) {
      const codeLines: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={i} className="my-3 p-3 rounded-lg bg-muted/50 border border-border overflow-x-auto">
          <code className="text-xs font-mono text-foreground">{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="my-4 border-border" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-xs text-muted-foreground leading-relaxed"><InlineMarkdown text={line} /></p>
      );
    }
    i++;
  }
  return <>{elements}</>;
};

// ── MockupProgressBar ──────────────────────────────────────────────────────────
const MockupProgressBar = ({
  current,
  total,
  currentName,
}: {
  current: number;
  total: number;
  currentName: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="p-3 rounded-xl border border-primary/20 bg-primary/5"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Loader2 className="w-3 h-3 text-primary animate-spin" />
        <span className="text-xs font-medium text-primary">Gerando: {currentName}</span>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{current}/{total}</span>
    </div>
    <Progress value={(current / total) * 100} className="h-1.5" />
  </motion.div>
);

// ── MockupCard ─────────────────────────────────────────────────────────────────
const MockupCard = ({
  screenName,
  screenDescription,
  projectId,
  mockup,
  onMockupGenerated,
  platformType,
  isMobile,
}: {
  screenName: string;
  screenDescription: string;
  projectId: string;
  mockup: MockupState;
  onMockupGenerated: (name: string, url: string, persisted: boolean) => void;
  platformType?: string;
  isMobile?: boolean;
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [showPrev, setShowPrev] = useState(false);

  const isGenerating = mockup.isLoading;
  // Aspect ratio: portrait for mobile, widescreen for web/desktop
  const aspectClass = isMobile ? "aspect-[9/16]" : "aspect-[16/10]";

  const doGenerate = async () => {
    setConfirmRegen(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-screen-mockup", {
        body: {
          project_id: projectId,
          screen_name: screenName,
          screen_description: screenDescription,
          platform_type: platformType,
        },
      });
      if (error) throw error;
      if (data?.error) {
        const msg: string = data.error;
        if (msg.includes("429") || msg.includes("Limite")) {
          toast.error("Limite de requisições. Aguarde alguns minutos.");
        } else if (msg.includes("402") || msg.includes("Créditos")) {
          toast.error("Créditos insuficientes.");
        } else {
          toast.error(msg);
        }
        onMockupGenerated(screenName, mockup.url ?? "", mockup.persisted); // restore
        return;
      }
      if (data?.image_url) {
        onMockupGenerated(screenName, data.image_url, data.persisted ?? false);
        toast.success(`Mockup "${screenName}" gerado!`);
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast.error(msg.includes("429") ? "Limite de requisições. Aguarde." : "Erro ao gerar mockup. Tente novamente.");
      onMockupGenerated(screenName, mockup.url ?? "", mockup.persisted); // restore
    }
  };

  const handleGenerateClick = () => {
    if (mockup.url) {
      setConfirmRegen(true);
    } else {
      // signal loading immediately
      onMockupGenerated(screenName, "", false); // triggers loading state in parent
      doGenerate();
    }
  };

  const handleDownload = () => {
    if (!mockup.url) return;
    const a = document.createElement("a");
    a.href = mockup.url;
    a.download = `mockup-${screenName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.target = "_blank";
    a.click();
  };

  const displayUrl = showPrev && mockup.prevUrl ? mockup.prevUrl : mockup.url;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden flex flex-col group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
      >
        {/* Image area — aspect ratio adapts to platform */}
        <div className={cn("relative bg-muted/20 overflow-hidden", aspectClass)}>
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="absolute -inset-1.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
              <div className="text-center px-4 space-y-1">
                <p className="text-xs font-medium text-foreground">Gerando com IA</p>
                <p className="text-[10px] text-muted-foreground">Pode levar 15-30 segundos</p>
              </div>
            </div>
          ) : displayUrl ? (
            <motion.div
              key={displayUrl}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <img
                src={displayUrl}
                alt={`Mockup: ${screenName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
                  title="Ver em tamanho completo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
                  title="Baixar imagem"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground/50 text-center">Mockup não gerado</p>
            </div>
          )}

          {/* Badges */}
          {displayUrl && !isGenerating && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              <div className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="text-[9px] font-medium text-white/80 flex items-center gap-1">
                  <Bot className="w-2.5 h-2.5" />
                  IA
                </span>
              </div>
              {!mockup.persisted && (
                <div className="px-1.5 py-0.5 rounded-md bg-warning/40 backdrop-blur-sm border border-warning/20"
                  title="Imagem temporária — não salva no servidor">
                  <span className="text-[9px] font-medium text-warning flex items-center gap-1">
                    <CloudOff className="w-2.5 h-2.5" />
                    Temp
                  </span>
                </div>
              )}
              {mockup.persisted && (
                <div className="px-1.5 py-0.5 rounded-md bg-success/30 backdrop-blur-sm border border-success/20"
                  title="Imagem salva no servidor">
                  <span className="text-[9px] font-medium text-success flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" />
                    Salvo
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Previous version toggle */}
          {mockup.prevUrl && displayUrl && !isGenerating && (
            <button
              onClick={() => setShowPrev(p => !p)}
              className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-medium text-white/70 hover:text-white transition-colors"
              title={showPrev ? "Ver versão atual" : "Ver versão anterior"}
            >
              {showPrev ? "Atual" : "Anterior"}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 space-y-2.5">
          <p className="text-xs font-semibold text-foreground truncate" title={screenName}>{screenName}</p>

          {mockup.error && (
            <p className="text-[10px] text-destructive leading-tight">{mockup.error}</p>
          )}

          {/* Confirm regen dialog (inline) */}
          <AnimatePresence>
            {confirmRegen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-2.5 rounded-lg border border-warning/20 bg-warning/5 space-y-2">
                  <p className="text-[10px] text-warning leading-tight">
                    Substituirá o mockup atual. A versão anterior ficará disponível.
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        onMockupGenerated(screenName, "", false);
                        doGenerate();
                      }}
                      className="flex-1 py-1 rounded-md text-[10px] font-medium bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmRegen(false)}
                      className="flex-1 py-1 rounded-md text-[10px] font-medium border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!confirmRegen && (
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all duration-150",
                displayUrl
                  ? "border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                  : "border-primary/30 bg-primary/8 text-primary hover:bg-primary/15",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando...</>
              ) : displayUrl ? (
                <><RefreshCw className="w-3.5 h-3.5" />Regenerar</>
              ) : (
                <><Wand2 className="w-3.5 h-3.5" />Gerar Mockup</>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && displayUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative max-w-5xl max-h-[90vh] w-full flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={displayUrl}
                alt={`Mockup: ${screenName}`}
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                style={{ maxHeight: "86vh" }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-white/80 font-medium">
                  {screenName}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const ScreensWithMockups = ({
  projectId,
  persistedContent,
  onContentGenerated,
  isLoading,
  error,
  onGenerate,
  initialMockups = {},
  onMockupSaved,
}: ScreensWithMockupsProps) => {
  const [copied, setCopied] = useState(false);
  const [mockups, setMockups] = useState<Record<string, MockupState>>(() => {
    // Initialize from persisted mockups
    const initial: Record<string, MockupState> = {};
    for (const [name, url] of Object.entries(initialMockups)) {
      initial[name] = { url, prevUrl: null, isLoading: false, error: null, persisted: true };
    }
    return initial;
  });
  const [generateAllActive, setGenerateAllActive] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState({ current: 0, total: 0, name: "" });
  const abortRef = useRef(false);

  const handleCopy = async () => {
    if (!persistedContent) return;
    await navigator.clipboard.writeText(persistedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMockupGenerated = (name: string, url: string, persisted: boolean) => {
    setMockups((prev) => {
      const existing = prev[name];
      if (!url) {
        // Entering loading state
        return { ...prev, [name]: { ...( existing ?? { url: null, prevUrl: null, error: null, persisted: false }), isLoading: true } };
      }
      return {
        ...prev,
        [name]: {
          url,
          prevUrl: existing?.url ?? null,
          isLoading: false,
          error: null,
          persisted,
        },
      };
    });
    if (url && onMockupSaved) {
      onMockupSaved(name, url);
    }
  };

  const screens = persistedContent ? parseScreens(persistedContent) : [];
  const generatedCount = Object.values(mockups).filter((m) => m.url).length;
  const pendingScreens = screens.filter((s) => !mockups[s.name]?.url);

  const handleGenerateAll = async () => {
    abortRef.current = false;
    setGenerateAllActive(true);
    toast.info(`Gerando ${pendingScreens.length} mockups em sequência...`);
    let done = 0;

    for (const screen of pendingScreens) {
      if (abortRef.current) break;
      setGenerateAllProgress({ current: done, total: pendingScreens.length, name: screen.name });
      // Set loading on this card
      setMockups(prev => ({
        ...prev,
        [screen.name]: { ...( prev[screen.name] ?? { url: null, prevUrl: null, error: null, persisted: false }), isLoading: true },
      }));

      try {
        const { data, error } = await supabase.functions.invoke("generate-screen-mockup", {
          body: {
            project_id: projectId,
            screen_name: screen.name,
            screen_description: screen.description,
          },
        });
        if (!error && data?.image_url) {
          handleMockupGenerated(screen.name, data.image_url, data.persisted ?? false);
          done++;
          setGenerateAllProgress({ current: done, total: pendingScreens.length, name: screen.name });
        } else {
          setMockups(prev => ({
            ...prev,
            [screen.name]: { ...( prev[screen.name] ), isLoading: false },
          }));
        }
      } catch (_) {
        setMockups(prev => ({
          ...prev,
          [screen.name]: { ...( prev[screen.name] ), isLoading: false },
        }));
      }

      // Delay to avoid rate limiting
      if (!abortRef.current) await new Promise((r) => setTimeout(r, 2000));
    }

    setGenerateAllActive(false);
    if (done > 0) toast.success(`${done} mockup${done !== 1 ? "s" : ""} gerado${done !== 1 ? "s" : ""} com sucesso!`);
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!isLoading && !persistedContent && !error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <Monitor className="w-7 h-7 text-primary/60" />
        </div>
        <div className="text-center max-w-sm space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Mapa de Telas + Mockups Visuais</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A IA mapeará todas as telas do sistema e gerará mockups visuais de alta fidelidade para cada uma, com base no nicho e plataforma do seu projeto.
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <Bot className="w-4 h-4" />
          Gerar Telas com IA
        </button>
      </motion.div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <AIStreamingIndicator label="IA mapeando telas e componentes..." size="md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
              <div className="h-3 bg-muted/60 rounded w-1/3" />
              <div className="h-2 bg-muted/40 rounded w-full" />
              <div className="h-2 bg-muted/40 rounded w-4/5" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 rounded-xl border border-destructive/20 bg-destructive/5 gap-4"
      >
        <p className="text-xs text-destructive text-center max-w-xs">{error}</p>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </motion.div>
    );
  }

  // ── Content ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Gerado por IA</span>
          {screens.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
              {screens.length} tela{screens.length !== 1 ? "s" : ""}
            </span>
          )}
          {generatedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold border border-success/20">
              {generatedCount}/{screens.length} mockup{generatedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150",
              copied
                ? "border-success/30 bg-success/10 text-success"
                : "border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            )}
            title="Copiar documentação"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all duration-150"
            title="Regenerar documentação de telas"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            Regenerar
          </button>
        </div>
      </div>

      {/* Documentation */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <MarkdownRenderer content={persistedContent!} />
      </div>

      {/* Mockups section */}
      {screens.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="space-y-3"
        >
          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-accent" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Mockups Visuais</h3>
                <p className="text-[10px] text-muted-foreground">
                  Wireframes gerados por IA — clique para expandir
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {generateAllActive && (
                <button
                  onClick={() => { abortRef.current = true; }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancelar
                </button>
              )}
              {!generateAllActive && pendingScreens.length > 0 && (
                <button
                  onClick={handleGenerateAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-accent/30 bg-accent/8 text-accent hover:bg-accent/15 transition-all duration-150"
                >
                  <Wand2 className="w-3 h-3" />
                  Gerar Todos ({pendingScreens.length})
                </button>
              )}
            </div>
          </div>

          {/* Progress bar for generate all */}
          <AnimatePresence>
            {generateAllActive && (
              <MockupProgressBar
                current={generateAllProgress.current}
                total={generateAllProgress.total}
                currentName={generateAllProgress.name}
              />
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {screens.map((screen) => (
              <MockupCard
                key={screen.name}
                screenName={screen.name}
                screenDescription={screen.description}
                projectId={projectId}
                mockup={mockups[screen.name] ?? { url: null, prevUrl: null, isLoading: false, error: null, persisted: false }}
                onMockupGenerated={handleMockupGenerated}
              />
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center">
            Geração individual por tela — cada mockup usa o contexto completo do projeto.
            {screens.length >= 10 && " (Máximo de 10 telas exibidas)"}
          </p>
        </motion.div>
      ) : (
        persistedContent && (
          <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-2">
            <ImageIcon className="w-5 h-5 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">
              Nenhuma tela identificada no formato padrão. Clique em "Regenerar" para gerar novamente com o modelo atualizado.
            </p>
          </div>
        )
      )}
    </motion.div>
  );
};

export default ScreensWithMockups;
