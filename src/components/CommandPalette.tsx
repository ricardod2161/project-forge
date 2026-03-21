import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Layers, Zap, BarChart3, BookTemplate, Settings, X, ArrowRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const filteredProjects = (projects ?? [])
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  const showProjects = filteredProjects.length > 0 && (search.length === 0 || search.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <Command
              className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
              shouldFilter={false}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Command.Input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Buscar projetos, navegar ou executar ações..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                {/* Ações rápidas */}
                {(search.length === 0 || "novo projeto criar".includes(search.toLowerCase())) && (
                  <Command.Group heading={<span className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Ações Rápidas</span>}>
                    <CommandItem
                      icon={<Plus className="w-3.5 h-3.5 text-primary" />}
                      label="Novo Projeto"
                      shortcut="N"
                      onSelect={() => handleSelect("/app/projetos/novo")}
                    />
                    <CommandItem
                      icon={<Zap className="w-3.5 h-3.5 text-warning" />}
                      label="Meus Prompts"
                      onSelect={() => handleSelect("/app/prompts")}
                    />
                    <CommandItem
                      icon={<BarChart3 className="w-3.5 h-3.5 text-success" />}
                      label="Avaliações"
                      onSelect={() => handleSelect("/app/avaliacoes")}
                    />
                    <CommandItem
                      icon={<BookTemplate className="w-3.5 h-3.5 text-accent" />}
                      label="Templates"
                      onSelect={() => handleSelect("/app/templates")}
                    />
                    <CommandItem
                      icon={<Settings className="w-3.5 h-3.5 text-muted-foreground" />}
                      label="Configurações"
                      onSelect={() => handleSelect("/app/configuracoes")}
                    />
                  </Command.Group>
                )}

                {/* Projetos */}
                {showProjects && (
                  <Command.Group heading={<span className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 block">
                    {search.length > 0 ? "Projetos encontrados" : "Projetos Recentes"}
                  </span>}>
                    {filteredProjects.map(project => (
                      <CommandItem
                        key={project.id}
                        icon={<Layers className="w-3.5 h-3.5 text-primary" />}
                        label={project.title}
                        sublabel={[project.niche, project.type].filter(Boolean).join(" · ")}
                        onSelect={() => handleSelect(`/app/projetos/${project.id}`)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Sem resultados */}
                {search.length > 0 && filteredProjects.length === 0 && (
                  <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
                    Nenhum resultado para "{search}"
                  </Command.Empty>
                )}
              </Command.List>

              <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-2xs text-muted-foreground">
                <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">↑↓</kbd> navegar</span>
                <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">↵</kbd> selecionar</span>
                <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> fechar</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Sub-componente de item
const CommandItem = ({
  icon,
  label,
  sublabel,
  shortcut,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  shortcut?: string;
  onSelect: () => void;
}) => (
  <Command.Item
    onSelect={onSelect}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
      "text-sm text-foreground",
      "aria-selected:bg-primary/10 aria-selected:text-primary",
      "hover:bg-muted/60 transition-colors"
    )}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="font-medium">{label}</span>
      {sublabel && <span className="ml-2 text-2xs text-muted-foreground">{sublabel}</span>}
    </span>
    {shortcut && (
      <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">{shortcut}</kbd>
    )}
    <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
  </Command.Item>
);

export default CommandPalette;
