import React, { useState, useEffect } from 'react';
import { 
  Bell, Trash2, CheckCircle, Upload, Download, User, Clock,
  Eye, AlertCircle, Loader2, RefreshCw, LogIn, LogOut, 
  Mail, Calendar, Shield, Activity, Database
} from 'lucide-react';
import { AdminSidebar } from './Sidebar';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_BASE_URL = 'http://localhost:5000';

  // Charger les activités depuis l'API
  const loadNotifications = async () => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/admin/activities`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convertir les activités en format notification
      const formattedNotifications = data.map(activity => ({
        id: activity.id,
        type: getActivityType(activity.action),
        message: getActivityMessage(activity),
        userName: activity.user_name,
        email: activity.user_id, // Vous pourriez récupérer l'email depuis la DB
        projectName: extractProjectName(activity.details),
        timestamp: activity.timestamp || new Date().toISOString(),
        rawData: activity // Garder les données brutes pour debug
      }));
      
      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError('Impossible de charger les activités');
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le type d'activité
  const getActivityType = (action) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('inscription') || actionLower.includes('activation')) {
      return 'activation';
    }
    if (actionLower.includes('projet') || actionLower.includes('créé') || actionLower.includes('upload')) {
      return 'project';
    }
    if (actionLower.includes('téléchargement') || actionLower.includes('download')) {
      return 'download';
    }
    if (actionLower.includes('connexion') || actionLower.includes('login')) {
      return 'login';
    }
    if (actionLower.includes('suppression') || actionLower.includes('delete')) {
      return 'delete';
    }
    return 'system';
  };

  // Générer un message lisible
  const getActivityMessage = (activity) => {
    const { action, details, user_name } = activity;
    
    switch (getActivityType(action)) {
      case 'activation':
        return `${user_name || 'Un utilisateur'} a créé un compte`;
      case 'project':
        const projectMatch = details?.match(/Projet créé: (.+)/);
        return projectMatch 
          ? `${user_name} a publié un projet: "${projectMatch[1]}"`
          : `${user_name} a publié un nouveau projet`;
      case 'download':
        const fileMatch = details?.match(/Fichier téléchargé: (.+)/);
        return fileMatch 
          ? `${user_name} a téléchargé: "${fileMatch[1]}"`
          : `${user_name} a téléchargé un fichier`;
      case 'login':
        return `${user_name} s'est connecté`;
      case 'delete':
        return `${user_name} a supprimé une ressource`;
      default:
        return details || action;
    }
  };

  // Extraire le nom du projet des détails
  const extractProjectName = (details) => {
    if (!details) return null;
    const match = details.match(/Projet (?:créé|supprimé): (.+?)(?:$|\.)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    loadNotifications();
    
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(loadNotifications, 10000); // Rafraîchir toutes les 10s
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // Supprimer une notification (et l'activité correspondante)
  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/activity/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      // Fallback: suppression locale
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  // Vider tout l'historique
  const clearAllNotifications = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les activités ?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/activities`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Erreur suppression globale:', err);
        setNotifications([]);
      }
    }
  };

  // Retourne l'icône correspondante
  const getNotificationIcon = (type) => {
    const iconProps = { size: 20, style: { color: '#CE0033' } };
    
    switch(type) {
      case 'activation':
        return <CheckCircle {...iconProps} />;
      case 'project':
        return <Upload {...iconProps} />;
      case 'download':
        return <Download {...iconProps} />;
      case 'login':
        return <LogIn {...iconProps} />;
      case 'logout':
        return <LogOut {...iconProps} />;
      case 'delete':
        return <Trash2 {...iconProps} />;
      case 'system':
        return <Activity {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Retourne le titre formaté
  const getNotificationTitle = (type) => {
    switch(type) {
      case 'activation':
        return 'Activation de compte';
      case 'project':
        return 'Nouveau projet';
      case 'download':
        return 'Téléchargement';
      case 'login':
        return 'Connexion';
      case 'logout':
        return 'Déconnexion';
      case 'delete':
        return 'Suppression';
      case 'system':
        return 'Activité système';
      default:
        return 'Notification';
    }
  };

  // Formate la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrage
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  // Types disponibles pour les filtres
  const filterTypes = [
    { label: 'Tous', value: 'all', icon: <Database size={14} /> },
    { label: 'Activations', value: 'activation', icon: <CheckCircle size={14} /> },
    { label: 'Projets', value: 'project', icon: <Upload size={14} /> },
    { label: 'Téléchargements', value: 'download', icon: <Download size={14} /> },
    { label: 'Connexions', value: 'login', icon: <LogIn size={14} /> },
    { label: 'Système', value: 'system', icon: <Activity size={14} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenu principal */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 pt-20 md:pt-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* En-tête */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                <Bell className="text-[#CE0033]" size={32} />
                Centre de Surveillance
              </h1>
              <p className="text-gray-400">
                Activités en temps réel de la plateforme • {notifications.length} activité{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={loadNotifications}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-sm hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          {/* Filtres */}
          <div className="flex flex-wrap gap-3 mb-8">
            {filterTypes.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  filter === f.value 
                    ? 'bg-[#CE0033] text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-900 rounded">
                  {f.value === 'all' 
                    ? notifications.length 
                    : notifications.filter(n => n.type === f.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Liste des notifications */}
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin inline-block text-[#CE0033] mb-4" size={40} />
              <p className="text-gray-400">Chargement des activités...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-gray-800 bg-gray-900/50">
              <Bell size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">
                {filter === 'all' ? 'Aucune activité' : 'Aucune activité de ce type'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {filter === 'all' 
                  ? "Les activités des utilisateurs apparaîtront ici"
                  : `Aucune activité de type "${filter}" pour le moment`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-[#CE0033]/30 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1">
                            {getNotificationTitle(notification.type)}
                          </h3>
                          <p className="text-gray-300">{notification.message}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(notification.timestamp)}
                          </span>
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Métadonnées */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400 mt-4 pt-4 border-t border-gray-800">
                        {notification.userName && (
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {notification.userName}
                          </span>
                        )}
                        
                        {notification.projectName && (
                          <span className="flex items-center gap-1">
                            <Database size={14} />
                            Projet: {notification.projectName}
                          </span>
                        )}
                        
                        {notification.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            ID: {notification.email}
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Shield size={14} />
                          <span className="capitalize">{notification.type}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistiques */}
          {notifications.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBlock 
                label="Activations" 
                count={notifications.filter(n => n.type === 'activation').length} 
                icon={<CheckCircle size={20} className="text-green-500" />}
              />
              <StatBlock 
                label="Projets" 
                count={notifications.filter(n => n.type === 'project').length} 
                icon={<Upload size={20} className="text-blue-500" />}
              />
              <StatBlock 
                label="Téléchargements" 
                count={notifications.filter(n => n.type === 'download').length} 
                icon={<Download size={20} className="text-purple-500" />}
              />
              <StatBlock 
                label="Connexions" 
                count={notifications.filter(n => n.type === 'login').length} 
                icon={<LogIn size={20} className="text-yellow-500" />}
              />
            </div>
          )}

          {/* Info sur le fonctionnement */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm">
            <div className="flex items-start gap-3">
              <Eye size={20} className="mt-0.5" />
              <div>
                <p className="font-medium mb-1">Surveillance en temps réel</p>
                <p className="text-blue-300/80">
                  Cette page affiche toutes les activités des utilisateurs : inscriptions, publications de projets, 
                  téléchargements, connexions, etc. Les données sont synchronisées avec la base de données en temps réel.
                </p>
                <div className="mt-2 text-xs text-blue-300/60">
                  {autoRefresh ? 'Actualisation automatique toutes les 10 secondes' : 'Actualisation manuelle'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Composant StatBlock
const StatBlock = ({ label, count, icon }) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
    <div className="p-2 bg-gray-800 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  </div>
);

export default Notifications;