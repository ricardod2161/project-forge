import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Copy, Check, RefreshCw, Monitor, ImageIcon, Loader2,
  Maximize2, X, Download, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AIStreamingIndicator from "@/components/AIStreamingIndicator";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MockupState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ScreensWithMockupsProps {
  projectId: string;
  persistedContent: string | null;
  onContentGenerated: (contentType: string, content: string) => void;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
}

// ── Parse screen names from Markdown ──────────────────────────────────────────
function parseScreens(markdown: string): Array<{ name: string; description: string }> {
  const screens: Array<{ name: string; description: string }> = [];
  const lines = markdown.split("\n");
  let currentScreen: { name: string; description: string } | null = null;
  const descLines: string[] = [];

  for (const line of lines) {
    const screenMatch = line.match(/^##\s+Tela:\s*(.+)$/i);
    if (screenMatch) {
      if (currentScreen) {
        currentScreen.description = descLines.join(" ").trim().slice(0, 300);
        screens.push(currentScreen);
        descLines.length = 0;
      }
      currentScreen = { name: screenMatch[1].trim(), description: "" };
    } else if (currentScreen && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
      descLines.push(line.replace(/^[-*]\s*/, "").trim());
    }
  }

  if (currentScreen) {
    currentScreen.description = descLines.join(" ").trim().slice(0, 300);
    screens.push(currentScreen);
  }

  return screens.slice(0, 8); // max 8 screens
}

// ── Inline Markdown renderer (reused from AIContentTab) ───────────────────────
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
      elements.push(<h3 key={i} className="text-xs font-bold text-foreground mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-sm font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-base font-bold text-foreground mt-4 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2)); i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-2 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-2xs text-muted-foreground leading-relaxed"><InlineMarkdown text={item} /></li>
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
            <li key={idx} className="text-2xs text-muted-foreground leading-relaxed"><InlineMarkdown text={item} /></li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("```")) {
      const codeLines: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={i} className="my-3 p-3 rounded-lg bg-muted/50 border border-border overflow-x-auto">
          <code className="text-2xs font-mono text-foreground">{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="my-4 border-border" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-2xs text-muted-foreground leading-relaxed"><InlineMarkdown text={line} /></p>
      );
    }
    i++;
  }
  return <>{elements}</>;
};

