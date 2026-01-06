import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, Upload, Download, User, Clock } from 'lucide-react';
import { AdminSidebar } from './Sidebar';

const Notifications = () => {
  // --- ÉTATS (STATE) ---
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // Filtres : all, activation, project, download

  // --- EFFETS (SIDE EFFECTS) ---
  useEffect(() => {
    loadNotifications();
    
    // Rafraîchir les notifications toutes les 5 secondes pour le "temps réel"
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);
    
    return () => clearInterval(interval); // Nettoyage de l'intervalle au démontage
  }, []);

  // --- LOGIQUE MÉTIER ---
  
  // Charger les notifications depuis le localStorage
  const loadNotifications = () => {
    try {
      const storedNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      setNotifications(storedNotifications);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une notification spécifique par son ID
  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  // Vider tout l'historique après confirmation
  const clearAllNotifications = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications?')) {
      localStorage.setItem('admin_notifications', JSON.stringify([]));
      setNotifications([]);
    }
  };

  // --- HELPERS (FONCTIONS UTILITAIRES DE RENDU) ---

  // Retourne l'icône correspondante au type de notification
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'activation':
        return <CheckCircle size={20} style={{ color: '#CE0033' }} />;
      case 'project':
        return <Upload size={20} style={{ color: '#CE0033' }} />;
      case 'download':
        return <Download size={20} style={{ color: '#CE0033' }} />;
      default:
        return <Bell size={20} style={{ color: '#CE0033' }} />;
    }
  };

  // Retourne le titre formaté selon le type
  const getNotificationTitle = (type) => {
    switch(type) {
      case 'activation':
        return 'Activation de compte';
      case 'project':
        return 'Nouveau projet';
      case 'download':
        return 'Téléchargement';
      default:
        return 'Notification';
    }
  };

  // Formate la date de manière relative (ex: "Il y a 5 min")
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000); 

    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
    
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filtrage des données avant affichage
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  // --- RENDU (JSX) ---
  return (
    <div className="flex h-screen" style={{ background: '#121212', color: '#E0E0E0' }}>
      {/* Barre latérale Administration */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Zone de contenu principale */}
      <div className="flex-1 overflow-auto" style={{ background: '#121212' }}>
        <div className="p-8">
          
          {/* En-tête de page */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: '#E0E0E0' }}>
                <Bell size={32} style={{ color: '#CE0033' }} />
                Centre de Notifications
              </h1>
              <p className="text-text-secondary-dark">Recevez les mises à jour en temps réel</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 rounded-lg hover:opacity-80 transition"
                style={{ background: '#CE0033', color: '#E0E0E0' }}
              >
                Effacer tout
              </button>
            )}
          </div>

          {/* Section Filtres */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {[
              { label: 'Tous', value: 'all' },
              { label: 'Activations', value: 'activation' },
              { label: 'Projets', value: 'project' },
              { label: 'Téléchargements', value: 'download' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-4 py-2 rounded-lg transition"
                style={{
                  background: filter === f.value ? '#CE0033' : '#2a2a2a',
                  color: filter === f.value ? '#E0E0E0' : '#B0B0B0'
                }}
              >
                {f.label}
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: '#1d1d1d' }}>
                  {f.value === 'all' 
                    ? notifications.length 
                    : notifications.filter(n => n.type === f.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Liste Dynamique des Notifications */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <Bell size={32} />
              </div>
              <p className="mt-4 text-text-secondary-dark">Chargement...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* État vide */
            <div className="text-center py-16 rounded-lg border" style={{ background: '#1d1d1d', borderColor: '#2a2a2a' }}>
              <Bell size={48} className="mx-auto mb-4" style={{ color: '#444' }} />
              <p className="text-xl" style={{ color: '#B0B0B0' }}>Aucune notification</p>
              <p className="text-text-secondary-dark">Vous serez notifié lors d'événements clés.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-5 rounded-lg border flex items-start justify-between hover:shadow-lg transition"
                  style={{ background: '#1d1d1d', borderColor: '#2a2a2a' }}
                >
                  <div className="flex gap-4 flex-1">
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" style={{ color: '#E0E0E0' }}>
                        {getNotificationTitle(notification.type)}
                      </h3>
                      <p className="text-text-secondary-dark mb-2">{notification.message}</p>
                      
                      {/* Détails supplémentaires (Utilisateur, Email, Projet) */}
                      <div className="text-xs text-text-secondary-dark space-y-1">
                        {notification.userName && (
                          <p className="flex items-center gap-2">
                            <User size={14} /> {notification.userName}
                          </p>
                        )}
                        {notification.email && <p>{notification.email}</p>}
                        {notification.projectName && (
                          <p>Projet: <span style={{ color: '#E0E0E0' }}>{notification.projectName}</span></p>
                        )}
                      </div>

                      {/* Horodatage */}
                      <p className="text-xs flex items-center gap-1" style={{ color: '#888', marginTop: '0.5rem' }}>
                        <Clock size={12} /> {formatDate(notification.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Bouton de suppression individuelle */}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="ml-4 p-2 rounded-lg transition flex-shrink-0 text-[#B0B0B0] hover:text-[#CE0033] hover:bg-[#CE003320]"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section Statistiques Rapides */}
          {notifications.length > 0 && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <StatBlock label="Activations" count={notifications.filter(n => n.type === 'activation').length} />
              <StatBlock label="Projets" count={notifications.filter(n => n.type === 'project').length} />
              <StatBlock label="Téléchargements" count={notifications.filter(n => n.type === 'download').length} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SOUS-COMPOSANT POUR LES STATS ---
const StatBlock = ({ label, count }) => (
  <div className="p-4 rounded-lg" style={{ background: '#1d1d1d', borderLeft: '4px solid #CE0033' }}>
    <p className="text-text-secondary-dark text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold" style={{ color: '#CE0033' }}>{count}</p>
  </div>
);

export default Notifications;