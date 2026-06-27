import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-button font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:     "border border-border bg-background text-foreground hover:bg-hover",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost:       "text-foreground hover:bg-hover",
        link:        "text-primary underline-offset-4 hover:underline p-0 h-auto",
        ai:          "sc-gradient-ai text-white hover:opacity-90",
        "outline-ai":"border border-ai-border bg-ai-subtle text-ai hover:bg-ai-subtle/80",
      },
      size: {
        default: "h-9 px-4 py-2 [&_svg]:size-4",
        sm:      "h-8 px-3 text-xs rounded-md [&_svg]:size-3.5",
        lg:      "h-10 px-6 [&_svg]:size-4",
        xl:      "h-11 px-8 text-base [&_svg]:size-5",
        icon:    "h-9 w-9 [&_svg]:size-4",
        "icon-sm":"h-8 w-8 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading, loadingText, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
