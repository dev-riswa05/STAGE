// components/DashboardAdmin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "./Sidebar"; // Importation du menu latéral
import { Users, Folder, BarChart3, Download, Clock, ArrowUpRight } from 'lucide-react'; // Importation des icônes pour l'UI

export default function DashboardAdmin() {
  // --- ÉTATS (STATES) ---
  const [activeTab, setActiveTab] = useState('dashboard'); // État pour gérer la navigation interne
  const [currentUser, setCurrentUser] = useState(null); // Stocke les infos de l'admin connecté
  const [stats, setStats] = useState({
    utilisateurs: 0,
    projets: 0,
    activites: 0
  }); // État pour les compteurs statistiques
  const [recentActivity, setRecentActivity] = useState([]); // Liste des 5 dernières actions
  const navigate = useNavigate(); // Hook pour la redirection

  // --- EFFETS (SIDE EFFECTS) ---
  useEffect(() => {
    // Vérification de l'authentification et du rôle au chargement
    const user = JSON.parse(localStorage.getItem('current_user') || 'null');
    
    // Si pas d'utilisateur ou si le rôle n'est pas admin -> Redirection vers login
    if (!user || user.role !== 'administrateur') {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user); // Mise à jour de l'utilisateur local
    loadStats(); // Calcul des compteurs
    loadRecentActivity(); // Récupération des logs d'activité
  }, [navigate]);

  // --- CHARGEMENT DES DONNÉES ---

  // Calcule les statistiques globales en lisant le localStorage
  const loadStats = () => {
    const users = JSON.parse(localStorage.getItem('simplon_users') || '[]');
    const projects = JSON.parse(localStorage.getItem('simplon_projects') || '[]');
    const activities = JSON.parse(localStorage.getItem('recent_activities') || '[]');
    
    setStats({
      utilisateurs: users.length,
      projets: projects.length,
      activites: activities.length
    });
  };

  // Récupère les logs d'activité (limité aux 5 plus récents)
  const loadRecentActivity = () => {
    const activities = JSON.parse(localStorage.getItem('recent_activities') || '[]');
    // On trie par date (si présent) et on prend les 5 premiers
    setRecentActivity(activities.slice(0, 5));
  };

  // --- RENDU DES COMPOSANTS ---

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      default:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header de bienvenue adaptatif */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Tableau de Bord</h1>
                <p className="text-text-secondary-dark mt-1">
                  Heureux de vous revoir, <span className="text-primary font-medium">{currentUser?.prenom}</span> 👋
                </p>
              </div>
              {/* Badge de statut visible sur desktop */}
              <div className="hidden sm:flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20 text-xs font-bold uppercase">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Serveur Opérationnel
              </div>
            </div>
            
            {/* Grille de Cartes Statistiques : 1 col sur mobile, 3 sur PC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <StatCard 
                icon={<Users size={24} />} 
                title="Utilisateurs" 
                value={stats.utilisateurs} 
                label="Comptes actifs" 
                color="text-blue-400"
              />
              <StatCard 
                icon={<Folder size={24} />} 
                title="Projets" 
                value={stats.projets} 
                label="Livrables déposés" 
                color="text-primary"
              />
              <StatCard 
                icon={<BarChart3 size={24} />} 
                title="Activités" 
                value={stats.activites} 
                label="Logs système" 
                color="text-purple-400"
              />
            </div>

            {/* Section Activité Récente avec défilement sur mobile si nécessaire */}
            <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border-dark flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Clock size={20} className="text-primary" />
                  Flux d'activités
                </h3>
                <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  Voir tout <ArrowUpRight size={14}/>
                </button>
              </div>

              <div className="divide-y divide-border-dark">
                {recentActivity.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-text-secondary-dark italic">Aucune donnée enregistrée pour le moment.</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 md:p-6 hover:bg-white/[0.02] transition-colors">
                      {/* Icône de type d'activité dynamique */}
                      <div className={`mt-1 p-2.5 rounded-xl shrink-0 ${
                        activity.type === 'upload' ? 'bg-green-500/10 text-green-400' :
                        activity.type === 'download' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-primary/10 text-primary'
                      }`}>
                        <Download size={18} />
                      </div>
                      
                      {/* Détails de l'activité - Flex grow pour prendre l'espace */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <p className="font-semibold text-sm md:text-base text-text-primary-dark truncate">
                            {activity.description}
                          </p>
                          <span className="text-[11px] font-medium text-text-secondary-dark bg-background-dark px-2 py-0.5 rounded-md shrink-0 self-start sm:self-center">
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-text-secondary-dark mt-0.5">
                          Par <span className="text-text-primary-dark/80">{activity.user}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark flex flex-col md:flex-row">
      {/* Sidebar : S'adapte selon le composant AdminSidebar fourni */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Zone de contenu : Padding adaptatif (plus petit sur mobile) */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
}

/**
 * Composant interne pour les cartes de statistiques (Réutilisable et Responsive)
 */
function StatCard({ icon, title, value, label, color }) {
  return (
    <div className="bg-surface-dark p-5 md:p-6 rounded-2xl border border-border-dark hover:border-primary/30 transition-all group shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-background-dark rounded-xl border border-border-dark group-hover:scale-110 transition-transform ${color}`}>
          {icon}
        </div>
        <h3 className="text-sm md:text-base font-bold text-text-secondary-dark uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl md:text-4xl font-black text-white">{value}</p>
        <p className="text-xs text-text-secondary-dark font-medium truncate">{label}</p>
      </div>
      {/* Petite barre de progression décorative */}
      <div className="w-full h-1 bg-background-dark rounded-full mt-4 overflow-hidden">
        <div className={`h-full bg-current opacity-60 ${color}`} style={{ width: '65%' }}></div>
      </div>
    </div>
  );
}