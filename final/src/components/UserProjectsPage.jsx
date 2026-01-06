// components/UserProjectsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { 
  Folder, Download, Calendar, Plus, Trash2, 
  Layout, Server, Globe, Smartphone, Box, 
  Shield, ChevronRight, Loader2 
} from 'lucide-react';

export default function UserProjectsPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL de ton backend Flask
  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // 1. Récupérer l'utilisateur connecté (seule info restant en LocalStorage pour la session)
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);

    if (user && user.id) {
      fetchUserProjects(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Charger les projets depuis la Base de Données (Flask)
  const fetchUserProjects = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/my-downloads/${userId}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération");
      const data = await response.json();
      setUserProjects(data.projects || []);
    } catch (error) {
      console.error("Erreur API:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Téléchargement réel du fichier ZIP depuis le serveur
  const handleDownload = async (project) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download-file/${project.id}`);
      if (!res.ok) throw new Error('Fichier introuvable sur le serveur');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.titre || 'archive'}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
  };

  // 4. Suppression dans la base de données
  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce projet définitivement ?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setUserProjects(prev => prev.filter(p => p.id !== projectId));
        }
      } catch (e) {
        alert("Erreur lors de la suppression sur le serveur");
      }
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      frontend: <Layout size={20} className="text-blue-400" />,
      backend: <Server size={20} className="text-emerald-400" />,
      fullstack: <Globe size={20} className="text-purple-400" />,
      mobile: <Smartphone size={20} className="text-amber-400" />
    };
    return icons[cat?.toLowerCase()] || <Box size={20} className="text-gray-400" />;
  };

  const renderSidebar = () => {
    switch (currentUser?.role) {
      case 'administrateur': return <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
      default: return <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-slate-200 flex font-sans">
      {renderSidebar()}
      
      <main className="flex-1 lg:ml-72 p-6 lg:p-12 pt-24 lg:pt-12 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-16">
          
          {/* Header Profil */}
          <section className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-12">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-gradient-to-tr from-[#CE0033] to-[#800020] rounded-[2rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-[#CE0033]/20">
                {currentUser?.prenom?.[0] || 'U'}{currentUser?.nom?.[0] || ''}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                    {currentUser?.prenom} {currentUser?.nom}
                  </h1>
                  <Shield size={18} className="text-[#CE0033]" />
                </div>
                <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">
                  Compte vérifié : <span className="text-slate-300">@{currentUser?.pseudo}</span>
                </p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 px-8 py-4 rounded-3xl text-center">
              <p className="text-3xl font-black text-white">{userProjects.length}</p>
              <p className="text-[10px] uppercase font-black text-[#CE0033] tracking-[0.2em]">Dépôts Cloud</p>
            </div>
          </section>

          {/* Liste des Dépôts */}
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Base de données personnelle</h2>
                <div className="h-1 w-12 bg-[#CE0033]"></div>
              </div>
              
              <Link to="/submission" className="bg-white text-black px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-[#CE0033] hover:text-white transition-all transform hover:-translate-y-1">
                <Plus size={16} /> Nouveau dépôt
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#CE0033] mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Synchronisation avec le serveur...</p>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="py-24 text-center bg-[#0A0A0B] rounded-[2rem] border border-white/5">
                <Folder size={48} className="mx-auto mb-4 text-slate-800" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucun projet trouvé sur votre compte</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {userProjects.map((project) => (
                  <div key={project.id} className="group bg-[#0A0A0B] border border-white/5 hover:border-[#CE0033]/40 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 transition-all duration-300">
                    
                    <div className="w-14 h-14 shrink-0 bg-black rounded-2xl flex items-center justify-center border border-white/5 group-hover:shadow-[0_0_15px_rgba(206,0,51,0.1)] transition-all">
                      {getCategoryIcon(project.categorie)}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-lg font-black text-white uppercase italic tracking-tight group-hover:text-[#CE0033] transition-colors">
                        {project.titre}
                      </h3>
                      <div className="flex items-center justify-center md:justify-start gap-4 mt-1">
                         <span className="text-[10px] text-slate-500 font-bold uppercase">{project.taille || "0 MB"}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                         <span className="text-[10px] text-slate-500 font-bold uppercase">
                           {new Date(project.dateCreation).toLocaleDateString()}
                         </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Link to={`/project/${project.id}`} className="flex-1 md:flex-none px-6 py-3 bg-white/5 hover:bg-white hover:text-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        Détails <ChevronRight size={14} />
                      </Link>
                      
                      <button onClick={() => handleDownload(project)} className="p-3 bg-[#CE0033] hover:bg-[#E60039] text-white rounded-xl transition-all shadow-lg shadow-[#CE0033]/20">
                        <Download size={18} />
                      </button>

                      <button onClick={() => handleDeleteProject(project.id)} className="p-3 text-slate-700 hover:text-red-500 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}