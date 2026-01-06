import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { ArrowLeft, Download, Folder, Calendar, User, Layers, Loader2 } from 'lucide-react';

export default function ProjectProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = 'http://localhost:5000';

  useEffect(() => {
    // 1. Récupération de l'utilisateur pour le suivi
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);

    // 2. Chargement du projet via l'API
    const fetchProject = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/projects/${id}`);
        if (!response.ok) throw new Error('Projet introuvable');
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error("Erreur:", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // --- LOGIQUE DE TÉLÉCHARGEMENT AVEC SUIVI ---
  const handleDownload = () => {
    if (!project || !currentUser) {
      alert("Vous devez être connecté pour télécharger ce projet.");
      return;
    }
    
    // On passe l'ID utilisateur au backend pour qu'il l'ajoute dans downloads.json
    const downloadUrl = `${baseUrl}/api/file/${project.id}?user_id=${currentUser.id}`;

    // Création du lien invisible pour déclencher le téléchargement sans quitter la page
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${project.titre}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Note : Le backend s'occupe de mettre à jour les statistiques et l'historique
  };

  const renderSidebar = () => {
    if (!currentUser) return <UserSidebar activeTab="explore" />;
    switch (currentUser.role) {
      case 'administrateur': return <AdminSidebar activeTab="explore" />;
      case 'formateur': return <FormateurSidebar activeTab="explore" />;
      default: return <UserSidebar activeTab="explore" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#CE0033]" size={40} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex">
        {renderSidebar()}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Folder size={60} className="text-white/10 mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Projet Introuvable</h2>
            <button onClick={() => navigate(-1)} className="text-[#CE0033] font-bold flex items-center gap-2 mx-auto mt-6">
              <ArrowLeft size={20} /> RETOURNER À L'EXPLORATEUR
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col lg:flex-row">
      {renderSidebar()}
      
      <main className="flex-1 p-6 lg:p-10 pt-24 lg:pt-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Action */}
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={handleDownload}
              className="bg-[#CE0033] hover:bg-[#A60029] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-lg shadow-[#CE0033]/20"
            >
              <Download size={18} /> Télécharger (.ZIP {project.taille})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Colonne Gauche: Contenu Principal */}
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h1 className="text-5xl font-black tracking-tighter mb-6 uppercase italic leading-none">
                  {project.titre}
                </h1>
                <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <User size={14} className="text-[#CE0033]" /> {project.auteurNom}
                  </span>
                  <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <Calendar size={14} className="text-[#CE0033]" /> {new Date(project.dateCreation).toLocaleDateString()}
                  </span>
                </div>
              </section>

              <section className="bg-[#161618] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CE0033] mb-6">Documentation technique</h3>
                <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                  {project.description}
                </p>
                
                <div className="mt-10 pt-8 border-t border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 italic">Technologies utilisées</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies?.map((t, i) => (
                      <span key={i} className="px-5 py-2.5 bg-black border border-white/5 text-[#CE0033] text-[10px] font-black rounded-xl uppercase tracking-tighter">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Galerie d'images provenant de l'API */}
              <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-4">
                  Captures d'écran <div className="h-px flex-1 bg-white/5"></div>
                </h3>
                {project.images && project.images.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {project.images.map((img, idx) => (
                      <div key={idx} className="rounded-3xl overflow-hidden border border-white/5 bg-[#161618] shadow-2xl">
                        <img 
                          src={`${baseUrl}${img.url}`} 
                          alt={`Preview ${idx}`} 
                          className="w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-500" 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 border border-dashed border-white/5 rounded-[2rem] text-center text-gray-700 font-black uppercase text-[10px] tracking-[0.4em]">
                    Aucun visuel attaché
                  </div>
                )}
              </section>
            </div>

            {/* Colonne Droite: Sidebar de données */}
            <div className="space-y-6">
              <div className="bg-[#161618] p-8 rounded-[2rem] border border-white/5 lg:sticky lg:top-10 shadow-2xl">
                <div className="space-y-8">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 block mb-3">Catégorie</label>
                    <div className="flex items-center gap-3 text-white font-black uppercase text-sm">
                      <Layers size={20} className="text-[#CE0033]" />
                      {project.categorie}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 block mb-3">Vérification</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Livrable validé</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase italic">
                        Ce dépôt contient les sources originales du projet. Toute utilisation doit respecter les droits d'auteur de Code Hub Simplon.
                      </p>
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