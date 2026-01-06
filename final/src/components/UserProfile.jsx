// components/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { Save, Edit, Mail, User, Shield, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function UserProfile() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    setFormData(user);
  }, [navigate]);

  // --- LOGIQUE DE RENDU DU SIDEBAR ---
  const renderSidebar = () => {
    const props = { activeTab, setActiveTab };
    switch (currentUser?.role) {
      case 'administrateur': return <AdminSidebar {...props} />;
      case 'formateur':     return <FormateurSidebar {...props} />;
      default:              return <UserSidebar {...props} />;
    }
  };

  // --- VALIDATIONS ---
  const validateForm = () => {
    const isNameValid = (n) => {
      if (!n || typeof n !== 'string') return false;
      const s = n.trim();
      return s.length >= 2 && !s.includes('@') && /^[A-Za-zÀ-ÖØ-öø-ÿ'\- \.`]+$/.test(s);
    };

    if (!isNameValid(formData.prenom)) return "Prénom invalide (min 2 caractères, pas de @)";
    if (!isNameValid(formData.nom)) return "Nom invalide (min 2 caractères, pas de @)";
    if (!formData.pseudo || formData.pseudo.trim().length < 2) return "Pseudo invalide (min 2 caractères)";
    if (formData.password && formData.password.length < 6) return "Mot de passe trop court (min 6 caractères)";
    
    return null; // Pas d'erreur
  };

  // --- ACTION : SAUVEGARDE ---
  const handleSave = async () => {
    const error = validateForm();
    if (error) return alert(error);

    try {
      const baseUrl = (import.meta?.env?.VITE_API_URL) || 'http://localhost:5000';
      
      const res = await fetch(`${baseUrl}/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pseudo: formData.pseudo, 
          prenom: formData.prenom, 
          nom: formData.nom, 
          password: formData.password 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');

      // 1. Mise à jour de la liste globale (localStorage)
      const users = JSON.parse(localStorage.getItem('simplon_users') || '[]');
      const updatedUsers = users.map(u => 
        u.id === currentUser.id 
          ? { ...u, pseudo: formData.pseudo, prenom: formData.prenom, nom: formData.nom } 
          : u
      );
      localStorage.setItem('simplon_users', JSON.stringify(updatedUsers));

      // 2. Mise à jour de l'utilisateur courant
      const newCur = { ...currentUser, pseudo: formData.pseudo, prenom: formData.prenom, nom: formData.nom };
      localStorage.setItem('current_user', JSON.stringify(newCur));
      setCurrentUser(newCur);

      // 3. UI Feedback
      setIsEditing(false);
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  // --- ÉTAT CHARGEMENT ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background-dark text-text-primary-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // --- RENDU PRINCIPAL ---
  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark flex">
      {renderSidebar()}

      <main className="flex-1 p-8 pt-16 lg:pt-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface-dark rounded-xl p-8 border border-border-dark">

            {/* HEADER ET BOUTON ACTION */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <User className="text-primary" size={32} />
                  Mon Profil
                </h1>
                <p className="text-text-secondary-dark mt-1">Gérez vos informations personnelles</p>
              </div>

              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-lg flex items-center gap-2 text-white font-medium transition shadow-lg"
              >
                {isEditing ? <><Save size={18} /> Enregistrer</> : <><Edit size={18} /> Modifier le profil</>}
              </button>
            </div>

            {/* MESSAGE DE SUCCÈS */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Save size={18} />
                {successMessage}
              </div>
            )}

            {/* FORMULAIRE / GRILLE D'INFORMATIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              {/* MATRICULE (Lecture seule) */}
              <div className="space-y-1.5">
                <label className="flex text-sm font-medium text-text-secondary-dark items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Shield size={14} /> Matricule
                </label>
                <div className="bg-background-dark/50 border border-border-dark px-4 py-3 rounded-lg opacity-80">
                  <p className="text-primary font-mono font-bold tracking-widest">{currentUser.matricule}</p>
                </div>
                <p className="text-text-secondary-dark text-[10px] italic">Identifiant unique — Non modifiable</p>
              </div>

              {/* EMAIL (Lecture seule) */}
              <div className="space-y-1.5">
                <label className="flex text-sm font-medium text-text-secondary-dark items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Mail size={14} /> Email
                </label>
                <div className="bg-background-dark/50 border border-border-dark px-4 py-3 rounded-lg opacity-80">
                  <p className="text-text-primary-dark">{currentUser.email}</p>
                </div>
                <p className="text-text-secondary-dark text-[10px] italic">Email institutionnel — Non modifiable</p>
              </div>

              {/* CHAMP : NOM */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary-dark flex items-center gap-2">
                  Nom {isEditing && <span className="text-primary">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition"
                  />
                ) : (
                  <div className="bg-background-dark border border-border-dark px-4 py-3 rounded-lg">
                    {currentUser.nom}
                  </div>
                )}
              </div>

              {/* CHAMP : PRÉNOM */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary-dark flex items-center gap-2">
                  Prénom {isEditing && <span className="text-primary">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition"
                  />
                ) : (
                  <div className="bg-background-dark border border-border-dark px-4 py-3 rounded-lg">
                    {currentUser.prenom}
                  </div>
                )}
              </div>

              {/* CHAMP : PSEUDO */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary-dark flex items-center gap-2">
                  Pseudo {isEditing && <span className="text-primary">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pseudo || ''}
                    onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition"
                  />
                ) : (
                  <div className="bg-background-dark border border-border-dark px-4 py-3 rounded-lg">
                    {currentUser.pseudo || '—'}
                  </div>
                )}
              </div>

              {/* RÔLE (Affichage uniquement) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary-dark uppercase tracking-wider text-[11px]">Rôle</label>
                <div className="bg-background-dark border border-border-dark px-4 py-3 rounded-lg">
                  <span className="capitalize px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* CHAMP : MOT DE PASSE */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="flex text-sm font-medium text-text-secondary-dark items-center gap-2">
                  <Key size={14} /> {isEditing ? 'Changer le mot de passe' : 'Mot de passe'}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Laisser vide pour conserver l'actuel"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 pr-12 focus:ring-2 focus:ring-primary outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary-dark hover:text-primary transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                ) : (
                  <div className="bg-background-dark border border-border-dark px-4 py-3 rounded-lg flex justify-between items-center opacity-60">
                    <p>••••••••••••</p>
                  </div>
                )}
              </div>
            </div>

            {/* ACTIONS DE FIN DE FORMULAIRE */}
            {isEditing && (
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-border-dark">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(currentUser);
                  }}
                  className="px-6 py-2.5 text-text-secondary-dark hover:text-text-primary-dark transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-2.5 bg-primary rounded-lg text-white font-bold hover:shadow-[0_0_15px_rgba(206,0,51,0.4)] transition-all"
                >
                  Confirmer les modifications
                </button>
              </div>
            )}

            {/* METADONNÉES DU COMPTE */}
            <div className="mt-10 pt-6 border-t border-border-dark grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-xs text-text-secondary-dark">
                <span>Date de création :</span>
                <span className="text-text-primary-dark">
                  {currentUser.dateCreation ? new Date(currentUser.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non disponible'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary-dark sm:justify-end">
                <span>Statut du compte :</span>
                <span className="flex items-center gap-1.5 text-green-400 font-bold uppercase tracking-widest text-[10px]">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span> Actif
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}