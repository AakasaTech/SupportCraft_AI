import { cn } from "@/lib/utils";

interface AILoadingAnimationProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function AILoadingAnimation({
  size = "md",
  label = "AI is thinking…",
  className,
}: AILoadingAnimationProps) {
  const dotSize = { sm: "h-1.5 w-1.5", md: "h-2 w-2", lg: "h-2.5 w-2.5" }[size];

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-label={label}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "rounded-full bg-ai",
              dotSize
            )}
            style={{
              animation: `ai-typing 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

export function AITypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("sc-ai-card px-4 py-3 inline-flex", className)}>
      <AILoadingAnimation size="sm" label="" />
    </div>
  );
}
