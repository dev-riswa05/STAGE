import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Download, Calendar, Tag, User, 
  Database, Code2, ExternalLink, ShieldCheck, Clock
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        // On récupère tous les projets et on cherche celui avec l'ID
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        const data = await response.json();
        const found = data.projects.find(p => p.id === id);
        
        if (found) {
          setProject(found);
        } else {
          console.error("Projet non trouvé");
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, API_BASE_URL]);

  const handleDownload = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download-file/${id}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.titre}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Échec du téléchargement");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050506] flex items-center justify-center">
      <div className="animate-pulse text-[#CE0033] font-black tracking-widest uppercase">Initialisation...</div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center text-white">
      <p className="mb-4">Projet introuvable dans la base de données.</p>
      <Link to="/projects" className="text-[#CE0033] font-bold underline">Retourner aux dépôts</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050506] text-slate-200 font-sans pb-20">
      {/* HEADER NAVIGATION */}
      <nav className="p-6 border-b border-white/5 bg-[#050506]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Retour
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#CE0033]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Archive Sécurisée</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-12 px-6">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* COLONNE GAUCHE : INFOS PRINCIPALES */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CE0033]/10 border border-[#CE0033]/20 text-[#CE0033] text-[10px] font-black uppercase tracking-widest">
                <Database size={12} /> {project.categorie || 'Logiciel'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
                {project.titre}
              </h1>
              <div className="flex items-center gap-6 text-slate-500">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[#CE0033]" />
                  <span className="text-xs font-bold uppercase tracking-widest">{project.auteurNom || 'Anonyme'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {new Date(project.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem]">
              <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-3">
                <Code2 size={18} className="text-[#CE0033]" /> Documentation Technique
              </h3>
              <p className="text-slate-400 leading-relaxed text-lg font-medium">
                {project.description || "Aucune description détaillée n'a été fournie pour ce projet."}
              </p>
            </section>

            {/* STACK TECHNIQUE */}
            <section>
              <h3 className="text-white font-black uppercase tracking-widest text-xs mb-4 ml-2">Technologies Déployées</h3>
              <div className="flex flex-wrap gap-3">
                {project.technologies && project.technologies.map((tech, idx) => (
                  <span key={idx} className="px-6 py-3 bg-[#0A0A0B] border border-white/10 rounded-2xl text-sm font-black text-slate-300 uppercase tracking-tighter hover:border-[#CE0033]/50 transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* COLONNE DROITE : ACTIONS & STATS */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-[#111112] to-[#050506] border border-white/5 p-8 rounded-[2.5rem] sticky top-32">
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Poids de l'archive</p>
                  <p className="text-3xl font-black text-white italic">{project.taille || '0.0 MB'}</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-[#CE0033] hover:bg-[#E60039] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#CE0033]/20 hover:-translate-y-1"
                  >
                    <Download size={20} /> Télécharger ZIP
                  </button>
                  
                  <button className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all">
                    <ExternalLink size={18} /> Voir la Démo
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-[#CE0033] flex items-center justify-center text-white font-black uppercase">
                        {project.auteurNom?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter">Propriété de</p>
                        <p className="text-[11px] text-slate-500 font-bold">Simplon Code Hub</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}