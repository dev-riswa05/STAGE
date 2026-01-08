import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserSidebar } from "./Sidebar";
import { Folder, Plus, LayoutGrid, ChevronRight, Loader2, Activity, ShieldCheck } from 'lucide-react';

export default function DashboardUser() {
  const [userProjects, setUserProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    
    if (!user || (user.role !== "stagiaire" && !user.matricule?.startsWith("MAT-"))) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
    loadUserProjects(user.id);
  }, [navigate]);

  const loadUserProjects = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/projects/user/${userId}`);
      if (res.ok) {
        const projects = await res.json();
        setUserProjects(projects);
      }
    } catch (error) {
      console.error("Erreur chargement projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* Sidebar - Assurez-vous qu'elle gère son propre état mobile ou qu'elle soit cachée */}
      <UserSidebar activeTab="dashboard" />
      
      {/* --- MAIN CONTENT --- */}
      {/* Ajout de pt-20 pour laisser de la place au menu mobile si présent, et pb-10 pour l'espace en bas */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 pt-24 md:pt-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          
          {/* --- HEADER SECTION --- */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                Tableau de Bord
              </h1>
              <p className="text-sm text-gray-400 truncate max-w-[300px] sm:max-w-none">
                <span className="text-[#CE0033] font-medium">
                  {currentUser?.pseudo || currentUser?.email}
                </span> 
                <span className="hidden xs:inline"> • Matricule: {currentUser?.matricule}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-3 py-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
              >
                Déconnexion
              </button>
              <Link 
                to="/submission" 
                className="flex-1 sm:flex-none bg-[#CE0033] hover:bg-[#E60039] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-transform active:scale-95"
              >
                <Plus size={16} /> <span className="whitespace-nowrap">Nouveau Projet</span>
              </Link>
            </div>
          </div>

          {/* --- STATS CARDS --- */}
          {/* grid-cols-1 sur mobile, grid-cols-2 sur tablette, grid-cols-3 sur desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
              <div className="p-3 bg-gray-800 rounded-xl text-[#CE0033] shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Projets Actifs</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">
                    {loading ? <Loader2 className="animate-spin text-[#CE0033]" size={20} /> : userProjects.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
              <div className="p-3 bg-gray-800 rounded-xl text-blue-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Identifiant</h3>
                <p className="text-lg font-black text-white truncate">{currentUser?.matricule || 'N/A'}</p>
              </div>
            </div>

            {/* Cette carte s'affiche sur toute la largeur sur tablette (sm) mais revient en auto sur desktop */}
            <div className="sm:col-span-2 lg:col-span-1 bg-gray-900/50 p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Session Active</h3>
                <p className="text-xs text-gray-400 font-medium">Rang: {currentUser?.role}</p>
              </div>
            </div>
          </div>

          {/* --- RECENT PROJECTS TABLE --- */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/20">
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <LayoutGrid size={18} className="text-[#CE0033]" /> 
                Travaux Récents
              </h3>
              <Link 
                to="/user-projects" 
                className="text-xs font-bold text-[#CE0033] hover:text-[#E60039] transition-colors"
              >
                Voir tout
              </Link>
            </div>

            <div className="divide-y divide-gray-800">
              {loading ? (
                <div className="p-10 text-center">
                  <Loader2 className="animate-spin inline-block text-[#CE0033] mb-2" size={24} />
                  <p className="text-gray-500 text-xs uppercase tracking-widest">Chargement...</p>
                </div>
              ) : userProjects.length === 0 ? (
                <div className="p-10 text-center">
                  <Folder className="inline-block text-gray-700 mb-3" size={40} />
                  <p className="text-gray-500 text-sm italic mb-4">Votre portfolio est vide.</p>
                  <Link 
                    to="/submission" 
                    className="inline-flex items-center gap-2 text-[#CE0033] font-bold text-xs uppercase tracking-tighter"
                  >
                    Créer un projet <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                userProjects.slice(0, 5).map((project) => (
                  <Link 
                    key={project.id} 
                    to={`/project/${project.id}`}
                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="hidden xs:flex p-2.5 rounded-lg bg-gray-800 text-[#CE0033] shrink-0 group-hover:scale-110 transition-transform">
                        <Folder size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors truncate">
                          {project.titre}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 font-bold uppercase tracking-tighter">
                            {project.categorie || 'General'}
                          </span>
                          <span className="text-[10px] text-gray-600 font-medium">
                            {project.dateCreation ? new Date(project.dateCreation).toLocaleDateString('fr-FR') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-700 group-hover:text-[#CE0033] group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}