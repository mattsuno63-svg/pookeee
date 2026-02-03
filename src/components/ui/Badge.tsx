"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "primary" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-robert font-medium rounded-full",
          
          // Variants
          {
            "bg-foreground/10 text-foreground": variant === "default",
            "bg-accent text-background": variant === "accent",
            "bg-primary text-foreground": variant === "primary",
            "bg-green-500/20 text-green-400": variant === "success",
            "bg-yellow-500/20 text-yellow-400": variant === "warning",
            "bg-red-500/20 text-red-400": variant === "error",
            "border border-border text-foreground bg-transparent": variant === "outline",
          },
          
          // Sizes
          {
            "text-xs px-2 py-0.5": size === "sm",
            "text-sm px-3 py-1": size === "md",
          },
          
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
