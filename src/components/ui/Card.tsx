"use client";

import { forwardRef, type HTMLAttributes, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "colored";
  tilt?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", tilt = false, children, ...props }, ref) => {
    const [transform, setTransform] = useState("");
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!tilt || !cardRef.current) return;

      const card = cardRef.current;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
      };

      const handleMouseLeave = () => {
        setTransform("");
      };

      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [tilt]);

    return (
      <div
        ref={ref || cardRef}
        className={cn(
          "rounded-card overflow-hidden transition-all duration-200",
          {
            // Default - subtle border
            "border border-border bg-foreground/5": variant === "default",
            
            // Interactive - hover effects
            "border border-border bg-foreground/5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 cursor-pointer":
              variant === "interactive",
            
            // Colored - primary background
            "bg-primary text-foreground": variant === "colored",
          },
          className
        )}
        style={{ transform }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pb-0", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// Card Title
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-robert font-medium text-xl text-foreground", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted mt-1.5", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 pt-0 flex items-center gap-4", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
