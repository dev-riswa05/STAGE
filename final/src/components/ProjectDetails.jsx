import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Download, Calendar, Tag, User, 
  Database, Code2, ExternalLink, ShieldCheck, Clock,
  Loader2, AlertCircle, FileText, Layers, HardDrive,
  ChevronRight, CheckCircle, Globe, Cpu, Mail
} from 'lucide-react';
import { AdminSidebar, UserSidebar } from './Sidebar';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);
    
    // Charger les détails du projet
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Votre backend renvoie un tableau directement, pas un objet avec propriété "projects"
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Données projets:", data); // Debug
      
      // Chercher le projet par ID
      const found = Array.isArray(data) 
        ? data.find(p => p.id === id)
        : null;
      
      if (found) {
        setProject(found);
      } else {
        setError("Projet introuvable");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les détails du projet");
    } finally {
      setLoading(false);
    }
  };

  // Téléchargement automatique sans confirmation
  const handleDownload = async () => {
    if (!project || downloading) return;
    
    setDownloading(true);
    setError('');
    
    try {
      // Récupérer l'utilisateur pour tracking
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      const userId = user?.id || 'anonymous';
      
      // Créer l'URL avec l'ID utilisateur pour tracking
      const downloadUrl = `${API_BASE_URL}/api/download-file/${project.id}?user_id=${userId}`;
      
      // Méthode 1: Lien invisible (téléchargement automatique)
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Nom de fichier sécurisé
      const safeTitle = (project.titre || 'projet')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      link.download = `${safeTitle}.zip`;
      
      // Rendre le lien invisible
      link.style.display = 'none';
      link.style.position = 'absolute';
      link.style.left = '-9999px';
      
      // Ajouter au DOM et déclencher
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
      // Log du téléchargement
      console.log(`Téléchargement lancé: ${project.titre}`);
      
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      setError('Erreur lors du téléchargement');
      
      // Fallback: méthode simple
      setTimeout(() => {
        window.open(`${API_BASE_URL}/api/download-file/${project.id}`, '_blank');
      }, 500);
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  // Rendu de la sidebar
  const renderSidebar = () => {
    if (!currentUser) return <UserSidebar activeTab="explore" />;
    
    const isAdmin = currentUser?.role === 'admin' || 
                   (currentUser?.matricule && currentUser.matricule.startsWith('AD-'));
    
    if (isAdmin) {
      return <AdminSidebar activeTab="explore" />;
    } else {
      return <UserSidebar activeTab="explore" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex">
        {renderSidebar()}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#CE0033] mx-auto mb-4" size={40} />
            <p className="text-gray-400">Chargement des détails du projet...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex">
        {renderSidebar()}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertCircle size={60} className="text-yellow-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Projet introuvable</h2>
            <p className="text-gray-400 mb-6">
              {error || "Le projet que vous cherchez n'existe pas ou a été supprimé."}
            </p>
            <button 
              onClick={() => navigate('/explore')} 
              className="px-6 py-3 bg-[#CE0033] hover:bg-[#A60029] text-white font-bold rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={20} /> Retour à l'explorateur
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">
      {renderSidebar()}
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-sm hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/explore')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Retour</span>
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#CE0033]" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Archive Sécurisée
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-3 shadow-lg ${
                downloading
                  ? 'bg-[#CE0033] text-white'
                  : 'bg-[#CE0033] hover:bg-[#A60029] text-white hover:shadow-xl hover:shadow-[#CE0033]/20'
              }`}
            >
              {downloading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Télécharger ({project.taille || 'ZIP'})</span>
                </>
              )}
            </button>
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Colonne gauche: Informations principales */}
            <div className="lg:col-span-2 space-y-8">
              {/* En-tête */}
              <section className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#CE0033]/10 border border-[#CE0033]/20 text-[#CE0033] text-xs font-bold uppercase rounded-full">
                    <Database size={14} /> {project.categorie || 'Non catégorisé'}
                  </span>
                  {project.filePath && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase rounded-full">
                      <HardDrive size={14} /> Archive disponible
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  {project.titre}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-400">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-[#CE0033]" />
                    <span className="font-medium">{project.auteurNom || 'Auteur inconnu'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#CE0033]" />
                    <span className="font-medium">
                      {project.dateCreation 
                        ? new Date(project.dateCreation).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'Date inconnue'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#CE0033]" />
                    <span className="font-medium">
                      {project.dateCreation 
                        ? new Date(project.dateCreation).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : ''
                      }
                    </span>
                  </div>
                </div>
              </section>

              {/* Description */}
              <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#CE0033] flex items-center gap-3">
                  <FileText size={20} />
                  Description du projet
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                    {project.description || "Aucune description disponible."}
                  </p>
                </div>
              </section>

              {/* Technologies */}
              <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#CE0033] flex items-center gap-3">
                  <Cpu size={20} />
                  Technologies utilisées
                </h2>
                <div className="flex flex-wrap gap-3">
                  {(project.technologies && project.technologies.length > 0) ? (
                    project.technologies.map((tech, index) => (
                      <span 
                        key={index}
                        className="px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-medium hover:border-[#CE0033]/50 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Code2 size={16} />
                        {tech}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucune technologie spécifiée</p>
                  )}
                </div>
              </section>

              {/* Informations supplémentaires */}
              <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#CE0033] flex items-center gap-3">
                  <Layers size={20} />
                  Informations techniques
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Taille du fichier</h3>
                      <p className="text-lg font-bold flex items-center gap-2">
                        <HardDrive size={18} className="text-blue-400" />
                        {project.taille || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Catégorie</h3>
                      <p className="text-lg font-bold">{project.categorie || 'Non catégorisé'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">ID du projet</h3>
                      <p className="text-sm font-mono text-gray-300 truncate">{project.id}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Date de création</h3>
                      <p className="text-sm">
                        {project.dateCreation 
                          ? new Date(project.dateCreation).toLocaleString('fr-FR')
                          : 'Date inconnue'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Colonne droite: Actions et métadonnées */}
            <div className="space-y-6">
              {/* Carte d'actions */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 lg:sticky lg:top-8">
                <h3 className="text-lg font-bold mb-6 text-[#CE0033]">Actions</h3>
                
                <div className="space-y-4">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
                      downloading
                        ? 'bg-[#CE0033] text-white'
                        : 'bg-[#CE0033] hover:bg-[#A60029] text-white'
                    }`}
                  >
                    {downloading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Téléchargement en cours...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        Télécharger l'archive
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center pt-2">
                    Le téléchargement démarre automatiquement
                  </div>
                </div>

                {/* Informations sur l'auteur */}
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <h4 className="text-sm font-bold mb-4 text-gray-400">À propos de l'auteur</h4>
                  <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-[#CE0033] flex items-center justify-center text-white font-bold text-lg">
                      {project.auteurNom?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="font-bold">{project.auteurNom || 'Anonyme'}</p>
                      <p className="text-sm text-gray-400">Auteur du projet</p>
                    </div>
                  </div>
                </div>

                {/* Métadonnées */}
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <h4 className="text-sm font-bold mb-4 text-gray-400">Métadonnées</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Statut</span>
                      <span className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={14} />
                        <span className="text-sm font-medium">Validé</span>
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Visibilité</span>
                      <span className="text-sm font-medium">Publique</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Format</span>
                      <span className="text-sm font-medium">Archive ZIP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note sur le téléchargement */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-400 mb-1">Téléchargement sécurisé</p>
                    <p className="text-sm text-blue-300/80">
                      Le fichier est vérifié et sécurisé. Le téléchargement démarre automatiquement.
                    </p>
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