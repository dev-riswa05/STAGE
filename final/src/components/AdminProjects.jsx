// components/AdminProjects.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from "./Sidebar";
import { 
  Download, Trash2, Search, Folder, Plus, X, Upload, 
  FileText, Save, AlertCircle, Loader2, RefreshCw,
  User, Shield, Users, Eye, CheckCircle, XCircle
} from 'lucide-react';

export default function AdminProjects() {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  
  const iframeRef = useRef(null);

  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
    
    // Nettoyer les toasts après 3 secondes
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Erreur de synchronisation");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.auteurNom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour télécharger un projet
  const handleDownload = async (projectId, projectTitle) => {
    try {
      // Récupérer l'utilisateur courant
      const currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');
      const userId = currentUser?.id;
      
      // Construire l'URL de téléchargement
      let downloadUrl = `${API_BASE_URL}/api/download-file/${projectId}`;
      
      // Ajouter l'ID utilisateur si disponible
      if (userId) {
        downloadUrl += `?user_id=${userId}`;
        
        // Enregistrer le téléchargement dans la base de données
        try {
          await fetch(`${API_BASE_URL}/api/record-download`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              project_id: projectId
            })
          });
        } catch (error) {
          console.warn("Impossible d'enregistrer le téléchargement");
        }
      }
      
      // Méthode 1 : Créer un iframe caché pour le téléchargement
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      
      // Méthode alternative : Utiliser fetch et créer un blob
      setTimeout(() => {
        try {
          fetch(downloadUrl)
            .then(response => response.blob())
            .then(blob => {
              // Créer un lien temporaire
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = `${projectTitle.replace(/\s+/g, '_')}_${Date.now()}.zip`;
              document.body.appendChild(a);
              a.click();
              
              // Nettoyer
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              document.body.removeChild(iframe);
              
              // Afficher le toast de succès
              setToast({
                type: 'success',
                message: `Téléchargement de "${projectTitle}" lancé`,
                title: 'Succès'
              });
            })
            .catch(err => {
              // Si fetch échoue, utiliser l'iframe
              console.log('Utilisation de la méthode iframe');
              document.body.removeChild(iframe);
              
              setToast({
                type: 'success',
                message: `Téléchargement de "${projectTitle}" lancé dans un nouvel onglet`,
                title: 'Téléchargement'
              });
            });
        } catch (error) {
          // Fallback à l'ouverture directe
          window.open(downloadUrl, '_blank');
          
          setToast({
            type: 'info',
            message: `Ouverture du téléchargement dans un nouvel onglet`,
            title: 'Ouvrir'
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors du téléchargement du projet',
        title: 'Erreur'
      });
    }
  };

  // Fonction pour supprimer un projet
  const handleDelete = async (projectId, projectTitle) => {
    if (!confirmDelete || confirmDelete.id !== projectId) {
      setConfirmDelete({ id: projectId, title: projectTitle });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/project/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Supprimer le projet de la liste locale
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Réinitialiser la confirmation
        setConfirmDelete(null);
        
        // Afficher le toast de succès
        setToast({
          type: 'success',
          message: `Projet "${projectTitle}" supprimé avec succès`,
          title: 'Supprimé'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        type: 'error',
        message: `Erreur: ${error.message}`,
        title: 'Erreur'
      });
      setConfirmDelete(null);
    }
  };

  // Fonction pour visualiser les détails d'un projet
  const handleViewProject = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  // Fonction pour obtenir le nom du fichier à partir du chemin
  const getFileNameFromPath = (filePath) => {
    if (!filePath) return 'Aucun fichier';
    return filePath.split('/').pop() || filePath.split('\\').pop();
  };

  // Statistiques améliorées
  const stats = [
    { label: 'Total Projets', value: projects.length, color: 'text-white', icon: <Folder className="text-[#CE0033]" /> },
    { label: 'Frontend', value: projects.filter(p => p.categorie === 'frontend').length, color: 'text-blue-400', icon: <FileText className="text-blue-400" /> },
    { label: 'Backend', value: projects.filter(p => p.categorie === 'backend').length, color: 'text-emerald-400', icon: <FileText className="text-emerald-400" /> },
    { label: 'Fullstack', value: projects.filter(p => p.categorie === 'fullstack').length, color: 'text-purple-400', icon: <FileText className="text-purple-400" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* Sidebar à gauche */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        
        {/* Toast notifications */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-900/30 border-green-500/30 text-green-400' 
              : toast.type === 'error'
              ? 'bg-red-900/30 border-red-500/30 text-red-400'
              : 'bg-blue-900/30 border-blue-500/30 text-blue-400'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle size={20} />
              ) : toast.type === 'error' ? (
                <XCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <div>
                <p className="font-bold text-sm">{toast.title}</p>
                <p className="text-xs opacity-90">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToast(null)}
                className="ml-4 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Gestion des Projets</h1>
            <p className="text-gray-400 text-sm md:text-base mt-1">Administration des projets Simplon</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={loadProjects}
              className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-all"
              title="Actualiser"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-[#CE0033] hover:bg-[#E60039] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#CE0033]/20 transition-all"
            >
              <Plus size={18} /> Ajouter un projet
            </button>
          </div>
        </div>

        {/* Barre de Recherche */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom ou auteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white px-12 py-3.5 rounded-2xl focus:ring-2 focus:ring-[#CE0033]/50 outline-none transition-all placeholder:text-gray-500"
          />
        </div>

        {/* Cartes Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 hover:border-[#CE0033]/30 transition-all group">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-2.5 bg-gray-800 rounded-xl border border-gray-800">
                  {stat.icon}
                </div>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tableau des Projets */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-900/50 border-b border-gray-800 text-xs uppercase tracking-widest text-gray-400 font-bold">
                <tr>
                  <th className="px-6 py-4">Détails du Projet</th>
                  <th className="px-6 py-4">Auteur</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Fichier</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin inline-block text-[#CE0033] mb-2" size={24} />
                      <p className="text-gray-500 text-sm">Chargement des projets...</p>
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                      {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet disponible'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="group hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#CE0033]/10 flex items-center justify-center text-[#CE0033] font-bold border border-[#CE0033]/20">
                            <Folder size={18} />
                          </div>
                          <div>
                            <p 
                              className="font-bold text-sm md:text-base text-white hover:text-[#CE0033] cursor-pointer transition-colors"
                              onClick={() => handleViewProject(project.id)}
                            >
                              {project.titre}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {project.description || 'Pas de description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">{project.auteurNom || 'Inconnu'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                          project.categorie === 'frontend' ? 'bg-blue-500/10 text-blue-400' :
                          project.categorie === 'backend' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-purple-500/10 text-purple-400'
                        }`}>
                          {project.categorie}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {project.dateCreation ? new Date(project.dateCreation).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500 font-mono truncate max-w-[150px] block">
                          {getFileNameFromPath(project.filePath)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewProject(project.id)}
                            className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all border border-blue-400/20"
                            title="Voir les détails"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {project.filePath && (
                            <button 
                              onClick={() => handleDownload(project.id, project.titre)}
                              className="p-2.5 text-green-400 hover:bg-green-400/10 rounded-xl transition-all border border-green-400/20"
                              title="Télécharger le projet"
                            >
                              <Download size={18} />
                            </button>
                          )}
                          
                          {confirmDelete && confirmDelete.id === project.id ? (
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => handleDelete(project.id, project.titre)}
                                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmDelete({ id: project.id, title: project.titre })}
                              className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-red-400/20"
                              title="Supprimer le projet"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal d'ajout de projet */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={22} />
                Nouveau Projet
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                    Nom du projet *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Dashboard E-commerce" 
                    className="w-full bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl focus:border-[#CE0033] outline-none transition-colors text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                    Type de projet *
                  </label>
                  <select className="w-full bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl focus:border-[#CE0033] outline-none appearance-none cursor-pointer text-white">
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="fullstack">Fullstack</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                    Fichier source (ZIP) *
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-[#CE0033] transition-all cursor-pointer bg-gray-800/50">
                    <Upload className="mx-auto text-gray-600 mb-3" size={32} />
                    <p className="text-sm text-gray-500 font-medium">
                      Glisser votre archive ZIP ici<br/>
                      <span className="text-xs">ou cliquez pour sélectionner</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <button className="bg-[#CE0033] px-8 py-3 rounded-xl text-white font-bold hover:brightness-110 shadow-lg shadow-[#CE0033]/20 transition-all">
                  Publier le projet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Iframe caché pour les téléchargements */}
      <iframe 
        ref={iframeRef}
        style={{ display: 'none' }}
        title="download-frame"
      />
    </div>
  );
}