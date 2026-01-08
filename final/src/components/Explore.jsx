import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminSidebar, UserSidebar } from './Sidebar';
import { 
  Search, Filter, Download, Eye, Calendar, User, 
  Loader2, Code, RefreshCw, AlertCircle, Layers 
} from 'lucide-react';

export default function Explore() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('explore');
  const [currentUser, setCurrentUser] = useState(null);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtre, setFiltre] = useState("");
  const [filtreTechno, setFiltreTechno] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);
    fetchProjets();
  }, []);

  // --- APPELS API (Logique inchangée) ---
  const fetchProjets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      if (!response.ok) throw new Error('Erreur lors du chargement des projets');
      const data = await response.json();
      setProjets(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Impossible de charger les projets");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (projetId, projetTitre) => {
    if (downloadingId === projetId) return;
    setDownloadingId(projetId);
    try {
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      const userId = user?.id || 'anonymous';
      const downloadUrl = `http://localhost:5000/api/download-file/${projetId}?user_id=${userId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeTitle = (projetTitre || 'projet').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeTitle}.zip`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 100);
      if (user?.id) {
        try {
          await fetch('http://localhost:5000/api/record-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, project_id: projetId })
          });
        } catch (err) { console.log(err); }
      }
    } catch (error) {
      window.open(`http://localhost:5000/api/download-file/${projetId}`, '_blank');
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  // --- LOGIQUE DE FILTRAGE (Inchangée) ---
  const projetsFiltres = projets.filter((p) => {
    const searchLower = filtre.toLowerCase();
    return (
      (p.titre || "").toLowerCase().includes(searchLower) ||
      (p.description || "").toLowerCase().includes(searchLower) ||
      (p.auteurNom || "").toLowerCase().includes(searchLower) ||
      (p.technologies || []).some(tech => tech.toLowerCase().includes(searchLower))
    );
  }).filter((p) => filtreTechno ? (p.technologies || []).some(t => t.toLowerCase() === filtreTechno.toLowerCase()) : true);

  const technologiesUniques = [...new Set(projets.flatMap(p => Array.isArray(p.technologies) ? p.technologies : []))].filter(t => t && t.trim() !== "");

  const renderSidebar = () => {
    const isAdmin = currentUser?.role === "admin" || currentUser?.matricule?.startsWith("AD-");
    return isAdmin ? <AdminSidebar activeTab="explore" /> : <UserSidebar activeTab="explore" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {renderSidebar()}
      
      <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* --- HEADER --- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Explorez les Projets
              </h1>
              <p className="text-gray-400 mt-1">
                {projets.length} projets disponibles • Filtrez par technologie
              </p>
            </div>

            <div className="relative w-full md:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                className="w-full bg-gray-800 border border-gray-700 px-10 py-2.5 rounded-lg focus:border-[#CE0033] outline-none transition-colors placeholder:text-gray-500 text-sm"
                value={filtre}
                onChange={(e) => setFiltre(e.target.value)}
              />
            </div>
          </div>

          {/* --- FILTRES BAR --- */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-[#CE0033]">
                <Filter size={16} /> Technologies
              </div>
              
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button 
                  onClick={() => setFiltreTechno("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !filtreTechno ? 'bg-[#CE0033] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Tous ({projets.length})
                </button>
                {technologiesUniques.map((tech, i) => (
                  <button 
                    key={i}
                    onClick={() => setFiltreTechno(tech)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      filtreTechno === tech ? 'bg-[#CE0033] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchProjets}
                disabled={loading}
                className="ml-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>

          {/* --- CONTENT --- */}
          {loading ? (
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[#CE0033] mb-4" size={32} />
              <p className="text-gray-500 text-sm">Chargement des projets...</p>
            </div>
          ) : projetsFiltres.length === 0 ? (
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-10 text-center">
              <Code size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500 italic mb-2">Aucun projet trouvé</p>
              <p className="text-gray-600 text-sm">Essayez avec d'autres termes de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projetsFiltres.map((projet) => (
                <div 
                  key={projet.id} 
                  className="bg-gray-900/50 border border-gray-800 hover:border-[#CE0033]/30 rounded-xl overflow-hidden transition-colors flex flex-col"
                >
                  {/* Card Head */}
                  <div className="p-5 pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-3 bg-gray-800 rounded-lg text-[#CE0033]">
                        <Layers size={20} />
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-gray-800 text-gray-400 rounded">
                        {projet.categorie || 'General'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white line-clamp-1 mb-2">
                      {projet.titre}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User size={14} className="text-[#CE0033]" />
                      <span className="truncate">{projet.auteurNom || 'Anonyme'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-5 flex-1">
                    <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed mb-3">
                      {projet.description || "Exploration technique de solutions logicielles et partage de connaissances."}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {(projet.technologies || []).slice(0, 3).map((tech, i) => (
                        <span key={i} className="text-xs text-gray-400 px-2 py-1 bg-gray-800 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} /> 
                        {new Date(projet.dateCreation).toLocaleDateString()}
                      </div>
                      <div className="font-mono text-xs">{projet.taille || '---'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Link 
                        to={`/project/${projet.id}`}
                        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye size={16} /> Voir
                      </Link>
                      
                      <button 
                        onClick={() => handleDownload(projet.id, projet.titre)}
                        disabled={!projet.filePath || downloadingId === projet.id}
                        className="flex items-center justify-center gap-2 bg-[#CE0033] hover:bg-[#E60039] text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {downloadingId === projet.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}