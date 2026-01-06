import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, Trash2, ExternalLink, HardDrive, Search, Loader2
} from 'lucide-react';
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const MyDownloads = () => {
  const [downloads, setDownloads] = useState([]); // Initialisé comme tableau vide
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const navigate = useNavigate();

  const baseUrl = 'http://localhost:5000';
  
  const currentUser = useMemo(() => 
    JSON.parse(localStorage.getItem('current_user') || 'null'), 
  []);

  // --- CHARGEMENT DEPUIS L'API ---
  const fetchDownloads = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`${baseUrl}/api/my-downloads/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        // CORRECTION : On extrait la clé "projects" du JSON backend
        setDownloads(data.projects || []);
      }
    } catch (err) {
      console.error('Erreur API:', err);
      setDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 10000); // Rafraîchir toutes les 10s
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // --- FILTRAGE ET TRI ---
  const filteredDownloads = useMemo(() => {
    // Sécurité : si downloads n'est pas un tableau, on retourne un tableau vide
    if (!Array.isArray(downloads)) return [];

    let result = [...downloads];
    if (searchQuery) {
      result = result.filter(d => 
        d.titre?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'recent') {
        result.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
    }
    if (sortBy === 'name') {
        result.sort((a, b) => (a.titre || "").localeCompare(b.titre || ""));
    }
    
    return result;
  }, [downloads, searchQuery, sortBy]);

  const getTimeAgo = (date) => {
    if(!date) return "Date inconnue";
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderSidebar = () => {
    const props = { activeTab: 'downloads' };
    // Correction : Suppression de FormateurSidebar
    if (currentUser?.role === 'admin') {
        return <AdminSidebar {...props} />;
    }
    return <UserSidebar {...props} />;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col md:flex-row">
      {renderSidebar()}

      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Download className="text-[#CE0033]" size={32} />
                Mes <span className="text-[#CE0033]">Téléchargements</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">Historique de vos acquisitions</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard label="Fichiers récupérés" value={Array.isArray(downloads) ? downloads.length : 0} icon={<Download className="text-[#CE0033]" />} />
            <StatCard label="Dernière activité" value={downloads.length > 0 ? "Aujourd'hui" : "Néant"} icon={<HardDrive className="text-blue-500" />} />
          </div>

          {/* Filtres */}
          <div className="bg-[#161618] border border-white/5 rounded-2xl p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text"
                  placeholder="Rechercher dans mes fichiers..."
                  className="w-full pl-10 pr-4 py-2 bg-black border border-white/5 rounded-xl outline-none focus:border-[#CE0033]/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="bg-black border border-white/5 p-2 rounded-xl text-xs font-bold uppercase"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Plus récent</option>
                <option value="name">Nom A-Z</option>
              </select>
            </div>
          </div>

          {/* Liste */}
          <div className="bg-[#161618] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="p-20 text-center"><Loader2 className="animate-spin inline-block text-[#CE0033]" /></div>
            ) : filteredDownloads.length === 0 ? (
              <div className="p-20 text-center opacity-20 font-black uppercase tracking-[0.5em]">Aucun fichier trouvé</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/50 text-[10px] uppercase font-black tracking-widest text-gray-500 border-b border-white/5">
                    <tr>
                      <th className="p-5">Projet</th>
                      <th className="p-5">Taille</th>
                      <th className="p-5">Date de téléchargement</th>
                      <th className="p-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDownloads.map((dl) => (
                      <tr key={dl.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <span className="font-bold text-sm uppercase group-hover:text-[#CE0033] transition-colors">{dl.titre}</span>
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded">{dl.taille || '0 MB'}</span>
                        </td>
                        <td className="p-5 text-xs text-gray-500">{getTimeAgo(dl.dateCreation)}</td>
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => window.open(`${baseUrl}/api/download-file/${dl.id}`, '_blank')}
                            className="p-2 bg-white/5 hover:bg-[#CE0033] rounded-lg transition-all"
                            title="Télécharger à nouveau"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-[#161618] border border-white/5 p-6 rounded-3xl flex items-center gap-4">
    <div className="p-4 bg-black rounded-2xl border border-white/5">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{label}</p>
      <p className="text-2xl font-black italic">{value}</p>
    </div>
  </div>
);

export default MyDownloads;