// ── Mockup card ────────────────────────────────────────────────────────────────
const MockupCard = ({
  screenName,
  screenDescription,
  projectId,
  mockup,
  onMockupGenerated,
}: {
  screenName: string;
  screenDescription: string;
  projectId: string;
  mockup: MockupState;
  onMockupGenerated: (name: string, url: string) => void;
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isGenerating = mockup.isLoading || localLoading;

  const handleGenerate = async () => {
    setLocalLoading(true);
    setLocalError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-screen-mockup", {
        body: {
          project_id: projectId,
          screen_name: screenName,
          screen_description: screenDescription,
        },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("429") || data.error.includes("Limite")) {
          setLocalError("Limite de requisições. Aguarde.");
        } else if (data.error.includes("402") || data.error.includes("Créditos")) {
          setLocalError("Créditos insuficientes.");
        } else {
          setLocalError(data.error);
        }
        return;
      }
      if (data?.image_url) {
        onMockupGenerated(screenName, data.image_url);
        toast.success(`Mockup de "${screenName}" gerado!`);
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar mockup";
      setLocalError(msg.includes("429") ? "Limite de requisições. Aguarde." : "Erro ao gerar. Tente novamente.");
    } finally {
      setLocalLoading(false);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
      >
        {/* Image area */}
        <div className="relative aspect-[9/16] sm:aspect-[3/4] bg-muted/30 overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="absolute -inset-1 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
              <p className="text-2xs text-muted-foreground text-center px-4">
                Gerando mockup com IA...
              </p>
            </div>
          ) : mockup.url ? (
            <motion.div
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={mockup.url}
                alt={`Mockup: ${screenName}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
                  title="Ver em tamanho completo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
                  title="Baixar imagem"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-2xs text-muted-foreground/60 text-center">
                Mockup não gerado
              </p>
            </div>
          )}

          {/* AI badge */}
          {mockup.url && !isGenerating && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
              <span className="text-[10px] font-medium text-white/80 flex items-center gap-1">
                <Bot className="w-2.5 h-2.5" />
                IA
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 space-y-2">
          <p className="text-2xs font-semibold text-foreground truncate">{screenName}</p>

          {localError && (
            <p className="text-[10px] text-destructive leading-tight">{localError}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium border transition-all duration-150",
              mockup.url
                ? "border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                : "border-primary/30 bg-primary/8 text-primary hover:bg-primary/15",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Gerando...</>
            ) : mockup.url ? (
              <><RefreshCw className="w-3 h-3" />Regenerar</>
            ) : (
              <><Wand2 className="w-3 h-3" />Gerar Mockup</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && mockup.url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={mockup.url}
                alt={`Mockup: ${screenName}`}
                className="w-full h-full object-contain rounded-xl shadow-2xl"
                style={{ maxHeight: "85vh" }}
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-white/80">
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
}: ScreensWithMockupsProps) => {
  const [copied, setCopied] = useState(false);
  const [mockups, setMockups] = useState<Record<string, MockupState>>({});
  const [generateAllLoading, setGenerateAllLoading] = useState(false);

  const handleCopy = async () => {
    if (!persistedContent) return;
    await navigator.clipboard.writeText(persistedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMockupGenerated = (name: string, url: string) => {
    setMockups((prev) => ({ ...prev, [name]: { url, isLoading: false, error: null } }));
  };

  const screens = persistedContent ? parseScreens(persistedContent) : [];

  const generatedCount = Object.values(mockups).filter((m) => m.url).length;

  // ── Estado vazio ──
  if (!isLoading && !persistedContent && !error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border gap-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <Monitor className="w-6 h-6 text-primary/60" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Mapa de Telas</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A IA mapeará todas as telas do sistema e gerará mockups visuais para cada uma.
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <Bot className="w-4 h-4" />
          Gerar Telas com IA
        </button>
      </motion.div>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-center py-10">
          <AIStreamingIndicator label="IA mapeando telas..." size="md" />
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

  // ── Erro ──
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

  // ── Com conteúdo ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-3 h-3 text-primary" />
          </div>
          <span className="text-2xs text-muted-foreground font-medium">Gerado por IA</span>
          {screens.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
              {screens.length} telas
            </span>
          )}
          {generatedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold border border-success/20">
              {generatedCount} mockup{generatedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium border transition-all duration-150",
              copied
                ? "border-success/30 bg-success/10 text-success"
                : "border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            )}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all duration-150"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerar
          </button>
        </div>
      </div>

      {/* Markdown documentation */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <div className="prose prose-sm max-w-none text-xs leading-relaxed">
          <MarkdownRenderer content={persistedContent!} />
        </div>
      </div>

      {/* Mockups section */}
      {screens.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="space-y-3"
        >
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <ImageIcon className="w-3 h-3 text-accent" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Mockups Visuais</h3>
                <p className="text-[10px] text-muted-foreground">
                  Gere imagens de UI para cada tela usando IA
                </p>
              </div>
            </div>
            {screens.length > 1 && generatedCount < screens.length && (
              <button
                disabled={generateAllLoading}
                onClick={async () => {
                  setGenerateAllLoading(true);
                  toast.info("Gerando todos os mockups em sequência...");
                  for (const screen of screens) {
                    if (mockups[screen.name]?.url) continue;
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-screen-mockup", {
                        body: {
                          project_id: projectId,
                          screen_name: screen.name,
                          screen_description: screen.description,
                        },
                      });
                      if (!error && data?.image_url) {
                        handleMockupGenerated(screen.name, data.image_url);
                      }
                    } catch (_) {
                      // continue with next
                    }
                    // Small delay to avoid rate limiting
                    await new Promise((r) => setTimeout(r, 1500));
                  }
                  setGenerateAllLoading(false);
                  toast.success("Todos os mockups foram gerados!");
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-all duration-150",
                  "border-accent/30 bg-accent/8 text-accent hover:bg-accent/15",
                  generateAllLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {generateAllLoading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Gerando...</>
                ) : (
                  <><Wand2 className="w-3 h-3" />Gerar Todos</>
                )}
              </button>
            )}
          </div>

          {/* Grid of mockup cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {screens.map((screen) => (
              <MockupCard
                key={screen.name}
                screenName={screen.name}
                screenDescription={screen.description}
                projectId={projectId}
                mockup={mockups[screen.name] ?? { url: null, isLoading: false, error: null }}
                onMockupGenerated={handleMockupGenerated}
              />
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Cada mockup é gerado individualmente — clique em "Gerar Mockup" em cada card.
            {screens.length >= 8 && " (Máximo de 8 telas exibidas)"}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ScreensWithMockups;
