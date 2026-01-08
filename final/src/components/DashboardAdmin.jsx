// components/DashboardAdmin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "./Sidebar";
import { 
  Users, Folder, BarChart3, Download, Clock, ArrowUpRight, 
  AlertCircle, CheckCircle, Upload, Trash2, LogIn, LogOut,
  UserPlus, FileText, Loader2, RefreshCw
} from 'lucide-react';

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    utilisateurs: 0,
    projets: 0,
    activites: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification de l'authentification
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    
    // Vérifiez le rôle et le matricule
    if (!user || (user.role !== "admin" && !user.matricule?.startsWith("AD-"))) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
    loadDashboardData();
  }, [navigate]);

  // Fonction pour charger les données depuis l'API
  const loadDashboardData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Charger les utilisateurs
      const usersRes = await fetch('http://localhost:5000/api/admin/users');
      const users = usersRes.ok ? await usersRes.json() : [];
      
      // Charger les projets
      const projectsRes = await fetch('http://localhost:5000/api/projects');
      const projects = projectsRes.ok ? await projectsRes.json() : [];
      
      // Charger les activités récentes (limité aux 10 dernières)
      const activitiesRes = await fetch('http://localhost:5000/api/admin/activities');
      const activities = activitiesRes.ok ? await activitiesRes.json() : [];
      
      setStats({
        utilisateurs: users.length || 0,
        projets: Array.isArray(projects) ? projects.length : 0,
        activites: activities.length || 0
      });
      
      // Filtrer et formater les 10 dernières activités pertinentes
      const filteredActivities = activities
        .filter(activity => {
          const action = activity.action?.toLowerCase() || '';
          return (
            action.includes('inscription') ||
            action.includes('activation') ||
            action.includes('connexion') ||
            action.includes('login') ||
            action.includes('déconnexion') ||
            action.includes('logout') ||
            action.includes('projet') ||
            action.includes('créé') ||
            action.includes('upload') ||
            action.includes('suppression') ||
            action.includes('delete') ||
            action.includes('téléchargement') ||
            action.includes('download')
          );
        })
        .slice(0, 10) // Limiter aux 10 dernières
        .map(formatActivity); // Formater pour l'affichage
      
      setRecentActivity(filteredActivities);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Formater une activité pour l'affichage
  const formatActivity = (activity) => {
    const action = activity.action?.toLowerCase() || '';
    const details = activity.details || '';
    const userName = activity.user_name || 'Utilisateur';
    const timestamp = activity.timestamp || new Date().toISOString();
    
    let type = 'system';
    let icon = <AlertCircle size={18} />;
    let color = 'bg-gray-500/10 text-gray-400';
    let message = details;
    
    // Déterminer le type et l'icône selon l'action
    if (action.includes('inscription') || action.includes('activation')) {
      type = 'inscription';
      icon = <UserPlus size={18} />;
      color = 'bg-green-500/10 text-green-400';
      message = `${userName} a activé un compte`;
    } 
    else if (action.includes('connexion') || action.includes('login')) {
      type = 'connexion';
      icon = <LogIn size={18} />;
      color = 'bg-blue-500/10 text-blue-400';
      message = `${userName} s'est connecté`;
    }
    else if (action.includes('déconnexion') || action.includes('logout')) {
      type = 'déconnexion';
      icon = <LogOut size={18} />;
      color = 'bg-yellow-500/10 text-yellow-400';
      message = `${userName} s'est déconnecté`;
    }
    else if (action.includes('projet') && action.includes('créé')) {
      type = 'projet';
      icon = <Upload size={18} />;
      color = 'bg-purple-500/10 text-purple-400';
      const projectMatch = details.match(/Projet créé: (.+)/);
      message = projectMatch 
        ? `${userName} a déposé le projet: "${projectMatch[1]}"`
        : `${userName} a déposé un projet`;
    }
    else if (action.includes('suppression') && action.includes('projet')) {
      type = 'suppression';
      icon = <Trash2 size={18} />;
      color = 'bg-red-500/10 text-red-400';
      const projectMatch = details.match(/Projet supprimé: (.+)/);
      message = projectMatch 
        ? `${userName} a supprimé le projet: "${projectMatch[1]}"`
        : `${userName} a supprimé un projet`;
    }
    else if (action.includes('téléchargement') || action.includes('download')) {
      type = 'téléchargement';
      icon = <Download size={18} />;
      color = 'bg-[#CE0033]/10 text-[#CE0033]';
      const fileMatch = details.match(/Fichier téléchargé: (.+)/);
      message = fileMatch 
        ? `${userName} a téléchargé: "${fileMatch[1]}"`
        : `${userName} a téléchargé un fichier`;
    }
    
    return {
      id: activity.id,
      type,
      icon,
      color,
      message,
      userName,
      timestamp,
      time: formatTimeAgo(timestamp)
    };
  };

  // Formater la date "il y a..."
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'À l\'instant';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date inconnue';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour déconnecter
  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      default:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  Tableau de Bord Administrateur
                </h1>
                <p className="text-gray-400 mt-1">
                  Connecté en tant que <span className="text-[#CE0033] font-medium">
                    {currentUser?.pseudo || currentUser?.email}
                  </span> • Matricule: {currentUser?.matricule}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={loadDashboardData}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? 'Actualisation...' : 'Actualiser'}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                >
                  Déconnexion
                </button>
                <div className="hidden sm:flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20 text-xs font-bold uppercase">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  En ligne
                </div>
              </div>
            </div>
            
            {/* Stats */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 animate-pulse">
                    <div className="h-6 bg-gray-800 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-800 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                  icon={<Users size={24} />} 
                  title="Utilisateurs" 
                  value={stats.utilisateurs} 
                  label="Comptes actifs" 
                  color="text-blue-400"
                  onClick={() => setActiveTab('users')}
                />
                <StatCard 
                  icon={<Folder size={24} />} 
                  title="Projets" 
                  value={stats.projets} 
                  label="Projets déposés" 
                  color="text-[#CE0033]"
                  onClick={() => setActiveTab('projects')}
                />
                <StatCard 
                  icon={<BarChart3 size={24} />} 
                  title="Activités" 
                  value={stats.activites} 
                  label="Logs système" 
                  color="text-purple-400"
                />
              </div>
            )}

            {/* Activités Récentes */}
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-[#CE0033]" />
                  <h3 className="text-lg font-bold text-white">
                    Activités Récentes
                  </h3>
                  <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400">
                    {recentActivity.length}/10
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/notifications')}
                  className="text-xs font-bold text-[#CE0033] hover:underline flex items-center gap-1"
                >
                  Voir tout <ArrowUpRight size={14}/>
                </button>
              </div>

              <div className="divide-y divide-gray-800">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="animate-spin inline-block text-[#CE0033] mb-2" size={24} />
                    <p className="text-gray-500 text-sm">Chargement des activités...</p>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="p-10 text-center">
                    <AlertCircle className="inline-block text-gray-600 mb-3" size={32} />
                    <p className="text-gray-500 italic">Aucune activité récente</p>
                    <p className="text-gray-600 text-sm mt-1">Les activités des utilisateurs apparaîtront ici</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-4 p-6 hover:bg-gray-800/30 transition-colors">
                      <div className={`mt-1 p-2.5 rounded-xl ${activity.color}`}>
                        {activity.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <p className="font-medium text-sm md:text-base text-white">
                            {activity.message}
                          </p>
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-md whitespace-nowrap sm:ml-2">
                            {activity.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <CheckCircle size={12} />
                            <span className="capitalize">{activity.type}</span>
                          </div>
                          {activity.userName && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs text-gray-500">
                                Par: {activity.userName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {recentActivity.length > 0 && (
                <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Inscriptions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Connexions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>Projets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#CE0033]"></div>
                      <span>Téléchargements</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-lg font-bold mb-3 text-[#CE0033]">Surveillance en temps réel</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                <div className="space-y-2">
                  <p className="font-medium text-gray-300">Ce qui est surveillé :</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Activation de comptes utilisateurs</li>
                    <li>Connexions/Déconnexions</li>
                    <li>Dépôt de nouveaux projets</li>
                    <li>Suppression de projets</li>
                    <li>Téléchargements de fichiers</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-300">Fonctionnalités :</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>10 dernières activités affichées</li>
                    <li>Actualisation automatique toutes les 30 secondes</li>
                    <li>Bouton "Actualiser" pour mise à jour manuelle</li>
                    <li>Cliquez sur "Voir tout" pour le journal complet</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
}

// Composant StatCard
function StatCard({ icon, title, value, label, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-[#CE0033]/30 transition-all cursor-pointer ${onClick ? 'hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-gray-800 rounded-xl ${color}`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl md:text-4xl font-black text-white">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}