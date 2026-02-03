"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent" | "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center font-robert font-medium uppercase",
          "rounded-btn transition-all duration-300 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "hover:scale-105 active:scale-95",
          
          // Variants
          {
            // Default - white bg, black text
            "bg-foreground text-background hover:bg-foreground/90": variant === "default",
            
            // Accent - accent bg, black text
            "bg-accent text-background hover:bg-accent/90": variant === "accent",
            
            // Primary - primary bg, white text
            "bg-primary text-foreground hover:bg-primary/90": variant === "primary",
            
            // Outline - transparent with border
            "bg-transparent border border-border text-foreground hover:border-accent hover:text-accent": variant === "outline",
            
            // Ghost - no bg, no border
            "bg-transparent text-foreground hover:bg-foreground/10": variant === "ghost",
          },
          
          // Sizes
          {
            "text-xs px-4 py-2 gap-1.5": size === "sm",
            "text-sm px-6 py-3 gap-2": size === "md",
            "text-base px-8 py-4 gap-2.5": size === "lg",
          },
          
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Caricamento...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
