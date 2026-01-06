// components/AdminProjects.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from "./Sidebar";
import { 
  Download, Trash2, Search, Mail, Folder, Calendar, 
  User, Plus, X, Upload, FileText, Code, Save 
} from 'lucide-react';
import JSZip from "jszip"; // Nécessaire pour compresser les dossiers

export default function AdminProjects() {
  const [activeTab, setActiveTab] = useState('projects');
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // --- ÉTATS DU FORMULAIRE (Enrichis) ---
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: 'frontend',
    technologies: [],
    techInput: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const storedProjects = JSON.parse(localStorage.getItem('simplon_projects') || '[]');
    const users = JSON.parse(localStorage.getItem('simplon_users') || '[]');
    
    const projectsWithAuthors = storedProjects.map(project => {
      const author = users.find(u => u.id === project.auteurId);
      return {
        ...project,
        auteurNom: author ? (author.pseudo || `${author.prenom} ${author.nom}`) : 'Admin',
        auteurEmail: author ? author.email : 'admin@simplon.co'
      };
    });
    setProjects(projectsWithAuthors);
  };

  const filteredProjects = projects.filter(project =>
    project.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.auteurNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGIQUE DE TÉLÉCHARGEMENT ---
  const handleDownload = async (project) => {
    try {
      const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/file/${project.id}`);
      if (!res.ok) throw new Error('Fichier non trouvé');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.titre}.zip`;
      a.click();
    } catch (e) {
      alert("Erreur lors du téléchargement");
    }
  };

  // --- LOGIQUE DES FICHIERS (FUSIONNÉE) ---
  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) setFile(uploaded);
  };

  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const zip = new JSZip();
    for (let f of files) { zip.file(f.webkitRelativePath, f); }
    const zipped = await zip.generateAsync({ type: "blob" });
    setFile(new File([zipped], `${formData.titre || "projet"}.zip`, { type: "application/zip" }));
  };

  // --- ACTIONS FORMULAIRE ---
  const addTechnology = () => {
    if (formData.techInput.trim() && !formData.technologies.includes(formData.techInput.trim())) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, formData.techInput.trim()],
        techInput: ''
      });
    }
  };

  const removeTechnology = (tech) => {
    setFormData({ ...formData, technologies: formData.technologies.filter(t => t !== tech) });
  };

  const handleSubmitProject = async () => {
    if (!formData.titre.trim() || !file) {
      alert('Veuillez remplir le titre et sélectionner un fichier (ZIP ou dossier)');
      return;
    }

    setIsSubmitting(true);
    const currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');

    try {
      const newProject = {
        id: `proj_${Date.now()}`,
        titre: formData.titre,
        description: formData.description,
        categorie: formData.categorie,
        technologies: formData.technologies,
        auteurId: currentUser?.id || 'admin',
        dateCreation: new Date().toISOString(),
        taille: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      };

      const stored = JSON.parse(localStorage.getItem('simplon_projects') || '[]');
      stored.unshift(newProject);
      localStorage.setItem('simplon_projects', JSON.stringify(stored));

      loadProjects();
      setShowModal(false);
      resetForm();
      alert('Projet ajouté avec succès !');
    } catch (err) {
      alert("Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ titre: '', description: '', categorie: 'frontend', technologies: [], techInput: '' });
    setFile(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer ce projet ?')) {
      const updated = projects.filter(p => p.id !== id);
      localStorage.setItem('simplon_projects', JSON.stringify(updated));
      setProjects(updated);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = { frontend: 'bg-blue-500/20 text-blue-400', backend: 'bg-green-500/20 text-green-400', fullstack: 'bg-purple-500/20 text-purple-400', mobile: 'bg-orange-500/20 text-orange-400' };
    return colors[cat?.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark flex">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-8 pt-16 lg:pt-8 overflow-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Projets</h1>
            <p className="text-text-secondary-dark mt-2">Gérez tous les projets de la plateforme</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all font-bold shadow-lg shadow-primary/20"
          >
            <Plus size={20} /> Ajouter un projet
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', val: projects.length, color: 'text-primary' },
            { label: 'Frontend', val: projects.filter(p => p.categorie === 'frontend').length, color: 'text-blue-400' },
            { label: 'Backend', val: projects.filter(p => p.categorie === 'backend').length, color: 'text-green-400' },
            { label: 'Fullstack', val: projects.filter(p => p.categorie === 'fullstack').length, color: 'text-purple-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-surface-dark p-4 rounded-xl border border-border-dark">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
              <p className="text-text-secondary-dark text-xs uppercase font-bold tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-dark" size={20} />
          <input
            type="text" placeholder="Rechercher un projet..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark px-10 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tableau */}
        <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-dark/50 border-b border-border-dark">
                <th className="px-6 py-4">Titre</th>
                <th className="px-6 py-4">Auteur</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="border-t border-border-dark hover:bg-background-dark/30 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <Folder size={16} className="text-primary" /> {project.titre}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium">{project.auteurNom}</div>
                    <div className="text-text-secondary-dark text-xs">{project.auteurEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getCategoryColor(project.categorie)}`}>
                      {project.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary-dark">
                    {new Date(project.dateCreation).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleDownload(project)} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"><Download size={16}/></button>
                      <button onClick={() => handleDelete(project.id)} className="p-2 bg-red-400/10 text-red-400 rounded-lg hover:bg-red-400/20 transition"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODALE D'AJOUT (VERSION FINALE) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-border-dark rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border-dark sticky top-0 bg-surface-dark z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Plus className="text-primary" /> Nouveau Projet</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary-dark mb-2">Titre *</label>
                  <input type="text" value={formData.titre} onChange={(e) => setFormData({...formData, titre: e.target.value})} className="w-full bg-background-dark border border-border-dark px-4 py-3 rounded-xl outline-none focus:border-primary" placeholder="Nom du projet" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-text-secondary-dark mb-2">Catégorie</label>
                  <select value={formData.categorie} onChange={(e) => setFormData({...formData, categorie: e.target.value})} className="w-full bg-background-dark border border-border-dark px-4 py-3 rounded-xl outline-none">
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="fullstack">Fullstack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary-dark mb-2">Technologies</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={formData.techInput} onChange={(e) => setFormData({...formData, techInput: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && addTechnology()} className="flex-1 bg-background-dark border border-border-dark px-4 py-3 rounded-xl outline-none" placeholder="React, Node..." />
                  <button onClick={addTechnology} className="px-4 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition font-bold text-sm">Ajouter</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.technologies.map((t, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-bold uppercase border border-primary/30">
                      {t} <button onClick={() => removeTechnology(t)}><X size={12}/></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary-dark mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-background-dark border border-border-dark px-4 py-3 rounded-xl outline-none h-28 resize-none" placeholder="Décrivez le projet..." />
              </div>

              {/* SECTION UPLOAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-dark rounded-2xl bg-background-dark/50 cursor-pointer hover:border-primary/50 transition-all">
                  <Upload className="text-primary mb-2" size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Téléverser ZIP</span>
                  <input type="file" className="hidden" accept=".zip" onChange={handleFileUpload} />
                </label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-dark rounded-2xl bg-background-dark/50 cursor-pointer hover:border-primary/50 transition-all text-center">
                  <Folder className="text-primary mb-2" size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">Dossier Complet</span>
                  <input type="file" className="hidden" webkitdirectory="" directory="" onChange={handleFolderUpload} />
                </label>
              </div>

              {file && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-pulse">
                  <FileText className="text-primary" />
                  <div className="flex-1 text-xs truncate font-bold uppercase">{file.name}</div>
                  <div className="text-[10px] bg-primary text-white px-2 py-1 rounded font-bold">PRÊT</div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-dark bg-background-dark flex gap-4">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-3 border border-border-dark rounded-xl font-bold hover:bg-white/5 transition">Annuler</button>
              <button onClick={handleSubmitProject} disabled={isSubmitting} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? "Création..." : <><Save size={18}/> Créer le projet</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}