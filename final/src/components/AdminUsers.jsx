// components/AdminUsers.jsx
import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./Sidebar"; // Importation de la barre latérale de navigation
import { Plus, Edit, Trash2, Search, Mail, User, Shield, X, Users, CheckCircle } from 'lucide-react'; // Importation des icônes

export default function AdminUsers() {
  // --- ÉTATS (STATES) ---
  const [activeTab, setActiveTab] = useState('users'); // Gère l'onglet actif dans la sidebar
  const [users, setUsers] = useState([]); // Stocke la liste complète des utilisateurs
  const [searchTerm, setSearchTerm] = useState(''); // Gère la valeur du champ de recherche
  const [showForm, setShowForm] = useState(false); // Gère l'affichage du formulaire (Ajout/Modif)
  const [editingUser, setEditingUser] = useState(null); // Stocke l'utilisateur en cours de modification
  
  // État initial du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    email: '',
    role: 'apprenant',
    password: ''
  });

  // --- CYCLE DE VIE ---
  useEffect(() => {
    // Récupère les données au montage du composant
    const storedUsers = JSON.parse(localStorage.getItem('simplon_users') || '[]');
    setUsers(storedUsers);
  }, []);

  // --- LOGIQUE MÉTIER ---
  
  // Filtre les utilisateurs dynamiquement selon plusieurs critères
  const filteredUsers = users.filter(user =>
    user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gère la création ou la mise à jour d'un compte
  const handleSubmit = (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    const currentUsers = JSON.parse(localStorage.getItem('simplon_users') || '[]');
    
    if (editingUser) {
      // Logique de modification : on remplace l'objet correspondant par ID
      const updatedUsers = currentUsers.map(u =>
        u.id === editingUser.id ? { ...u, ...formData } : u
      );
      localStorage.setItem('simplon_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } else {
      // Logique de création : on génère un ID unique et une date
      const newUser = {
        ...formData,
        id: Date.now().toString(),
        dateCreation: new Date().toISOString(),
        est_actif: true
      };
      const updatedUsers = [...currentUsers, newUser];
      localStorage.setItem('simplon_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
    resetForm(); // Vide le formulaire après succès
  };

  // Réinitialise les états du formulaire
  const resetForm = () => {
    setFormData({ nom: '', prenom: '', matricule: '', email: '', role: 'apprenant', password: '' });
    setEditingUser(null);
    setShowForm(false);
  };

  // Remplit le formulaire avec les données de l'utilisateur sélectionné
  const handleEdit = (user) => {
    setFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      matricule: user.matricule || '',
      email: user.email || '',
      role: user.role || 'apprenant',
      password: '' // On ne pré-remplit jamais un mot de passe pour des raisons de sécurité
    });
    setEditingUser(user);
    setShowForm(true);
  };

  // Supprime un utilisateur après confirmation
  const handleDelete = (userId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('simplon_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  // Retourne une classe CSS spécifique selon le rôle de l'utilisateur
  const getRoleColor = (role) => {
    switch (role) {
      case 'administrateur': return 'bg-red-500/20 text-red-400 border border-red-500/20';
      case 'formateur': return 'bg-blue-500/20 text-blue-400 border border-blue-500/20';
      case 'apprenant': return 'bg-green-500/20 text-green-400 border border-green-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark flex flex-col md:flex-row">
      {/* Sidebar - Fixe sur PC, peut être adaptée en menu mobile si nécessaire */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Zone de contenu principal */}
      <main className="flex-1 p-4 md:p-8 pt-16 lg:pt-8 overflow-x-hidden">
        
        {/* Header : Titre et bouton d'action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-text-secondary-dark text-sm md:text-base mt-1">Administration des accès Simplon</p>
          </div>
          
        </div>

        {/* Barre de Recherche responsive */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary-dark" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark text-text-primary-dark px-12 py-3.5 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-text-secondary-dark/50"
          />
        </div>

        {/* Formulaire d'ajout/modification (Conditionnel) */}
        {showForm && (
          <div className="bg-surface-dark p-6 rounded-2xl mb-8 border border-border-dark shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
              {editingUser ? <Edit size={22} /> : <Plus size={22} />}
              {editingUser ? "Mettre à jour le profil" : "Créer un nouveau compte"}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Le champ Nom */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary-dark ml-1">Nom *</label>
                <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors" required />
              </div>
              {/* Le champ Prénom */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary-dark ml-1">Prénom *</label>
                <input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors" required />
              </div>
              {/* Le champ Matricule */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary-dark ml-1">Matricule *</label>
                <input type="text" placeholder="ex: SIM-2024" value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors" required />
              </div>
              {/* Le champ Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary-dark ml-1">Email professionnel *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors" required />
              </div>
              {/* Sélection du rôle */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary-dark ml-1">Rôle Système *</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 focus:border-primary outline-none appearance-none cursor-pointer">
                  <option value="apprenant">Apprenant</option>
                  <option value="formateur">Formateur</option>
                  <option value="administrateur">Administrateur</option>
                </select>
              </div>
              {/* Le champ Mot de passe */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary-dark ml-1">{editingUser ? 'Changer le mot de passe' : 'Mot de passe initial *'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors" required={!editingUser} />
              </div>

              {/* Actions du formulaire */}
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 justify-end mt-4">
                <button type="button" onClick={resetForm} className="order-2 sm:order-1 px-8 py-3 rounded-xl font-bold text-text-secondary-dark hover:bg-white/5 transition-colors">Annuler</button>
                <button type="submit" className="order-1 sm:order-2 bg-primary px-10 py-3 rounded-xl text-white font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all">
                  {editingUser ? 'Enregistrer les modifications' : 'Confirmer la création'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section Statistiques : Grille responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users className="text-primary"/>} label="Total Utilisateurs" count={users.length} />
          <StatCard icon={<User className="text-green-400"/>} label="Apprenants" count={users.filter(u => u.role === 'apprenant').length} />
          <StatCard icon={<Shield className="text-red-400"/>} label="Administrateurs" count={users.filter(u => u.role === 'administrateur').length} />
          <StatCard icon={<CheckCircle className="text-blue-400"/>} label="Actifs" count={users.length} />
        </div>

        {/* Tableau Responsive : Conteneur scrollable horizontalement */}
        <div className="bg-surface-dark rounded-2xl border border-border-dark shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-background-dark/50 border-b border-border-dark text-xs uppercase tracking-widest text-text-secondary-dark font-bold">
                <tr>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Matricule</th>
                  <th className="px-6 py-4 hidden md:table-cell">Email</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-secondary-dark italic">
                      {users.length === 0 ? 'La base de données est vide' : 'Aucune correspondance trouvée'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {user.nom.charAt(0)}{user.prenom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm md:text-base capitalize">{user.prenom} {user.nom}</p>
                            <p className="text-xs text-text-secondary-dark md:hidden italic">{user.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell font-mono text-sm text-primary">{user.matricule}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-text-secondary-dark">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-tighter ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(user)} className="p-2 md:p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all" title="Modifier">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 md:p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-all" title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

/** * Sous-composant StatCard pour la réutilisation et la clarté 
 * @param {icon, label, count} 
 */
function StatCard({ icon, label, count }) {
  return (
    <div className="bg-surface-dark p-5 rounded-2xl border border-border-dark flex items-center gap-4 hover:border-primary/30 transition-all group">
      <div className="p-3 bg-background-dark rounded-xl border border-border-dark group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-text-primary-dark">{count}</p>
        <p className="text-[10px] md:text-xs font-bold text-text-secondary-dark uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}