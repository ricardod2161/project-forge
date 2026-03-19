import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIStreamingIndicatorProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const AIStreamingIndicator = ({
  label = "IA gerando...",
  size = "md",
  className,
}: AIStreamingIndicatorProps) => {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-primary/10 border border-primary/20",
        className
      )}
      role="status"
      aria-label={label}
    >
      {/* Três pontos pulsantes */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("rounded-full bg-primary", dotSize)}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span
        className={cn(
          "font-medium text-primary",
          size === "sm" ? "text-2xs" : "text-xs"
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default AIStreamingIndicator;
