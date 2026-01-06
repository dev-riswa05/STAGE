// components/DashboardUser.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserSidebar } from "./Sidebar";
import { Download, Folder, Plus, LayoutGrid, ChevronRight } from 'lucide-react';

export default function DashboardUser() {
  const [userProjects, setUserProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    const projects = JSON.parse(localStorage.getItem('simplon_projects') || '[]');
    setCurrentUser(user);
    setUserProjects(projects.filter(p => p.auteurId === user?.id));
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#E4E4E7] flex font-sans">
      <UserSidebar activeTab="dashboard" />
      
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          
          {/* En-tête : Titres contrastés */}
          <div className="flex justify-between items-end mb-12">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-1">
                Bonjour, {currentUser?.prenom || 'Apprenant'}
              </h1>
              <p className="text-gray-500 text-sm font-medium tracking-wide">
                Ravi de vous revoir sur votre espace.
              </p>
            </div>
            <Link to="/submission" className="bg-[#CE0033] hover:bg-[#E60039] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
              <Plus size={16} /> Nouveau Projet
            </Link>
          </div>

          {/* Cartes de Stats : Labels aérés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-[#1A1A1C] p-7 rounded-2xl border border-white/5 shadow-sm">
              <p className="text-[#CE0033] text-[10px] uppercase font-black tracking-[0.2em] mb-2">Projets déposés</p>
              <p className="text-4xl font-black text-white italic tracking-tighter">{userProjects.length}</p>
            </div>
            <div className="bg-[#1A1A1C] p-7 rounded-2xl border border-white/5 shadow-sm">
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Statut Compte</p>
              <p className="text-2xl font-black text-white uppercase italic">{currentUser?.role || 'Apprenant'}</p>
            </div>
          </div>

          {/* Section Liste : Texte Hiérarchisé */}
          <div className="bg-[#1A1A1C] rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="font-black text-xs uppercase tracking-[0.15em] text-gray-300 flex items-center gap-2">
                <LayoutGrid size={14} className="text-[#CE0033]" /> Vos publications récentes
              </h2>
              <Link to="/user-projects" className="text-[10px] font-black uppercase tracking-widest text-[#CE0033] hover:text-white transition-colors">
                Voir tout
              </Link>
            </div>

            <div className="p-2">
              {userProjects.length === 0 ? (
                <div className="text-center py-12 text-gray-600 font-medium italic">
                  <p>Aucun projet publié pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {userProjects.slice(0, 4).map((project) => (
                    <Link 
                      key={project.id} 
                      to={`/project/${project.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-[#CE0033] border border-white/5 group-hover:border-[#CE0033]/50 transition-colors">
                          <Folder size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white uppercase tracking-tight group-hover:text-[#CE0033] transition-colors">
                            {project.titre}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
                            {project.categorie || 'Développement'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}