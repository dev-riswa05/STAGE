import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar, UserSidebar } from '../components/Sidebar';
import { Save, Edit, Mail, User, Shield, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Profile() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    setFormData({
      pseudo: user.pseudo || '',
      prenom: user.prenom || '',
      nom: user.nom || '',
      password: ''
    });
  }, [navigate]);

  // --- LOGIQUE DE RENDU DU SIDEBAR ---
  const renderSidebar = () => {
    const props = { activeTab, setActiveTab };
    
    // Détection du rôle selon le matricule OU le champ role
    const isAdmin = currentUser?.matricule?.startsWith('AD-') || 
                   currentUser?.role === 'admin' || 
                   currentUser?.role === 'administrateur';
    
    return isAdmin ? <AdminSidebar {...props} /> : <UserSidebar {...props} />;
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
    
    return null; 
  };

  // --- ACTION : SAUVEGARDE ---
  const handleSave = async () => {
    const error = validateForm();
    if (error) return alert(error);

    setLoading(true);
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      const data = await res.json();
      
      // Mettre à jour l'utilisateur dans le localStorage
      const updatedUser = {
        ...currentUser,
        pseudo: formData.pseudo,
        prenom: formData.prenom,
        nom: formData.nom,
        ...(formData.password && { password: formData.password })
      };
      
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setIsEditing(false);
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-[#CE0033]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {renderSidebar()}

      <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 md:p-8 shadow-sm">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <User className="text-[#CE0033]" size={28} />
                  Mon Profil
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-1">Gérez vos informations personnelles</p>
              </div>

              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={loading}
                className="px-4 py-2.5 bg-[#CE0033] hover:bg-[#E60039] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#CE0033]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : isEditing ? (
                  <>
                    <Save size={18} /> Enregistrer
                  </>
                ) : (
                  <>
                    <Edit size={18} /> Modifier le profil
                  </>
                )}
              </button>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-2 text-sm">
                <Save size={18} /> {successMessage}
              </div>
            )}

            {/* Grid des informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* MATRICULE */}
              <div className="space-y-2">
                <label className="flex text-xs font-bold uppercase tracking-wider text-gray-400 items-center gap-2">
                  <Shield size={14} /> Matricule
                </label>
                <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl overflow-x-auto">
                  <p className="text-[#CE0033] font-mono font-bold tracking-widest whitespace-nowrap">
                    {currentUser.matricule}
                  </p>
                </div>
              </div>

              {/* EMAIL - CORRECTION ICI */}
              <div className="space-y-2">
                <label className="flex text-xs font-bold uppercase tracking-wider text-gray-400 items-center gap-2">
                  <Mail size={14} /> Email
                </label>
                <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl overflow-hidden">
                  <p className="text-white break-words overflow-wrap-anywhere truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* NOM */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:border-[#CE0033] outline-none transition-colors"
                    placeholder="Votre nom"
                  />
                ) : (
                  <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl overflow-hidden">
                    <p className="text-white break-words overflow-wrap-anywhere truncate">
                      {currentUser.nom || 'Non renseigné'}
                    </p>
                  </div>
                )}
              </div>

              {/* PRÉNOM */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Prénom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:border-[#CE0033] outline-none transition-colors"
                    placeholder="Votre prénom"
                  />
                ) : (
                  <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl overflow-hidden">
                    <p className="text-white break-words overflow-wrap-anywhere truncate">
                      {currentUser.prenom || 'Non renseigné'}
                    </p>
                  </div>
                )}
              </div>

              {/* PSEUDO */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Pseudo</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pseudo || ''}
                    onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:border-[#CE0033] outline-none transition-colors"
                    placeholder="Votre pseudo"
                  />
                ) : (
                  <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl overflow-hidden">
                    <p className="text-white break-words overflow-wrap-anywhere truncate">
                      {currentUser.pseudo || 'Non renseigné'}
                    </p>
                  </div>
                )}
              </div>

              {/* RÔLE */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Rôle</label>
                <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-tighter ${
                    currentUser.matricule?.startsWith('AD-') || currentUser.role === 'admin' || currentUser.role === 'administrateur'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}>
                    {currentUser.matricule?.startsWith('AD-') || currentUser.role === 'admin' || currentUser.role === 'administrateur' ? 'ADMIN' : 'STAGIAIRE'}
                  </span>
                </div>
              </div>

              {/* MOT DE PASSE */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex text-xs font-bold uppercase tracking-wider text-gray-400 items-center gap-2">
                  <Key size={14} /> {isEditing ? 'Changer le mot de passe' : 'Mot de passe'}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      placeholder="Laisser vide pour conserver l'actuel"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 pr-12 rounded-xl focus:border-[#CE0033] outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#CE0033] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl flex justify-between items-center overflow-hidden">
                    <p className="tracking-widest text-gray-400 truncate w-full">••••••••••••</p>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 justify-end mt-10 pt-6 border-t border-gray-800">
                <button
                  onClick={() => { 
                    setIsEditing(false); 
                    setFormData({
                      pseudo: currentUser.pseudo || '',
                      prenom: currentUser.prenom || '',
                      nom: currentUser.nom || '',
                      password: ''
                    }); 
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-3 bg-[#CE0033] rounded-xl text-white font-bold hover:brightness-110 shadow-lg shadow-[#CE0033]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enregistrement...' : 'Confirmer les modifications'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}