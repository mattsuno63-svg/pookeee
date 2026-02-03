import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="font-robert font-bold text-xl">
          <span className="text-foreground">Tourney</span>
          <span className="text-accent">Hub</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} TourneyHub. Tutti i diritti riservati.
      </footer>
    </div>
  );
}
