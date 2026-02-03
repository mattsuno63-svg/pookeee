"use client";

import { forwardRef, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", src, alt, fallback, ...props }, ref) => {
    const initials = fallback 
      ? fallback.slice(0, 2).toUpperCase() 
      : alt?.slice(0, 2).toUpperCase() || "??";

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full overflow-hidden",
          "bg-primary/20 text-foreground font-robert font-medium",
          
          // Sizes
          {
            "w-8 h-8 text-xs": size === "sm",
            "w-10 h-10 text-sm": size === "md",
            "w-14 h-14 text-lg": size === "lg",
            "w-20 h-20 text-2xl": size === "xl",
          },
          
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="w-full h-full object-cover"
            {...props}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
