import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeConfig = {
  sm: { ring: 48, stroke: 4, fontSize: "text-xs", labelSize: "text-2xs" },
  md: { ring: 80, stroke: 6, fontSize: "text-sm", labelSize: "text-xs" },
  lg: { ring: 120, stroke: 8, fontSize: "text-lg", labelSize: "text-xs" },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "hsl(var(--success))";
  if (score >= 60) return "hsl(var(--primary))";
  if (score >= 40) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Avançado";
  if (score >= 60) return "Intermediário";
  if (score >= 40) return "Básico";
  return "Inicial";
};

const ScoreRing = ({
  score,
  size = "md",
  showLabel = true,
  label,
  className,
}: ScoreRingProps) => {
  const { ring, stroke, fontSize, labelSize } = sizeConfig[size];
  const radius = (ring - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);

  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      controls.start({ strokeDashoffset, transition: { duration: 1.2, ease: "easeOut" } });
    }
  }, [inView, strokeDashoffset, controls]);

  return (
    <div ref={ref} className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg
          width={ring}
          height={ring}
          viewBox={`0 0 ${ring} ${ring}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <motion.circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={controls}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>

        {/* Número central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("font-display font-bold leading-none", fontSize)}
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {score}
          </motion.span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          {label && <p className={cn("font-medium text-foreground", labelSize)}>{label}</p>}
          <p className={cn("text-muted-foreground", labelSize)}>{getScoreLabel(score)}</p>
        </div>
      )}
    </div>
  );
};

export default ScoreRing;
