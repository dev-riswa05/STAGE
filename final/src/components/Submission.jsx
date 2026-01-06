// components/Submission.jsx
import React, { useState, useEffect } from "react";
import { UserSidebar } from "./Sidebar";
import { Folder, Upload, X, FileText, Code, Save, Image as ImageIcon } from 'lucide-react';
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

  // Récupération de l'utilisateur
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(user);
  }, []);

  // --- LOGIQUE DES TECHNOLOGIES ---
  const handleAddTech = (e) => {
    if (e.key === "Enter" && newTech.trim()) {
      e.preventDefault();
      const techToAdd = newTech.trim();
      if (!technologies.includes(techToAdd)) {
        setTechnologies([...technologies, techToAdd]);
      }
      setNewTech("");
    }
  };

  const handleRemoveTech = (tech) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  // --- LOGIQUE DES FICHIERS ---
  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      setFile(uploaded);
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) clearInterval(interval);
      }, 100);
    }
  };

  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const zip = new JSZip();
    for (let f of files) {
      zip.file(f.webkitRelativePath, f);
    }

    const zipped = await zip.generateAsync({ type: "blob" });
    const zipFile = new File([zipped], `${projectName || "projet"}.zip`, {
      type: "application/zip",
    });

    setFile(zipFile);
    setProgress(100);
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!projectName.trim() || !file) {
      setIsSubmitting(false);
      return alert("❌ Nom du projet et fichier ZIP requis.");
    }

    try {
      const formData = new FormData();
      formData.append('titre', projectName);
      formData.append('description', description);
      formData.append('categorie', categorie);
      formData.append('auteurId', currentUser?.id);
      formData.append('auteurNom', currentUser?.pseudo || `${currentUser?.prenom} ${currentUser?.nom}`);
      formData.append('file', file);

      technologies.forEach(tech => formData.append('technologies', tech));
      images.forEach(img => formData.append('images', img));

      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Erreur lors de l'envoi");

      setSuccessMessage("✅ Projet enregistré avec succès !");
      setTimeout(() => window.location.href = '/dashboard', 2000);

    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark flex flex-col md:flex-row">
      <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 pt-20 md:pt-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Folder className="text-primary shrink-0" size={32} />
              Soumettre un projet
            </h1>
          </header>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Titre du projet */}
            <div className="bg-surface-dark p-5 md:p-6 rounded-2xl border border-border-dark">
              <label className="flex items-center gap-2 mb-3 text-lg font-semibold cursor-pointer">
                <FileText size={20} className="text-primary" /> Nom du projet *
              </label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-background-dark border border-border-dark px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Ex: Dashboard Analytics"
                required
              />
            </div>

            {/* Catégorie & Technologies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <label className="block mb-3 text-lg font-semibold">Catégorie</label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full bg-background-dark border border-border-dark px-4 py-3 rounded-xl outline-none cursor-pointer"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Fullstack</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>

              <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <span className="flex items-center gap-2 mb-3 text-lg font-semibold">
                  <Code size={20} className="text-primary" /> Technologies
                </span>
                <div className="flex flex-wrap gap-2 bg-background-dark p-3 rounded-xl border border-border-dark min-h-[50px]">
                  {technologies.map((tech) => (
                    <div key={tech} className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-full text-sm">
                      <span className="text-primary font-medium">{tech}</span>
                      <button type="button" onClick={() => handleRemoveTech(tech)} className="hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <input
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyDown={handleAddTech}
                    placeholder="React..."
                    className="bg-transparent text-sm p-1 flex-1 min-w-[80px] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description détaillée - Correction du conflit font-semibold/font-medium ici */}
            <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <label className="block mb-3 text-lg font-semibold">
                Description détaillée *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-background-dark border border-border-dark px-4 py-3 rounded-xl min-h-[120px] outline-none"
                placeholder="Décrivez les fonctionnalités et objectifs..."
                required
              />
            </div>

            {/* Uploads (ZIP & Dossier) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border-dark rounded-2xl bg-background-dark cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload size={32} className="text-primary mb-2 opacity-60" />
                  <span className="text-sm font-medium">Téléverser le ZIP</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".zip,.rar" />
                </label>
                {file && (
                  <div className="mt-4 p-3 bg-background-dark border border-border-dark rounded-xl flex items-center gap-3">
                    <Folder className="text-primary shrink-0" size={20} />
                    <span className="text-xs truncate flex-1 font-medium">{file.name}</span>
                    <div className="w-12 bg-border-dark h-1 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark flex flex-col justify-center">
                <span className="block mb-2 text-sm font-medium text-text-secondary-dark">Uploader un dossier complet :</span>
                <input
                  type="file"
                  directory="true"
                  webkitdirectory="true"
                  onChange={handleFolderUpload}
                  className="text-xs text-text-secondary-dark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
            </div>

            {/* Captures d'écran */}
            <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
              <label className="flex items-center gap-2 mb-4 text-lg font-semibold">
                <ImageIcon size={20} className="text-primary" /> Captures d'écran (Optionnel)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files))}
                className="w-full text-sm text-text-secondary-dark file:bg-border-dark file:text-text-primary-dark file:border-0 file:py-2 file:px-4 file:rounded-lg file:mr-4"
              />
            </div>

            {/* Boutons Finaux */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <button 
                type="button" 
                onClick={() => window.history.back()}
                className="px-8 py-3 rounded-xl border border-border-dark hover:bg-surface-dark transition-colors font-medium text-center"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 px-10 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? "Publication..." : <><Save size={20} /> Publier le projet</>}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}