import React, { useState, useEffect, useRef } from "react";
import { AdminSidebar } from "./Sidebar"; 
import { PlusCircle, Edit3, Trash2, ExternalLink, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const capitalizeWords = (str) => {
  if (!str) return str;
  return String(str).trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function Projects() {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const baseUrl = 'http://localhost:5000';
  
  const tableWrapperRef = useRef(null);
  const footerScrollerRef = useRef(null);
  const footerInnerRef = useRef(null);

  // --- CHARGEMENT DEPUIS LE BACKEND ---
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/projects`);
      const data = await res.json();
      // On s'assure de récupérer le tableau 'projects' envoyé par Flask
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Erreur chargement projets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- SUPPRESSION RÉELLE (FICHIER + JSON) ---
  const handleDelete = async (id, titre) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le projet "${titre}" ?`)) {
      try {
        const res = await fetch(`${baseUrl}/api/projects/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          // Mise à jour de l'état local après suppression réussie
          setProjects(projects.filter(p => p.id !== id));
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  // Logique de synchronisation du scroll (Mobile)
  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const footer = footerScrollerRef.current;
    const footerInner = footerInnerRef.current;

    const updateFooterWidth = () => {
      const table = wrapper?.querySelector('table');
      if (table && footerInner) footerInner.style.width = table.scrollWidth + 'px';
    };

    const syncTable = () => { if (footer) footer.scrollLeft = wrapper.scrollLeft; };
    const syncFooter = () => { if (wrapper) wrapper.scrollLeft = footer.scrollLeft; };

    updateFooterWidth();
    window.addEventListener('resize', updateFooterWidth);
    wrapper?.addEventListener('scroll', syncTable);
    footer?.addEventListener('scroll', syncFooter);

    return () => {
      window.removeEventListener('resize', updateFooterWidth);
      wrapper?.removeEventListener('scroll', syncTable);
      footer?.removeEventListener('scroll', syncFooter);
    };
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">
                Gestion <span className="text-[#CE0033]">Projets</span>
              </h1>
              <p className="text-gray-500 text-sm font-medium">Administration de la base de données projets.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#CE0033] hover:bg-[#E60039] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-[#CE0033]/20">
                <PlusCircle size={18} /> Ajouter un projet
              </button>
            </div>
          </div>

          {/* Tableau de gestion */}
          <div className="bg-[#161618] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-[#CE0033]" size={30} />
              </div>
            ) : (
              <div ref={tableWrapperRef} className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-white/5">
                      <th className="py-5 px-6">Auteur</th>
                      <th className="py-5 px-6">Titre du Projet</th>
                      <th className="py-5 px-6">Catégorie</th>
                      <th className="py-5 px-6">Date</th>
                      <th className="py-5 px-6">Taille</th>
                      <th className="py-5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-gray-500 font-medium italic">
                          Aucun projet trouvé dans la base de données.
                        </td>
                      </tr>
                    ) : (
                      projects.map((project) => (
                        <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#CE0033]/20 flex items-center justify-center text-[#CE0033] text-[10px] font-black uppercase">
                                {project.auteurNom?.[0] || 'U'}
                              </div>
                              <span className="text-gray-300 text-sm font-bold uppercase">{project.auteurNom}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-white group-hover:text-[#CE0033] transition-colors block">
                              {project.titre}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] bg-white/5 border border-white/5 px-3 py-1 rounded-full text-gray-400 font-black uppercase tracking-widest">
                              {project.categorie}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-500 text-xs">
                            {new Date(project.dateCreation).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-gray-500 text-xs font-mono">
                            {project.taille}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              {/* BOUTON VOIR (DÉTAILS) */}
                              <button 
                                onClick={() => navigate(`/project/${project.id}`)}
                                title="Voir les détails" 
                                className="p-2 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-colors text-gray-500"
                              >
                                <ExternalLink size={16} />
                              </button>
                              
                              {/* BOUTON SUPPRIMER (API) */}
                              <button 
                                onClick={() => handleDelete(project.id, project.titre)}
                                title="Supprimer définitivement" 
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-gray-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mobile Scroll Sync Footer */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0B] border-t border-white/5 p-2">
            <div ref={footerScrollerRef} className="overflow-x-auto">
              <div ref={footerInnerRef} className="h-1" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}