// components/AdminUsers.jsx
import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./Sidebar";
import { Search, Users, Shield, User, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';

export default function AdminUsers() {
  // --- ÉTATS (STATES) ---
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // --- CYCLE DE VIE ---
  useEffect(() => {
    fetchUsers();
    // Récupérer l'utilisateur courant pour vérifier les permissions
    const currentUserData = JSON.parse(localStorage.getItem('current_user') || 'null');
    setCurrentUser(currentUserData);
  }, []);

  // --- FONCTIONS ---
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Récupérer depuis localStorage (simulation)
      const storedUsers = JSON.parse(localStorage.getItem('simplon_users') || '[]');
      
      // Initialiser isActive à true si non défini (pour compatibilité)
      const usersWithStatus = storedUsers.map(user => ({
        ...user,
        isActive: user.isActive === undefined ? true : user.isActive
      }));
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    // Vérifier si l'utilisateur courant est admin
    if (!currentUser || !currentUser.matricule?.startsWith('AD-')) {
      alert('Seuls les administrateurs peuvent modifier le statut des utilisateurs');
      return;
    }

    // Empêcher un administrateur de se désactiver lui-même
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate && userToUpdate.matricule === currentUser.matricule) {
      alert('Vous ne pouvez pas désactiver votre propre compte');
      return;
    }

    const newStatus = !currentStatus;
    
    try {
      // Mettre à jour dans localStorage (remplacer par appel API réel)
      const storedUsers = JSON.parse(localStorage.getItem('simplon_users') || '[]');
      const updatedUsers = storedUsers.map(user => 
        user.id === userId ? { ...user, isActive: newStatus } : user
      );
      localStorage.setItem('simplon_users', JSON.stringify(updatedUsers));
      
      // Mettre à jour l'état local
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: newStatus } : user
      ));
      
      // En production: Envoyer une requête au backend
      // await api.updateUserStatus(userId, newStatus);
      
      console.log(`Utilisateur ${userId} ${newStatus ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const filteredUsers = users.filter(user =>
    user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role, isActive = true) => {
    const baseColor = isActive ? {
      'administrateur': 'bg-red-500/10 text-red-400 border border-red-500/20',
      'formateur': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'apprenant': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'default': 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    }[role] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20' 
    : 'bg-gray-800/50 text-gray-500 border border-gray-700';
    
    return baseColor;
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
      : 'bg-red-500/10 text-red-400 border border-red-500/20';
  };

  const countByRole = () => {
    let stagiaires = 0;
    let administrateurs = 0;
    let actifs = 0;
    let inactifs = 0;
    
    users.forEach(user => {
      if (user.matricule && user.matricule.toUpperCase().startsWith('AD-')) {
        administrateurs++;
      } else {
        stagiaires++;
      }
      
      if (user.isActive === false) {
        inactifs++;
      } else {
        actifs++;
      }
    });
    
    return { stagiaires, administrateurs, actifs, inactifs };
  };

  const roleCounts = countByRole();

  // Vérifier si l'utilisateur courant peut modifier les statuts
  const canModifyStatus = currentUser && currentUser.matricule?.startsWith('AD-');

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-x-hidden">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Gestion des Utilisateurs</h1>
            <p className="text-gray-400 text-sm md:text-base mt-1">
              Administration des accès Simplon {!canModifyStatus && '(Lecture seule)'}
            </p>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white px-12 py-3.5 rounded-2xl focus:ring-2 focus:ring-[#CE0033]/50 outline-none transition-all placeholder:text-gray-500"
          />
        </div>

        {/* Cartes Statistiques améliorées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<User className="text-green-400 w-5 h-5 md:w-6 md:h-6"/>} 
            label="Stagiaires" 
            count={roleCounts.stagiaires} 
            badgeColor="bg-green-500/10 text-green-400"
          />
          <StatCard 
            icon={<Shield className="text-red-400 w-5 h-5 md:w-6 md:h-6"/>} 
            label="Administrateurs" 
            count={roleCounts.administrateurs} 
            badgeColor="bg-red-500/10 text-red-400"
          />
          <StatCard 
            icon={<ToggleRight className="text-green-400 w-5 h-5 md:w-6 md:h-6"/>} 
            label="Comptes actifs" 
            count={roleCounts.actifs} 
            badgeColor="bg-green-500/10 text-green-400"
          />
          <StatCard 
            icon={<ToggleLeft className="text-red-400 w-5 h-5 md:w-6 md:h-6"/>} 
            label="Comptes inactifs" 
            count={roleCounts.inactifs} 
            badgeColor="bg-red-500/10 text-red-400"
          />
        </div>

        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-900/50 border-b border-gray-800 text-xs uppercase tracking-widest text-gray-400 font-bold">
                <tr>
                  <th className="px-4 sm:px-6 py-4">UTILISATEUR</th>
                  <th className="px-4 sm:px-6 py-4">MATRICULE</th>
                  <th className="px-4 sm:px-6 py-4 hidden md:table-cell">EMAIL</th>
                  <th className="px-4 sm:px-6 py-4">ROLE</th>
                  <th className="px-4 sm:px-6 py-4">STATUT</th>
                  <th className="px-4 sm:px-6 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CE0033]"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 sm:px-6 py-12 text-center text-gray-500 italic">
                      {users.length === 0 ? 'La base de données est vide' : 'Aucune correspondance trouvée'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isAdmin = user.matricule && user.matricule.toUpperCase().startsWith('AD-');
                    const role = isAdmin ? 'administrateur' : 'apprenant';
                    const isCurrentUser = currentUser && currentUser.matricule === user.matricule;
                    
                    return (
                      <tr 
                        key={user.id} 
                        className={`group transition-colors ${!user.isActive ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${!user.isActive ? 'bg-gray-800/50' : 'bg-gray-800'}`}>
                              {user.isActive ? 
                                <Eye size={16} className="text-gray-400" /> : 
                                <EyeOff size={16} className="text-gray-500" />
                              }
                            </div>
                            <div>
                              <p className="font-bold text-sm md:text-base uppercase text-white truncate max-w-[120px] sm:max-w-none">
                                {user.pseudo || `${user.prenom || ''} ${user.nom || ''}`.trim()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.isActive ? 'Actif' : 'Inactif'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-mono text-sm text-[#CE0033] truncate max-w-[100px] sm:max-w-none">
                          {user.matricule}
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell text-sm text-gray-400 truncate max-w-[200px]">
                          {user.email}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-tighter ${getRoleColor(role, user.isActive)}`}>
                            {isAdmin ? 'ADMIN' : 'STAGIAIRE'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-tighter ${getStatusBadge(user.isActive)}`}>
                            {user.isActive ? 'ACTIF' : 'INACTIF'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          {canModifyStatus && !isCurrentUser ? (
                            <button
                              onClick={() => toggleUserStatus(user.id, user.isActive)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                user.isActive 
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                              }`}
                              title={user.isActive ? 'Désactiver le compte' : 'Activer le compte'}
                            >
                              {user.isActive ? 'Désactiver' : 'Activer'}
                              {user.isActive ? 
                                <ToggleLeft size={16} /> : 
                                <ToggleRight size={16} />
                              }
                            </button>
                          ) : isCurrentUser ? (
                            <span className="text-xs text-gray-500 italic">Votre compte</span>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Lecture seule</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, count, badgeColor }) {
  return (
    <div className="bg-gray-900/50 p-4 sm:p-5 rounded-2xl border border-gray-800 flex items-center gap-3 sm:gap-4 hover:border-[#CE0033]/30 transition-all group">
      <div className="p-2 sm:p-3 bg-gray-800 rounded-xl border border-gray-800 group-hover:scale-110 transition-transform flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate">
          {count}
        </p>
        <p className="text-[9px] xs:text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest truncate">
          {label}
        </p>
      </div>
      <div className={`hidden xs:flex ml-auto px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold border ${badgeColor} border-current/20 whitespace-nowrap flex-shrink-0`}>
        {label}
      </div>
    </div>
  );
}