import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import AIStreamingIndicator from "@/components/AIStreamingIndicator";

interface AIContentTabProps {
  contentType: "modules" | "screens" | "database" | "rules" | "site_pages" | "site_copy" | "site_seo" | "site_structure";
  projectId: string;
  icon: React.ElementType;
  title: string;
  description: string;
  onGenerate: () => Promise<void>;
  isLoading: boolean;
  content: string | null;
  error: string | null;
}

const AIContentTab = ({
  icon: Icon,
  title,
  description,
  onGenerate,
  isLoading,
  content,
  error,
}: AIContentTabProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Estado vazio — botão gerar
  if (!isLoading && !content && !error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border gap-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary/60" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <Bot className="w-4 h-4" />
          Gerar com IA
        </button>
      </motion.div>
    );
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-center py-10">
          <AIStreamingIndicator label="IA gerando conteúdo..." size="md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
              <div className="h-3 bg-muted/60 rounded w-1/3" />
              <div className="h-2 bg-muted/40 rounded w-full" />
              <div className="h-2 bg-muted/40 rounded w-4/5" />
              <div className="h-2 bg-muted/40 rounded w-3/4" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 rounded-xl border border-destructive/20 bg-destructive/5 gap-4">
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

  // Estado com conteúdo
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-3">
      {/* Barra de ações */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-3 h-3 text-primary" />
          </div>
          <span className="text-2xs text-muted-foreground font-medium">Gerado por IA</span>
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

      {/* Conteúdo Markdown renderizado */}
      <div className="p-5 rounded-xl border border-border bg-card">
        <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed">
          <MarkdownRenderer content={content!} />
        </div>
      </div>
    </motion.div>
  );
};

// Renderizador Markdown simples sem dependências externas
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
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-2 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-2xs text-muted-foreground leading-relaxed">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-1 my-2 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-2xs text-muted-foreground leading-relaxed">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-3 p-3 rounded-lg bg-muted/50 border border-border overflow-x-auto">
          <code className="text-2xs font-mono text-foreground">{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("---") || line.startsWith("===")) {
      elements.push(<hr key={i} className="my-4 border-border" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-2xs text-muted-foreground leading-relaxed">
          <InlineMarkdown text={line} />
        </p>
      );
    }
    i++;
  }

  return <>{elements}</>;
};

const InlineMarkdown = ({ text }: { text: string }) => {
  // Bold: **text** ou __text__
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

export default AIContentTab;
