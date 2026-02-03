"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Preloader } from "@/components/layout/Preloader";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const heroVideos = [
  "/files/hero-1.mp4",
  "/files/hero-2.mp4",
  "/files/hero-3.mp4",
  "/files/hero-4.mp4",
];

const featureVideos = [
  "/files/feature-1.mp4",
  "/files/feature-2.mp4",
  "/files/feature-3.mp4",
  "/files/feature-4.mp4",
  "/files/feature-5.mp4",
];

export default function Home() {
  const router = useRouter();
  const { user, profile, isLoading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [hasClicked, setHasClicked] = useState(false);

  // Membri (player): redirect a /tornei — la landing è per visitatori e commercianti
  useEffect(() => {
    if (userLoading) return;
    if (user && profile?.role === "player") {
      router.replace("/tornei");
    }
  }, [user, profile?.role, userLoading, router]);

  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);

  // Handle video click
  const handleMiniVideoClick = () => {
    if (hasClicked) return;
    setHasClicked(true);

    const nextIndex = (currentVideoIndex + 1) % heroVideos.length;
    
    if (nextVideoRef.current) {
      nextVideoRef.current.src = heroVideos[nextIndex];
      nextVideoRef.current.play();
    }

    // Animate the transition
    gsap.to(nextVideoRef.current, {
      width: "100%",
      height: "100%",
      borderRadius: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        if (bgVideoRef.current) {
          bgVideoRef.current.src = heroVideos[nextIndex];
          bgVideoRef.current.play();
        }
        setCurrentVideoIndex(nextIndex);
        setHasClicked(false);
        
        // Reset next video
        gsap.set(nextVideoRef.current, {
          width: "16rem",
          height: "16rem",
          borderRadius: "1rem",
        });
      },
    });
  };

  // Initialize videos
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.src = heroVideos[0];
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.src = heroVideos[1];
    }
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (isLoading) return;

    // Hero title animation
    gsap.fromTo(
      ".hero__label",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out" }
    );

    // About section mask animation
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: clipRef.current,
        start: "center center",
        end: "+=800 center",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to(".mask-clip-path", {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
    });

    // Animate titles on scroll
    gsap.utils.toArray(".anim-title").forEach((title) => {
      gsap.fromTo(
        title as Element,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title as Element,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [isLoading]);

  // Tilt effect for cards
  useEffect(() => {
    const cards = document.querySelectorAll(".js-tilt");
    
    cards.forEach((card) => {
      const tilt = card.querySelector(".discover__tilt") as HTMLElement;
      if (!tilt) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        tilt.style.setProperty("--rx", `${rotateX}deg`);
        tilt.style.setProperty("--ry", `${rotateY}deg`);
        tilt.style.setProperty("--s", "1.02");
        card.classList.add("is-tilting");
      };

      const handleMouseLeave = () => {
        tilt.style.setProperty("--rx", "0deg");
        tilt.style.setProperty("--ry", "0deg");
        tilt.style.setProperty("--s", "1");
        card.classList.remove("is-tilting");
      };

      card.addEventListener("mousemove", handleMouseMove as EventListener);
      card.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        card.removeEventListener("mousemove", handleMouseMove as EventListener);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, [isLoading]);

  if (user && profile?.role === "player") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Reindirizzamento ai tornei...</div>
      </div>
    );
  }

  return (
    <>
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}

      <Header />
      
      <main className="bg-background">
        {/* HERO SECTION */}
        <section ref={heroRef} className="relative h-screen overflow-hidden" id="home">
          <h1 className="visually-hidden">TourneyHub: La piattaforma per tornei TCG</h1>
          
          <div className="relative h-full">
            {/* Video Stage */}
            <div className="absolute inset-0">
              <video
                ref={nextVideoRef}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 object-cover rounded-2xl z-10"
                loop
                muted
                playsInline
              />
              <video
                ref={bgVideoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                loop
              />
            </div>

            {/* Mini Video (Click to change) */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer hidden lg:block"
              onClick={handleMiniVideoClick}
            >
              <div className={cn(
                "transition-transform duration-500",
                hasClicked ? "scale-0" : "scale-50 hover:scale-[0.8]"
              )}>
                <video
                  ref={miniVideoRef}
                  className="w-64 h-64 object-cover rounded-2xl"
                  loop
                  muted
                  playsInline
                  autoPlay
                />
              </div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-4 max-w-[91.875rem] mx-auto">
              <div className="flex flex-col items-start gap-4">
                <h2 className="hero__label font-zentry text-[4rem] md:text-[8rem] lg:text-[12rem] font-bold uppercase leading-none text-foreground">
                  Tornei
                </h2>
                <p className="font-robert text-lg md:text-xl max-w-xs text-foreground/80">
                  Gestisci tornei TCG come un professionista. Magic, Pokémon, Yu-Gi-Oh! e molto altro.
                </p>
                <Link href="/registrati/gestore">
                  <Button variant="accent" size="lg">
                    Inizia Gratis
                  </Button>
                </Link>
              </div>
              
              {/* Bottom right title */}
              <h2 className="hero__label absolute bottom-[5%] right-4 font-zentry text-[4rem] md:text-[8rem] lg:text-[12rem] font-bold uppercase leading-none text-foreground">
                TCG
              </h2>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section ref={aboutRef} className="min-h-screen bg-foreground" id="about">
          <h2 className="visually-hidden">Chi siamo</h2>
          
          <div className="max-w-[91.875rem] mx-auto px-4 py-24 flex flex-col items-center text-center gap-4">
            <p className="font-robert text-sm uppercase tracking-widest text-background/80">
              Benvenuto su TourneyHub
            </p>
            <h3 className="anim-title font-zentry text-4xl md:text-6xl lg:text-[6rem] font-bold uppercase leading-tight text-background">
              La piattaforma definitiva per i tornei TCG
            </h3>
            <div className="space-y-2 text-background/90 font-robert font-bold">
              <p>Dimentica WhatsApp, Instagram e fogli Excel</p>
              <p>Gestisci tutto da un unico posto professionale</p>
            </div>
          </div>

          {/* Clip Viewport */}
          <div ref={clipRef} className="relative h-screen overflow-hidden">
            <div className="mask-clip-path absolute top-0 left-1/2 -translate-x-1/2 w-[32rem] h-[38rem] rounded-3xl overflow-hidden">
              <picture>
                <source media="(max-width: 600px)" srcSet="/img/about-600.webp" type="image/webp" />
                <source media="(max-width: 1200px)" srcSet="/img/about-1200.webp" type="image/webp" />
                <img 
                  src="/img/about.webp" 
                  alt="TourneyHub" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* DISCOVER/FEATURES SECTION */}
        <section className="bg-background py-24" id="features">
          <div className="max-w-[91.875rem] mx-auto px-4">
            <div className="max-w-lg mb-16">
              <h2 className="font-robert font-bold text-xl mb-2">Tutto quello che ti serve</h2>
              <p className="text-foreground/80">
                Una piattaforma completa con tutti gli strumenti per gestire tornei TCG professionali.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 - Large */}
              <article className="js-tilt relative min-h-[25rem] md:col-span-2 cursor-pointer">
                <div 
                  className="discover__tilt absolute inset-0 overflow-hidden border border-border/30 rounded-md"
                  style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))" }}
                >
                  <div className="relative z-10 p-5 h-full flex flex-col">
                    <h3 className="font-zentry text-4xl md:text-6xl leading-tight mb-4">GESTIONE TORNEI</h3>
                    <p className="max-w-xs text-foreground/80">
                      Crea tornei in pochi click. Swiss, eliminazione diretta, round robin. Qualsiasi formato.
                    </p>
                  </div>
                  <video 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    src={featureVideos[0]} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                </div>
              </article>

              {/* Feature 2 */}
              <article className="js-tilt relative min-h-[25rem] md:row-span-2 cursor-pointer">
                <div 
                  className="discover__tilt absolute inset-0 overflow-hidden border border-border/30 rounded-md"
                  style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))" }}
                >
                  <div className="relative z-10 p-5">
                    <h3 className="font-zentry text-4xl md:text-6xl leading-tight mb-4">PROFILI</h3>
                    <p className="max-w-xs text-foreground/80">
                      Ogni giocatore ha il suo profilo con statistiche, ELO, targhe e storico tornei.
                    </p>
                  </div>
                  <video 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    src={featureVideos[1]} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                </div>
              </article>

              {/* Feature 3 */}
              <article className="js-tilt relative min-h-[25rem] cursor-pointer">
                <div 
                  className="discover__tilt absolute inset-0 overflow-hidden border border-border/30 rounded-md"
                  style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))" }}
                >
                  <div className="relative z-10 p-5">
                    <h3 className="font-zentry text-4xl md:text-6xl leading-tight mb-4">LANDING PAGE</h3>
                    <p className="max-w-xs text-foreground/80">
                      Ogni negozio ha la sua pagina personalizzata con info, mappa e tornei.
                    </p>
                  </div>
                  <video 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    src={featureVideos[2]} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                </div>
              </article>

              {/* Feature 4 */}
              <article className="js-tilt relative min-h-[25rem] cursor-pointer">
                <div 
                  className="discover__tilt absolute inset-0 overflow-hidden border border-border/30 rounded-md"
                  style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))" }}
                >
                  <div className="relative z-10 p-5">
                    <h3 className="font-zentry text-4xl md:text-6xl leading-tight mb-4">NOTIFICHE</h3>
                    <p className="max-w-xs text-foreground/80">
                      Avvisi in tempo reale per iscrizioni, reminder e risultati.
                    </p>
                  </div>
                  <video 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    src={featureVideos[3]} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                </div>
              </article>

              {/* Feature 5 */}
              <article className="js-tilt relative min-h-[25rem] cursor-pointer">
                <div 
                  className="discover__tilt absolute inset-0 overflow-hidden border border-border/30 rounded-md"
                  style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))" }}
                >
                  <div className="relative z-10 p-5">
                    <h3 className="font-zentry text-4xl md:text-6xl leading-tight mb-4">SOCIAL EXPORT</h3>
                    <p className="max-w-xs text-foreground/80">
                      Genera grafiche per Instagram e Facebook in un click.
                    </p>
                  </div>
                  <video 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                    src={featureVideos[4]} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                </div>
              </article>

              {/* Feature 6 - Coming Soon */}
              <article className="js-tilt relative min-h-[25rem] cursor-pointer" data-tilt-glare="true">
                <div 
                  className="discover__tilt absolute inset-0 overflow-hidden border border-border/30 rounded-md bg-primary"
                  style={{ transform: "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))" }}
                >
                  <div className="relative z-10 p-5 h-full flex flex-col justify-between text-background">
                    <h3 className="font-zentry text-4xl md:text-6xl leading-tight">E MOLTO ALTRO!</h3>
                    <div className="text-4xl self-end">→</div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* STORY SECTION */}
        <section className="bg-background py-24" id="story">
          <div className="max-w-[91.875rem] mx-auto px-4 flex flex-col items-center gap-4">
            <p className="font-robert text-sm uppercase tracking-[0.22em] text-foreground/90">
              Multi-Gioco
            </p>
            
            <div className="relative">
              <h2 className="anim-title relative z-10 font-zentry text-4xl md:text-6xl lg:text-[6rem] font-bold text-center leading-tight mix-blend-difference">
                Tutti i TCG<br />in un unico posto
              </h2>
              
              <div className="mt-8 perspective-[1500px]">
                <div 
                  className="transform-style-preserve-3d"
                  style={{ transform: "rotateY(18deg) rotateX(2deg) rotateZ(5deg)" }}
                >
                  <picture>
                    <source media="(max-width: 600px)" srcSet="/img/entrance-600.webp" type="image/webp" />
                    <source media="(max-width: 1200px)" srcSet="/img/entrance-1200.webp" type="image/webp" />
                    <img 
                      src="/img/entrance.webp" 
                      alt="TCG Games" 
                      className="w-full max-w-4xl aspect-[1050/500] object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24" id="contact">
          <div className="max-w-[91.875rem] mx-auto px-4">
            <div className="relative bg-background rounded-lg p-10 md:p-16 overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center">
                <p className="font-robert text-sm uppercase tracking-widest text-foreground/80 mb-4">
                  Unisciti a TourneyHub
                </p>
                
                <h2 className="anim-title font-zentry text-4xl md:text-6xl lg:text-[5rem] font-bold uppercase leading-tight max-w-2xl mb-8">
                  INIZIA OGGI<br />LA TUA PROVA GRATUITA
                </h2>
                
                <Link href="/registrati/gestore">
                  <Button variant="default" size="lg">
                    Prova 4 giorni gratis
                  </Button>
                </Link>
              </div>

              {/* Decorative Images */}
              <div className="absolute top-[-5%] left-[3%] pointer-events-none">
                <picture>
                  <source media="(max-width: 600px)" srcSet="/img/contact-1-600.webp" type="image/webp" />
                  <source media="(max-width: 1200px)" srcSet="/img/contact-1-1200.webp" type="image/webp" />
                  <img 
                    src="/img/contact-1.webp" 
                    alt="" 
                    className="w-32 md:w-64 lg:w-80 h-auto"
                    style={{ clipPath: "polygon(0% 0%, 100% 30%, 90% 60%, 10% 90%)" }}
                  />
                </picture>
              </div>
              
              <div className="absolute left-[12%] bottom-[-9%] pointer-events-none">
                <picture>
                  <source media="(max-width: 600px)" srcSet="/img/contact-2-600.webp" type="image/webp" />
                  <source media="(max-width: 1200px)" srcSet="/img/contact-2-1200.webp" type="image/webp" />
                  <img 
                    src="/img/contact-2.webp" 
                    alt="" 
                    className="w-44 md:w-64 lg:w-80 h-auto"
                    style={{ clipPath: "polygon(15% 0%, 65% 10%, 60% 85%, 0% 100%)" }}
                  />
                </picture>
              </div>
              
              <div className="absolute right-0 top-[1%] pointer-events-none">
                <picture>
                  <source media="(max-width: 600px)" srcSet="/img/swordman-600.webp" type="image/webp" />
                  <source media="(max-width: 1200px)" srcSet="/img/swordman-1200.webp" type="image/webp" />
                  <img 
                    src="/img/swordman.webp" 
                    alt="" 
                    className="w-24 md:w-48 lg:w-80 h-auto"
                    style={{ clipPath: "polygon(8% 6%, 100% 18%, 92% 96%, 0% 90%)" }}
                  />
                </picture>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PREVIEW */}
        <section className="bg-background py-24 border-t border-border" id="pricing">
          <div className="max-w-[91.875rem] mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="anim-title font-zentry text-4xl md:text-6xl font-bold uppercase mb-4">
                Prezzi Semplici
              </h2>
              <p className="text-foreground/80 max-w-xl mx-auto">
                Giocatori gratis per sempre. Gestori, inizia con 4 giorni di prova gratuita.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Player Plan */}
              <div className="p-8 rounded-lg border border-border bg-foreground/5">
                <h3 className="font-zentry text-2xl font-bold mb-2">GIOCATORE</h3>
                <div className="text-4xl font-bold text-accent mb-4">GRATIS</div>
                <p className="text-foreground/80 mb-6">Per sempre, senza limiti</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Profilo pubblico
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Iscrizione tornei
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Statistiche e ELO
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Notifiche in tempo reale
                  </li>
                </ul>
                <Link href="/registrati" className="block mt-8">
                  <Button variant="outline" className="w-full">
                    Registrati Gratis
                  </Button>
                </Link>
              </div>

              {/* Owner Plan */}
              <div className="p-8 rounded-lg border-2 border-accent bg-accent/5 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-accent text-background text-xs font-bold px-3 py-1 rounded-full">
                  4 GG GRATIS
                </div>
                <h3 className="font-zentry text-2xl font-bold mb-2">GESTORE</h3>
                <div className="text-4xl font-bold text-accent mb-4">€29<span className="text-lg">/mese</span></div>
                <p className="text-foreground/80 mb-6">Per negozio, fatturazione mensile</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Dashboard completa
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Tornei illimitati
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Landing page negozio
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Template e programmazione
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Export social
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span> Multi-sede (-50% aggiuntive)
                  </li>
                </ul>
                <Link href="/registrati/gestore" className="block mt-8">
                  <Button variant="accent" className="w-full">
                    Inizia Prova Gratuita
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
