// components/Submission.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserSidebar } from "./Sidebar";
import { 
  Folder, Upload, X, FileText, Code, Save, 
  Image as ImageIcon, AlertCircle, CheckCircle2,
  Loader2, FolderOpen
} from 'lucide-react';
import JSZip from "jszip";

export default function Submission() {
  // --- ÉTATS (STATES) ---
  const [activeTab, setActiveTab] = useState('submission');
  const [currentUser, setCurrentUser] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [technologies, setTechnologies] = useState([]);
  const [newTech, setNewTech] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState("frontend");
  const [file, setFile] = useState(null); 
  const [images, setImages] = useState([]); 
  const [progress, setProgress] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [isZipping, setIsZipping] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

  // Récupération de l'utilisateur avec redirection
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
  }, [navigate]);

  // --- LOGIQUE DES TECHNOLOGIES ---
  const handleAddTech = (e) => {
    if (e.key === "Enter" && newTech.trim()) {
      e.preventDefault();
      const techToAdd = newTech.trim();
      if (!technologies.includes(techToAdd)) {
        setTechnologies([...technologies, techToAdd]);
        setError("");
      }
      setNewTech("");
    }
  };

  const handleAddTechClick = () => {
    if (newTech.trim() && !technologies.includes(newTech.trim())) {
      setTechnologies([...technologies, newTech.trim()]);
      setNewTech("");
      setError("");
    }
  };

  const handleRemoveTech = (tech) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  // --- VALIDATION DU FICHIER ---
  const validateFile = (file) => {
    const validTypes = ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.zip') && !file.name.endsWith('.rar')) {
      setError("Format de fichier non supporté. Utilisez .zip ou .rar");
      return false;
    }
    
    if (file.size > maxSize) {
      setError("Fichier trop volumineux (max 50MB)");
      return false;
    }
    
    return true;
  };

  // --- LOGIQUE DES FICHIERS ---
  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      if (!validateFile(uploaded)) return;
      
      setFile(uploaded);
      setError("");
      
      // Simulation de progression
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) clearInterval(interval);
      }, 100);
    }
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setFileCount(files.length);
    setIsZipping(true);
    setError("");

    try {
      const zip = new JSZip();
      
      // Ajouter chaque fichier au ZIP
      files.forEach((f) => {
        const relativePath = f.webkitRelativePath || f.name;
        zip.file(relativePath, f);
      });

      // Générer le ZIP
      const zipped = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      const zipFile = new File([zipped], `${projectName || "projet"}_${Date.now()}.zip`, {
        type: "application/zip",
      });

      setFile(zipFile);
      setIsZipping(false);
      setProgress(100);
      
    } catch (err) {
      setError("Erreur lors de la création du ZIP: " + err.message);
      setIsZipping(false);
    }
  };

  // --- VALIDATION DU FORMULAIRE ---
  const validateForm = () => {
    if (!projectName.trim()) {
      setError("Le nom du projet est requis");
      return false;
    }
    
    if (!file) {
      setError("Veuillez uploader un fichier ZIP ou dossier");
      return false;
    }
    
    if (!description.trim()) {
      setError("La description est requise");
      return false;
    }
    
    return true;
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('titre', projectName.trim());
      formData.append('description', description.trim());
      formData.append('categorie', categorie);
      formData.append('auteurId', currentUser?.id);
      formData.append('auteurNom', currentUser?.pseudo || `${currentUser?.prenom} ${currentUser?.nom}` || "Anonyme");
      formData.append('file', file);

      technologies.forEach(tech => formData.append('technologies', tech));
      images.forEach(img => formData.append('images', img));

      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        body: formData
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || "Erreur lors de l'envoi");
      }

      setSuccessMessage("✅ Projet enregistré avec succès !");
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setProjectName("");
        setTechnologies([]);
        setDescription("");
        setCategorie("frontend");
        setFile(null);
        setImages([]);
        setProgress(0);
        setSuccessMessage("");
        setIsSubmitting(false);
        
        // Redirection vers la page des projets
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setError(`❌ Erreur: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // --- RESET FORM ---
  const resetForm = () => {
    setProjectName("");
    setTechnologies([]);
    setDescription("");
    setCategorie("frontend");
    setFile(null);
    setImages([]);
    setProgress(0);
    setError("");
    setSuccessMessage("");
    setFileCount(0);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-slate-200 flex">
      <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Folder className="text-[#CE0033] shrink-0" size={32} />
                Soumettre un projet
              </h1>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2"
              >
                ← Retour
              </button>
            </div>
            <p className="text-slate-500 mt-2">
              Partagez votre projet avec la communauté Simplon
            </p>
          </header>

          {/* Messages d'alerte */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-400 font-medium">{successMessage}</p>
                <p className="text-green-400/70 text-sm mt-1">Redirection en cours...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Titre du projet */}
            <div className="bg-[#0A0A0B] p-5 md:p-6 rounded-xl border border-white/5">
              <label className="flex items-center gap-2 mb-3 text-lg font-semibold text-white">
                <FileText size={20} className="text-[#CE0033]" /> 
                Nom du projet *
              </label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-lg text-white focus:ring-2 focus:ring-[#CE0033] focus:border-transparent outline-none transition-all"
                placeholder="Ex: Dashboard Analytics"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Catégorie & Technologies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5">
                <label className="block mb-3 text-lg font-semibold text-white">
                  Catégorie
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-lg text-white outline-none cursor-pointer disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Fullstack</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="autres">Autres</option>
                </select>
              </div>

              <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Code size={20} className="text-[#CE0033]" /> 
                    Technologies
                  </span>
                  <span className="text-xs text-slate-500">Appuyez sur Entrée pour ajouter</span>
                </div>
                <div className="flex flex-wrap gap-2 bg-black/50 p-3 rounded-lg border border-white/10 min-h-[50px]">
                  {technologies.map((tech) => (
                    <div key={tech} className="flex items-center gap-2 bg-[#CE0033]/20 px-3 py-1.5 rounded-lg text-sm">
                      <span className="text-[#CE0033] font-medium">{tech}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTech(tech)}
                        className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyDown={handleAddTech}
                      placeholder="React, Node.js, MongoDB..."
                      className="bg-transparent text-white text-sm p-1 flex-1 min-w-[100px] outline-none placeholder:text-slate-600 disabled:opacity-50"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleAddTechClick}
                      className="text-[#CE0033] hover:text-[#E60039] transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Description détaillée */}
            <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5">
              <label className="block mb-3 text-lg font-semibold text-white">
                Description détaillée *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-lg text-white min-h-[140px] outline-none focus:ring-2 focus:ring-[#CE0033] focus:border-transparent resize-y disabled:opacity-50"
                placeholder="Décrivez les fonctionnalités, technologies utilisées, objectifs du projet..."
                disabled={isSubmitting}
                required
              />
              <p className="text-slate-500 text-xs mt-2">
                Minimum 50 caractères. Actuel: {description.length}
              </p>
            </div>

            {/* Uploads (ZIP & Dossier) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload ZIP */}
              <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-xl bg-black/30 cursor-pointer hover:border-[#CE0033]/50 transition-colors group">
                  <div className="text-center">
                    <Upload size={32} className="text-[#CE0033] mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-medium text-white">Téléverser un ZIP</span>
                    <p className="text-xs text-slate-500 mt-1">.zip ou .rar (max 50MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".zip,.rar,.7z" 
                    disabled={isSubmitting}
                  />
                </label>
                {file && file.name.endsWith('.zip') && (
                  <div className="mt-4 p-3 bg-black/50 border border-white/10 rounded-lg flex items-center gap-3">
                    <Folder className="text-[#CE0033] shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    {progress < 100 && (
                      <div className="w-20 bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#CE0033] h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Dossier */}
              <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5">
                <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-xl bg-black/30 cursor-pointer hover:border-[#CE0033]/50 transition-colors group">
                  <div className="text-center">
                    <FolderOpen size={32} className="text-[#CE0033] mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-medium text-white">Ou uploader un dossier</span>
                    <p className="text-xs text-slate-500 mt-1">Tous les fichiers seront zippés automatiquement</p>
                  </div>
                  <input
                    type="file"
                    directory="true"
                    webkitdirectory="true"
                    onChange={handleFolderUpload}
                    className="hidden"
                    disabled={isSubmitting || isZipping}
                  />
                </div>
                
                {isZipping && (
                  <div className="mt-4 p-3 bg-black/50 border border-white/10 rounded-lg flex items-center gap-3">
                    <Loader2 className="animate-spin text-[#CE0033]" size={20} />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Création du ZIP...</p>
                      <p className="text-xs text-slate-500">{fileCount} fichiers en cours de traitement</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Captures d'écran */}
            <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5">
              <label className="flex items-center gap-2 mb-4 text-lg font-semibold text-white">
                <ImageIcon size={20} className="text-[#CE0033]" /> 
                Captures d'écran (Optionnel)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImages(Array.from(e.target.files))}
                  className="flex-1 text-sm text-slate-400 file:bg-black/50 file:text-white file:border file:border-white/10 file:py-2 file:px-4 file:rounded-lg file:mr-4 file:cursor-pointer hover:file:bg-black/70"
                  disabled={isSubmitting}
                />
                <span className="text-xs text-slate-500">
                  {images.length} image(s) sélectionnée(s)
                </span>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {images.slice(0, 6).map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons Finaux */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-white/5">
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium text-white disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Réinitialiser
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-medium text-white disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#CE0033] hover:bg-[#E60039] px-8 py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[180px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Publication...
                  </>
                ) : (
                  <>
                    <Save size={20} /> 
                    Publier le projet
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}