import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "destructive";

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  description: string;
  onDismiss?: () => void;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.ElementType; bg: string; border: string; iconColor: string; textColor: string }> = {
  info:        { icon: Info,          bg: "bg-info-subtle",        border: "border-info/25",        iconColor: "text-info",              textColor: "text-foreground" },
  success:     { icon: CheckCircle2,  bg: "bg-success-subtle",     border: "border-success/25",     iconColor: "text-success",           textColor: "text-foreground" },
  warning:     { icon: AlertTriangle, bg: "bg-warning-subtle",     border: "border-warning/25",     iconColor: "text-warning-foreground",textColor: "text-warning-foreground" },
  destructive: { icon: AlertCircle,   bg: "bg-destructive-subtle", border: "border-destructive/25", iconColor: "text-destructive",       textColor: "text-foreground" },
};

export function AlertBanner({ variant = "info", title, description, onDismiss, className }: AlertBannerProps) {
  const { icon: Icon, bg, border, iconColor, textColor } = config[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        bg, border, className
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", iconColor)} aria-hidden />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("text-sm font-medium", textColor)}>{title}</p>
        )}
        <p className={cn("text-sm", title ? "mt-0.5 text-muted-foreground" : textColor)}>
          {description}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
