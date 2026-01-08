import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, User, LogOut, Users, BarChart3, 
  Search, Download, Bell, Menu, X, PlusCircle, ShieldCheck
} from 'lucide-react';

// 1. Item de navigation individuel
const SidebarItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-[#CE0033] text-white shadow-lg shadow-[#CE0033]/20' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
      <span className="font-semibold text-sm tracking-wide">{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[#CE0033]/20 text-[#CE0033]'}`}>
        {badge}
      </span>
    )}
  </button>
);

// 2. Carte utilisateur
const UserInfoCard = ({ user, onLogout }) => (
  <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#CE0033] to-red-500 flex items-center justify-center font-bold text-white shadow-inner shrink-0 uppercase">
          {user?.pseudo?.substring(0, 2) || "U"}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-white truncate">{user?.pseudo || "Utilisateur"}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#CE0033] font-black italic">
            {user?.matricule?.startsWith('AD-') ? 'ADMIN' : 'STAGIAIRE'}
          </p>
        </div>
      </div>
      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
      >
        <LogOut size={14} /> Déconnexion
      </button>
    </div>
  </div>
);

// 3. Structure de base
const BaseSidebar = ({ children, user, open, setOpen }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('current_user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-[#CE0033] rounded flex items-center justify-center text-white font-bold">S</div>
           <span className="text-white font-black text-sm">CODE HUB</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 bg-white/5 rounded-lg text-white">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[80] w-72 bg-[#0D0D0F] border-r border-white/5 p-6 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-[#CE0033] flex items-center justify-center rounded-lg shadow-lg shadow-[#CE0033]/20">
            <span className="font-black text-2xl text-white">S</span> 
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-tight text-white">
            SIMPLON CODE <span className="text-[#CE0033]">HUB</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          {children}
        </nav>

        <UserInfoCard user={user} onLogout={handleLogout} />
      </aside>
    </>
  );
};

// ===== SIDEBAR ADMIN =====
export const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  const nav = (tab, path) => {
    if (setActiveTab) setActiveTab(tab);
    navigate(path);
    setOpen(false);
  };

  const handleSubmitProject = () => {
    navigate('/submission');
    setOpen(false);
  };

  return (
    <BaseSidebar user={currentUser} open={open} setOpen={setOpen}>
      
    
      <SidebarItem 
        icon={BarChart3} 
        label="Tableau de bord" 
        active={activeTab === 'dashboard'} 
        onClick={() => nav('dashboard', '/admin-dashboard')} 
      />
      <SidebarItem 
        icon={Search} 
        label="Bibliothèque" 
        onClick={() => nav('explore', '/explore')} 
      />
      <SidebarItem 
        icon={Users} 
        label="Utilisateurs" 
        active={activeTab === 'users'} 
        onClick={() => nav('users', '/admin-users')} 
      />
      <SidebarItem 
        icon={Folder} 
        label="Gestion Projets" 
        active={activeTab === 'projects'} 
        onClick={() => nav('projects', '/admin-projects')} 
      />
      <SidebarItem 
        icon={Bell} 
        label="Notifications" 
        active={activeTab === 'notifications'} 
        onClick={() => nav('notifications', '/notifications')} 
      />
      <SidebarItem 
        icon={Download} 
        label="Téléchargements" 
        active={activeTab === 'downloads'} 
        onClick={() => nav('downloads', '/downloads')} 
      />
      <SidebarItem 
        icon={User} 
        label="Profil Personnel" 
        active={activeTab === 'profile'} 
        onClick={() => nav('profile', '/profile')} 
      />
    </BaseSidebar>
  );
};

// ===== SIDEBAR APPRENANT (STAGIAIRE) =====
export const UserSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  const nav = (tab, path) => {
    if (setActiveTab) setActiveTab(tab);
    navigate(path);
    setOpen(false);
  };

  const handleSubmitProject = () => {
    navigate('/submission');
    setOpen(false);
  };

  return (
    <BaseSidebar user={currentUser} open={open} setOpen={setOpen}>
      <div className="mb-6 px-1">
        <button 
          onClick={handleSubmitProject}
          className="w-full bg-white text-black hover:bg-[#CE0033] hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
        >
          <PlusCircle size={16} /> Déposer un Projet
        </button>
      </div>
      
      <SidebarItem 
        icon={BarChart3} 
        label="Mon Dashboard" 
        active={activeTab === 'dashboard'} 
        onClick={() => nav('dashboard', '/dashboard')} 
      />
      <SidebarItem 
        icon={Folder} 
        label="Mes Dépôts" 
        active={activeTab === 'projects'} 
        onClick={() => nav('projects', '/user-projects')} 
      />
      <SidebarItem 
        icon={Search} 
        label="Bibliothèque" 
        active={activeTab === 'explore'} 
        onClick={() => nav('explore', '/explore')} 
      />
      <SidebarItem 
        icon={Download} 
        label="Téléchargements" 
        active={activeTab === 'downloads'} 
        onClick={() => nav('downloads', '/downloads')} 
      />
      <SidebarItem 
        icon={User} 
        label="Profil Personnel" 
        active={activeTab === 'profile'} 
        onClick={() => nav('profile', '/profile')} 
      />
    </BaseSidebar>
  );
};