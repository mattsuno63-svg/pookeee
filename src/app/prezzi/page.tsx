import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function PrezziPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-zentry text-4xl font-bold uppercase mb-8 text-center">
            Prezzi semplici
          </h1>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-lg border border-border text-center">
              <h2 className="font-zentry text-2xl font-bold mb-4">GIOCATORE</h2>
              <div className="text-4xl font-bold text-accent mb-4">GRATIS</div>
              <p className="text-muted mb-6">Per sempre, senza limiti</p>
              <ul className="text-left space-y-2 mb-8">
                <li>Profilo pubblico</li>
                <li>Iscrizione tornei</li>
                <li>Statistiche e ELO</li>
                <li>Notifiche in tempo reale</li>
              </ul>
              <Link href="/registrati">
                <Button variant="outline" className="w-full">Registrati gratis</Button>
              </Link>
            </div>
            <div className="p-8 rounded-lg border-2 border-accent bg-accent/5 text-center relative">
              <div className="absolute top-4 right-4 bg-accent text-background text-xs font-bold px-3 py-1 rounded-full">
                4 GG GRATIS
              </div>
              <h2 className="font-zentry text-2xl font-bold mb-4">GESTORE</h2>
              <div className="text-4xl font-bold text-accent mb-4">€29<span className="text-lg">/mese</span></div>
              <p className="text-muted mb-6">Per negozio</p>
              <ul className="text-left space-y-2 mb-8">
                <li>Dashboard completa</li>
                <li>Tornei illimitati</li>
                <li>Landing page negozio</li>
                <li>Export grafiche social</li>
                <li>Multi-sede (-50% aggiuntive)</li>
              </ul>
              <Link href="/registrati/gestore">
                <Button variant="accent" className="w-full">Inizia prova gratuita</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
