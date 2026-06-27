import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}

export function Section({ children, className, as: Tag = "section" }: SectionProps) {
  return (
    <Tag className={cn("py-6", className)}>
      {children}
    </Tag>
  );
}

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide" | "full";
}

export function Container({ children, className, size = "default" }: ContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6",
        size === "narrow"  && "max-w-3xl",
        size === "default" && "max-w-7xl",
        size === "wide"    && "max-w-screen-2xl",
        size === "full"    && "max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}
