import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "TourneyHub - Gestione Tornei TCG",
  description: "La piattaforma per gestire tornei di carte collezionabili: Magic, Pokémon, One Piece, Yu-Gi-Oh! e molto altro.",
  keywords: ["tornei", "TCG", "Magic", "Pokémon", "One Piece", "Yu-Gi-Oh", "carte collezionabili"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" data-scroll-behavior="smooth">
      <body className="font-robert antialiased">
        <Providers>
          <div className="wrapper">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
