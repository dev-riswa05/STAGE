import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, HardDrive, Search, Loader2, RefreshCw, 
  Folder, Clock, ExternalLink, User, Layers, Calendar
} from 'lucide-react';
import { AdminSidebar, UserSidebar } from './Sidebar';
import { useNavigate } from 'react-router-dom';

const MyDownloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const navigate = useNavigate();

  const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
  
  const currentUser = useMemo(() => 
    JSON.parse(localStorage.getItem('current_user') || 'null'), 
  []);

  const fetchDownloads = async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/my-downloads/${currentUser.id}`);
      const data = await response.json();
      setDownloads(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDownloads();
  }, [currentUser?.id]);

  const handleDownload = async (projectId, projectTitle) => {
    if (downloadingId === projectId) return;
    setDownloadingId(projectId);
    try {
      const downloadUrl = `${baseUrl}/api/download-file/${projectId}?user_id=${currentUser.id}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${projectTitle || 'projet'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { console.error(err); } finally { setDownloadingId(null); }
  };

  const filteredDownloads = useMemo(() => {
    let result = [...downloads];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.titre?.toLowerCase().includes(q) || d.auteurNom?.toLowerCase().includes(q));
    }
    return result;
  }, [downloads, searchQuery]);

  const renderSidebar = () => {
    const props = { activeTab: 'downloads' };
    const isAdmin = currentUser?.role === 'admin' || currentUser?.matricule?.startsWith('AD-');
    return isAdmin ? <AdminSidebar {...props} /> : <UserSidebar {...props} />;
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {renderSidebar()}

      <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* --- HEADER --- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Mes Téléchargements
              </h1>
              <p className="text-gray-400 mt-1">
                Gérez et téléchargez à nouveau vos projets consultés
              </p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 px-10 py-2.5 rounded-lg focus:border-[#CE0033] outline-none transition-colors placeholder:text-gray-500 text-sm"
                />
              </div>
              <button 
                onClick={fetchDownloads} 
                disabled={loading}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>

          {/* --- STATS GRID (Seulement Total et Volume) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              label="Total" 
              value={downloads.length} 
              icon={<Download />} 
              color="text-[#CE0033]" 
              bg="bg-[#CE0033]/10" 
            />
            <StatCard 
              label="Volume Total" 
              value={(downloads.reduce((acc, d) => acc + (parseFloat(d.taille) || 0), 0)).toFixed(1) + ' MB'} 
              icon={<HardDrive />} 
              color="text-blue-400" 
              bg="bg-blue-400/10" 
            />
          </div>

          {/* --- TABLEAU --- */}
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Désignation</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase hidden md:table-cell">Auteur</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase hidden sm:table-cell">Date</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredDownloads.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-[#CE0033]">
                            <Layers size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[200px]">
                              {item.titre}
                            </p>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {item.categorie || 'Général'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-gray-400">
                          <User size={14} className="text-[#CE0033]" />
                          <span className="text-sm truncate max-w-[150px]">
                            {item.auteurNom || 'Simplonien'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">
                          {item.dateDownload ? new Date(item.dateDownload).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleDownload(item.id, item.titre)} 
                            className="p-2 bg-[#CE0033] hover:bg-[#E60039] text-white rounded-lg transition-colors"
                          >
                            {downloadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          </button>
                          <button 
                            onClick={() => navigate(`/project/${item.id}`)} 
                            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, bg }) => (
  <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl ${bg}`}>
        {React.cloneElement(icon, { className: `${color}`, size: 24 })}
      </div>
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</h3>
    </div>
    <div className="flex items-baseline gap-2">
      <p className={`text-3xl md:text-4xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);

export default MyDownloads;