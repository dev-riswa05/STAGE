import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { ArrowLeft, Download, Folder, Calendar, User, Layers, Loader2, AlertCircle } from 'lucide-react';

export default function ProjectProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = 'http://localhost:5000';

  useEffect(() => {
    // 1. Récupération de l'utilisateur
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);

    // 2. Chargement du projet via l'API
    const fetchProject = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${baseUrl}/api/projects/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Projet introuvable');
          }
          throw new Error('Erreur de chargement');
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error("Erreur:", error);
        setError(error.message);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // --- TÉLÉCHARGEMENT AUTOMATIQUE SANS CONFIRMATION ---
  const handleDownload = async () => {
    if (!project) return;
    
    if (!currentUser) {
      setError('Vous devez être connecté pour télécharger');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (downloading) return; // Éviter les doubles clics
    
    setDownloading(true);
    setError('');
    
    try {
      // URL avec l'ID utilisateur pour enregistrer le téléchargement
      const downloadUrl = `${baseUrl}/api/download-file/${project.id}?user_id=${currentUser.id}`;
      
      // Méthode 1: Créer un lien invisible (téléchargement automatique)
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Suggérer un nom de fichier
      const safeTitle = project.titre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeTitle}.zip`;
      
      // Style invisible
      link.style.display = 'none';
      link.style.position = 'absolute';
      link.style.left = '-9999px';
      
      // Ajouter au DOM
      document.body.appendChild(link);
      
      // Déclencher le téléchargement
      link.click();
      
      // Nettoyer après un court délai
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);
      
      // Optionnel: Envoyer une notification au backend
      try {
        await fetch(`${baseUrl}/api/download-file/${project.id}`, {
          method: 'HEAD',
          headers: {
            'X-User-ID': currentUser.id
          }
        });
      } catch (trackError) {
        console.log("Tracking non essentiel échoué:", trackError);
      }
      
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      setError('Erreur lors du téléchargement');
      
      // Fallback: Ouvrir dans un nouvel onglet
      setTimeout(() => {
        window.open(`${baseUrl}/api/download-file/${project.id}?user_id=${currentUser.id}`, '_blank');
      }, 100);
      
    } finally {
      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setDownloading(false);
      }, 2000);
    }
  };

  // Fonction de téléchargement alternative avec fetch (plus robuste)
  const handleDownloadWithFetch = async () => {
    if (!project || !currentUser || downloading) return;
    
    setDownloading(true);
    setError('');
    
    try {
      const response = await fetch(`${baseUrl}/api/download-file/${project.id}?user_id=${currentUser.id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      // Récupérer le blob
      const blob = await response.blob();
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien pour le téléchargement
      const link = document.createElement('a');
      link.href = url;
      
      // Obtenir le nom de fichier
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${project.titre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      link.style.display = 'none';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError('Échec du téléchargement. Tentative alternative...');
      
      // Utiliser la méthode simple comme fallback
      setTimeout(() => handleDownload(), 500);
      
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const renderSidebar = () => {
    if (!currentUser) return <UserSidebar activeTab="explore" />;
    
    // Vérifier si c'est un administrateur
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#CE0033]" size={40} />
        <span className="ml-3 text-gray-400">Chargement du projet...</span>
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
        <div className="max-w-6xl mx-auto">
          
          {/* Messages d'erreur */}
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

          {/* Header Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Retour</span>
            </button>
            
            <button 
              onClick={handleDownload}
              disabled={downloading || !currentUser}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-3 shadow-lg ${
                downloading
                  ? 'bg-[#CE0033] text-white'
                  : !currentUser
                  ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-[#CE0033] hover:bg-[#A60029] text-white hover:shadow-xl hover:shadow-[#CE0033]/20'
              }`}
            >
              {downloading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Téléchargement en cours...</span>
                </>
              ) : !currentUser ? (
                <>
                  <Download size={20} />
                  <span>Connectez-vous pour télécharger</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Télécharger le projet ({project.taille || 'ZIP'})</span>
                </>
              )}
            </button>
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Colonne gauche: Contenu principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Titre et infos */}
              <section className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {project.titre}
                </h1>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg">
                    <User size={16} className="text-[#CE0033]" />
                    <span className="text-sm">{project.auteurNom || 'Auteur inconnu'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg">
                    <Calendar size={16} className="text-[#CE0033]" />
                    <span className="text-sm">
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
                  
                  {project.categorie && (
                    <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg">
                      <Layers size={16} className="text-[#CE0033]" />
                      <span className="text-sm">{project.categorie}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Description */}
              <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#CE0033]">Description</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {project.description || "Aucune description disponible pour ce projet."}
                  </p>
                </div>
              </section>

              {/* Technologies */}
              <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#CE0033]">Technologies utilisées</h2>
                <div className="flex flex-wrap gap-3">
                  {(project.technologies || []).length > 0 ? (
                    project.technologies.map((tech, index) => (
                      <span 
                        key={index}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-medium hover:border-[#CE0033]/50 transition-colors"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucune technologie spécifiée</p>
                  )}
                </div>
              </section>

              {/* Images */}
              {(project.images && project.images.length > 0) && (
                <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4 text-[#CE0033]">Captures d'écran</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.images.map((img, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border border-gray-700">
                        <img 
                          src={img.url} 
                          alt={`Capture ${index + 1}`}
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x200/1a1a1a/666666?text=Image+non+disponible";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Colonne droite: Informations */}
            <div className="space-y-6">
              {/* Informations techniques */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 lg:sticky lg:top-8">
                <h3 className="text-lg font-bold mb-4 text-[#CE0033]">Informations techniques</h3>
                
                <div className="space-y-6">
                  {/* Taille */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Taille du fichier</p>
                    <p className="text-lg font-bold">{project.taille || 'N/A'}</p>
                  </div>
                  
                  {/* Type de fichier */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Format</p>
                    <p className="text-lg font-bold">Archive ZIP</p>
                  </div>
                  
                  {/* Statut */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Statut</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="font-medium">Validé</span>
                    </div>
                  </div>
                  
                  {/* Note */}
                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-sm text-gray-400 italic">
                      Le téléchargement démarre automatiquement sans confirmation.
                      Vérifiez votre dossier de téléchargements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton de téléchargement alternatif */}
              <button
                onClick={handleDownloadWithFetch}
                disabled={downloading || !currentUser}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  downloading
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : !currentUser
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-[#CE0033] hover:bg-[#A60029] text-white'
                }`}
              >
                {downloading ? 'Téléchargement...' : 'Télécharger (méthode alternative)'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}