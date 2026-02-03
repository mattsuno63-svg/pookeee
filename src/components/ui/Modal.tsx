"use client";

import { Fragment, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const MODAL_Z = "z-[60]";

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const content = (
    <Fragment>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${MODAL_Z} bg-background/80 backdrop-blur-sm`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal - posizionato in alto per evitare scroll su viewport corti */}
      <div className={`fixed inset-0 ${MODAL_Z} flex items-start justify-center pt-[10vh] pb-8 px-4 overflow-y-auto`}>
        <div
          className={cn(
            "relative w-full bg-background border border-border rounded-2xl shadow-xl max-h-[80vh] overflow-hidden flex flex-col",
            "animate-in fade-in-0 zoom-in-95 flex-shrink-0",
            {
              "max-w-sm": size === "sm",
              "max-w-md": size === "md",
              "max-w-lg": size === "lg",
              "max-w-2xl": size === "xl",
              "max-w-none mx-4": size === "full",
            }
          )}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h2 className="font-robert font-medium text-xl text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
                aria-label="Chiudi"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 flex-shrink-0">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
}
