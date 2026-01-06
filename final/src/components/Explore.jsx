// components/Explore.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { Search, Filter, Download, Eye, Calendar, User, Laptop, Loader2 } from 'lucide-react';

export default function Explore() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('explore');
  const [currentUser, setCurrentUser] = useState(null);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true); // État de chargement
  const [filtre, setFiltre] = useState("");
  const [filtreTechno, setFiltreTechno] = useState("");

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);
    fetchProjets();
  }, []);

  // --- APPELS API ---
  const fetchProjets = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      
      // Le backend renvoie { projects: [...] }
      setProjets(data.projects || []);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (projet) => {
    try {
      // On appelle la route de téléchargement du backend
      window.open(`http://localhost:5000/api/file/${projet.id}`, '_blank');
    } catch (error) {
      alert("Erreur lors du téléchargement");
    }
  };

  // --- LOGIQUE DE FILTRAGE ---
  const projetsFiltres = projets.filter((p) => {
    const searchLower = filtre.toLowerCase();
    return (
      p.titre?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.auteurNom?.toLowerCase().includes(searchLower) ||
      p.technologies?.some(tech => tech.toLowerCase().includes(searchLower))
    );
  }).filter((p) =>
    filtreTechno ? p.technologies?.some(tech => tech.toLowerCase() === filtreTechno.toLowerCase()) : true
  );

  const technologiesUniques = [...new Set(projets.flatMap(p => p.technologies || []))];

  // --- RENDU SIDEBAR ---
  const renderSidebar = () => {
    if (!currentUser) return <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
    switch (currentUser.role) {
      case 'administrateur': return <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'formateur': return <FormateurSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      default: return <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
    }
  };

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str.replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col md:flex-row">
      {renderSidebar()}
      
      <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Explorer les <span className="text-[#CE0033]">Projets</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Ressources partagées par la communauté Simplon Code Hub.
            </p>
          </div>

          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher un projet, une techno..."
              className="w-full bg-[#161618] border border-white/5 px-10 py-3 rounded-xl focus:border-[#CE0033] outline-none transition-all"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            />
          </div>
        </div>

        {/* FILTRES PAR TECHNO */}
        <div className="mb-8 flex flex-wrap gap-2 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
          <Filter size={16} className="text-[#CE0033] mr-2" />
          <button 
            onClick={() => setFiltreTechno("")}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!filtreTechno ? 'bg-[#CE0033] text-white' : 'bg-[#161618] text-gray-400 border border-white/5'}`}
          >
            Tous
          </button>
          {technologiesUniques.map((tech, i) => (
            <button 
              key={i}
              onClick={() => setFiltreTechno(tech)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filtreTechno === tech ? 'bg-[#CE0033] text-white' : 'bg-[#161618] text-gray-400 border border-white/5 hover:border-[#CE0033]/50'}`}
            >
              {tech}
            </button>
          ))}
        </div>

        {/* GRILLE OU LOADER */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#CE0033] mb-4" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement des projets...</p>
          </div>
        ) : projetsFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <Laptop size={60} className="text-white/10 mb-4" />
             <p className="text-gray-500 text-lg">Aucun projet trouvé dans la bibliothèque.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {projetsFiltres.map((projet) => (
              <div key={projet.id} className="group bg-[#161618] border border-white/5 rounded-2xl overflow-hidden hover:border-[#CE0033]/40 transition-all duration-300 flex flex-col shadow-xl">
                
                {/* Visual Placeholder (Simule une image de code) */}
                <div className="h-40 bg-gradient-to-br from-[#CE0033]/10 to-black relative flex items-center justify-center p-4">
                  <h2 className="text-white text-lg font-black text-center leading-tight uppercase tracking-tighter">
                    {projet.titre}
                  </h2>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black text-[#CE0033] border border-[#CE0033]/20 uppercase">
                    {projet.categorie || 'Projet'}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-gray-400 text-xs line-clamp-2 mb-4 italic h-8">
                    {projet.description || "Aucune description fournie."}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {projet.technologies?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-[#CE0033]/10 text-[#CE0033] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-1.5 font-bold uppercase">
                        <User size={12} className="text-[#CE0033]" />
                        <span className="truncate max-w-[90px]">{projet.auteurNom}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(projet.dateCreation).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link to={`/project/${projet.id}`} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Eye size={14} /> Détails
                      </Link>
                      <button 
                        onClick={() => handleDownload(projet)} 
                        className="flex items-center justify-center gap-2 bg-[#CE0033] hover:bg-[#A60029] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Download size={14} /> ZIP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}