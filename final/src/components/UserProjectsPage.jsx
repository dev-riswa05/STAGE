import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { 
  Folder, Download, Calendar, Plus, Trash2, 
  Layout, Server, Globe, Smartphone, Box, 
  Shield, ChevronRight, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

export default function UserProjectsPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    fetchUserProjects(user.id);
  }, [navigate]);

  const fetchUserProjects = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/projects/user/${userId}`);
      if (!response.ok) throw new Error(`Erreur ${response.status}: Impossible de charger vos projets`);
      const data = await response.json();
      
      const formattedProjects = data.map(project => ({
        id: project.id,
        titre: project.titre || "Sans titre",
        description: project.description || "",
        categorie: project.categorie || "non spécifié",
        technologies: project.technologies || [],
        dateCreation: project.dateCreation || new Date().toISOString(),
        taille: project.taille || "0 MB",
        auteurNom: project.auteurNom || currentUser?.pseudo || "Anonyme",
      }));
      setUserProjects(formattedProjects);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = () => currentUser?.id && fetchUserProjects(currentUser.id);

  const handleDownload = async (project) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download-file/${project.id}?user_id=${currentUser?.id || 'anonymous'}`);
      if (!res.ok) throw new Error('Fichier introuvable');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.titre}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Supprimer ce projet définitivement ?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/project/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setUserProjects(prev => prev.filter(p => p.id !== projectId));
      }
    } catch (e) {
      alert("Erreur : " + e.message);
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      frontend: <Layout size={22} className="text-blue-400" />,
      backend: <Server size={22} className="text-emerald-400" />,
      fullstack: <Globe size={22} className="text-[#CE0033]" />,
      mobile: <Smartphone size={22} className="text-amber-400" />,
    };
    return icons[cat?.toLowerCase()] || <Box size={22} className="text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {currentUser?.role === 'admin' ? <AdminSidebar activeTab="projects" /> : <UserSidebar activeTab="projects" />}
      
      <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* --- PROFILE HEADER --- */}
          <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-24 h-24 bg-gradient-to-br from-[#CE0033] to-[#600018] rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  {currentUser?.pseudo?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">
                      {currentUser?.pseudo || 'Utilisateur'}
                    </h1>
                    {currentUser?.role === 'admin' && <Shield size={20} className="text-[#CE0033]" />}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Matricule: {currentUser?.matricule || 'Non spécifié'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-gray-800 border border-gray-700 px-6 py-4 rounded-xl text-center min-w-[120px]">
                  <p className="text-3xl font-black text-white mb-1">{userProjects.length}</p>
                  <p className="text-xs font-bold text-[#CE0033] uppercase">Dépôts</p>
                </div>
              </div>
            </div>
          </section>

          {/* --- PROJECTS LIST --- */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="w-2 h-6 bg-[#CE0033] rounded-full"></span>
                  Mes travaux publiés
                </h2>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={refreshProjects}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  Actualiser
                </button>
                <Link to="/submission" className="bg-[#CE0033] hover:bg-[#E60039] text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                  <Plus size={18} /> Nouveau dépôt
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-[#CE0033] mb-4" size={32} />
                <p className="text-gray-500 text-sm">Chargement des projets...</p>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-10 text-center">
                <Folder size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500 italic mb-2">Aucun projet trouvé</p>
                <Link to="/submission" className="inline-flex items-center gap-2 text-[#CE0033] hover:text-white font-medium text-sm">
                  Créer votre premier projet <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {userProjects.map((project) => (
                  <div key={project.id} className="bg-gray-900/50 border border-gray-800 hover:border-[#CE0033]/30 rounded-xl p-5 flex flex-col md:flex-row items-center gap-5 transition-colors">
                    
                    {/* Icone */}
                    <div className="w-14 h-14 shrink-0 bg-gray-800 rounded-xl flex items-center justify-center">
                      {getCategoryIcon(project.categorie)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <h3 className="text-lg font-bold text-white hover:text-[#CE0033] transition-colors">
                          {project.titre}
                        </h3>
                        <span className="px-2 py-1 bg-gray-800 text-xs font-medium text-gray-400 rounded w-fit mx-auto md:mx-0">
                          {project.categorie}
                        </span>
                      </div>
                      
                      <p className="text-gray-500 text-sm line-clamp-1">
                        {project.description || "Aucune description fournie."}
                      </p>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#CE0033]" /> 
                          {new Date(project.dateCreation).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {project.taille}
                        </span>
                        
                        {/* Tags Tech */}
                        <div className="flex gap-1">
                          {project.technologies?.slice(0, 2).map((tech, i) => (
                            <span key={i} className="text-xs text-blue-400 px-1.5 bg-blue-400/10 rounded">#{tech}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-800">
                      <Link 
                        to={`/project/${project.id}`} 
                        className="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors text-center"
                      >
                        Explorer
                      </Link>
                      
                      <button 
                        onClick={() => handleDownload(project)} 
                        className="p-2 bg-gray-800 hover:bg-[#CE0033] text-gray-400 hover:text-white rounded-lg transition-colors"
                      >
                        <Download size={18} />
                      </button>

                      <button 
                        onClick={() => handleDeleteProject(project.id)} 
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors"
                      >
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