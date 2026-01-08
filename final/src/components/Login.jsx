import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gestion du scroll pour le header dynamique
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation d'apparition (Reveal)
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll(".reveal");
      reveals.forEach((el) => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - 100) {
          el.classList.add("opacity-100", "translate-y-0");
        }
      });
    };
    window.addEventListener("scroll", reveal);
    reveal(); 
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  const revealClass = "reveal opacity-0 translate-y-10 transition-all duration-1000 ease-out";
  const bgImage = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="relative min-h-screen bg-[#0A0A0B] text-white font-sans overflow-x-hidden selection:bg-[#CE0033] selection:text-white">
      
      {/* 1. ARRIÈRE-PLAN DYNAMIQUE */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute top-[-5%] left-[-10%] w-[80%] md:w-[50%] h-[40%] bg-[#CE0033]/15 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[5%] right-[-5%] w-[70%] md:w-[40%] h-[30%] bg-blue-600/10 rounded-full blur-[80px] md:blur-[100px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/90 via-[#0A0A0B] to-[#0A0A0B]" />
      </div>

      {/* 2. BARRE DE NAVIGATION (Modifiée pour opacité mobile) */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-6 ${
        scrolled 
          ? "py-4 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-white/5" 
          : "py-6 bg-[#0A0A0B] md:bg-transparent md:py-8"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group z-50" onClick={() => navigate("/")}>
            <div className="w-10 h-10 md:w-11 md:h-11 bg-[#CE0033] flex items-center justify-center rounded-lg shadow-lg shadow-[#CE0033]/20 group-hover:rotate-12 transition-transform font-black text-xl md:text-2xl">
              S
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">
              SIMPLON <span className="text-[#CE0033]">HUB</span>
            </h1>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate("/activation")} className="text-xs font-bold tracking-widest text-gray-400 hover:text-white transition uppercase">
              Activer Compte
            </button>
            <button onClick={() => navigate("/login")} className="px-10 py-4 text-xs font-black bg-[#CE0033] rounded-full hover:bg-red-700 transition shadow-xl shadow-[#CE0033]/30 uppercase tracking-[0.2em] active:scale-95">
              Connexion
            </button>
          </nav>

          {/* Bouton Burger Mobile */}
          <button className="md:hidden z-50 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>

        {/* Overlay Menu Mobile */}
        <div className={`fixed inset-0 bg-[#0A0A0B] transition-transform duration-500 flex flex-col items-center justify-center gap-8 md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <button onClick={() => {navigate("/activation"); setMobileMenuOpen(false)}} className="text-2xl font-black uppercase tracking-widest">Activer Compte</button>
          <button onClick={() => {navigate("/login"); setMobileMenuOpen(false)}} className="px-12 py-5 bg-[#CE0033] rounded-full text-xl font-black uppercase tracking-widest">Connexion</button>
          <button onClick={() => {navigate("/explore"); setMobileMenuOpen(false)}} className="text-gray-400 uppercase tracking-widest font-bold">Explorer</button>
        </div>
      </header>

      {/* 3. CONTENU PRINCIPAL */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-32 md:pt-48 pb-20">

        {/* HERO SECTION */}
        <section className={`flex flex-col items-center text-center ${revealClass}`}>
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-8">
            <span className="w-2 h-2 bg-[#CE0033] rounded-full animate-pulse" />
            Simplon Côte d'Ivoire
          </div>
          
          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-[100px] font-black tracking-tighter leading-[1.1] md:leading-[0.85] mb-8">
            Vos Codes, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#CE0033] via-red-500 to-orange-500">
              Notre Héritage.
            </span>
          </h1>

          <p className="text-gray-400 max-w-2xl text-base md:text-xl leading-relaxed mb-12 font-medium">
            La plateforme officielle de centralisation des projets de Simplon CI. 
            Valorisez votre expertise technique auprès de la communauté.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => navigate("/login")} className="group relative px-10 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.2em] overflow-hidden transition-all active:scale-95">
              <span className="relative z-10 group-hover:text-white transition-colors">Commencer</span>
              <div className="absolute inset-0 bg-[#CE0033] translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            </button>
            <button onClick={() => navigate("/explore")} className="px-10 py-5 border border-white/20 hover:border-[#CE0033] text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-white/5 active:scale-95">
              Explorer
            </button>
          </div>
        </section>

        {/* SECTION CHIFFRES */}
        <section className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 md:mt-56 py-12 border-y border-white/5 bg-white/[0.01] rounded-[2rem] ${revealClass}`}>
          {[
            { label: "Adoption", val: "80%" },
            { label: "Projets", val: "300+" },
            { label: "Vitesse", val: "<15s" },
            { label: "Partage", val: "70%" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-6xl font-black text-[#CE0033] mb-1 italic leading-none">{stat.val}</div>
              <div className="text-[9px] uppercase tracking-widest text-gray-600 font-black">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* SECTION POURQUOI CENTRALISER */}
        <section className={`mt-32 md:mt-56 ${revealClass}`}>
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
            <div className="space-y-4 text-center md:text-left">
               <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic">
                 Pourquoi <br/><span className="text-[#CE0033]">Centraliser ?</span>
               </h2>
               <div className="w-16 h-1.5 bg-[#CE0033] mx-auto md:mx-0" />
            </div>
            <p className="text-gray-500 max-w-sm text-sm md:text-lg italic border-l-0 md:border-l-2 border-[#CE0033] md:pl-8 leading-relaxed font-medium text-center md:text-left">
              "Fédérer les talents pour construire une base de connaissances durable."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Capitalisation", desc: "Base de ressources réutilisables pour les futurs stagiaires.", tag: "Knowledge" },
              { title: "Visibilité", desc: "Valorisation de vos travaux pour booster votre employabilité.", tag: "Showcase" },
              { title: "Partage", desc: "Échange de connaissances techniques entre toutes les cohortes.", tag: "Network" }
            ].map((item, i) => (
              <div key={i} className="group p-8 md:p-12 bg-[#111113] border border-white/5 hover:border-[#CE0033]/40 transition-all rounded-[2rem]">
                <div className="text-[10px] text-[#CE0033] font-black uppercase tracking-[0.2em] mb-6">{item.tag}</div>
                <h3 className="text-2xl font-black mb-3 italic tracking-tight uppercase">{item.title}</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6">{item.desc}</p>
                <div className="w-full h-px bg-white/5 group-hover:bg-[#CE0033] transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className={`mt-32 md:mt-56 py-20 px-6 bg-gradient-to-br from-[#CE0033] to-red-950 rounded-[2.5rem] md:rounded-[4rem] text-center relative overflow-hidden ${revealClass}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />
          <h2 className="text-4xl md:text-7xl font-black mb-10 tracking-tighter uppercase leading-tight italic">Prêt à marquer <br className="hidden md:block"/> l'histoire ?</h2>
          <button 
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-12 py-6 bg-white text-[#CE0033] font-black uppercase text-xs tracking-widest rounded-full hover:scale-105 transition-transform shadow-2xl active:scale-95"
          >
            Ouvrir une Session
          </button>
        </section>

        {/* FOOTER */}
        <footer className={`mt-32 md:mt-60 bg-[#0D0D0F]/80 border-t border-white/5 pt-20 pb-10 ${revealClass}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center sm:text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="w-9 h-9 bg-[#CE0033] flex items-center justify-center rounded-lg font-black text-lg">S</div>
                <h1 className="text-xl font-black tracking-tighter uppercase italic">SIMPLON HUB</h1>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed uppercase font-bold tracking-tight">Centralisation & Excellence au service de Simplon Côte d'Ivoire.</p>
            </div>

            {['Navigation', 'Support', 'Contact'].map((cat, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white">{cat}</h4>
                <ul className="space-y-3 text-gray-600 text-xs font-bold uppercase tracking-tighter">
                  {cat === 'Navigation' && ['Accueil', 'Explorer', 'Classement'].map(i => <li key={i} className="hover:text-[#CE0033] transition-colors cursor-pointer">{i}</li>)}
                  {cat === 'Support' && ['Documentation', 'Github', 'Guide'].map(i => <li key={i} className="hover:text-white transition-colors cursor-pointer">{i}</li>)}
                  {cat === 'Contact' && <li className="text-[#CE0033] italic">contact@simplon.ci</li>}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center">
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">© 2026 Simplon Côte d'Ivoire</p>
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-gray-700">
              <span className="hover:text-white cursor-pointer transition-colors">Confidentialité</span>
              <span className="hover:text-white cursor-pointer transition-colors">Mentions Légales</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Home;