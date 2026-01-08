import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Imports des composants (Vérifie que les chemins de fichiers sont exacts)
import Home from "./components/Home";
import Login from "./components/Login";
import Activation from "./components/Activation";
import DashboardUser from "./components/DashboardUser";
import DashboardAdmin from "./components/DashboardAdmin";
import Submission from "./components/Submission";
import Explore from "./components/Explore";
import AdminUsers from "./components/AdminUsers";
import AdminProjects from "./components/AdminProjects";

import UserProjectsPage from "./components/UserProjectsPage";
import ProjectDetails from "./components/ProjectDetails"; 
import MyDownloads from "./components/MyDownloads";
import Notifications from "./components/Notifications";
import Profile from "./components/Profile";

// --- PROTECTION DES ROUTES ---
// Vérifie si l'utilisateur est connecté et possède le bon rôle
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  const role = currentUser.role ? currentUser.role.toLowerCase() : "";
  
  // Normalisation des rôles pour éviter les erreurs de frappe (Stagiaire/Apprenant)
  const isAdmin = (role === 'admin' || role === 'administrateur');
  const isUser = (role === 'stagiaire' || role === 'apprenant' || role === 'utilisateur');

  if (allowedRoles.length > 0) {
    if (allowedRoles.includes('admin') && !isAdmin) return <Navigate to="/" replace />;
    if (allowedRoles.includes('stagiaire') && !isUser) return <Navigate to="/" replace />;
  }
  
  return children;
};

// --- LOGIQUE DE MISE EN PAGE ---
function AppContent() {
  const location = useLocation();
  
  // Pages qui ne doivent pas avoir la barre latérale (Sidebar)
  const fullWidthRoutes = ["/", "/login", "/activation"];
  const isFullWidthPage = fullWidthRoutes.includes(location.pathname);

  return (
    // On applique le décalage de la sidebar (pl-64) uniquement si on n'est pas sur une page plein écran
    <div className={`min-h-screen bg-[#050506] text-white ${isFullWidthPage ? "" : "lg:pl-64"}`}>
      <Routes>
        {/* --- ROUTES PUBLIQUES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activation" element={<Activation />} />
        
        {/* --- ESPACE UTILISATEUR (STAGIAIRE) --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['stagiaire']}>
            <DashboardUser />
          </ProtectedRoute>
        } />
        
        <Route path="/submission" element={
          <ProtectedRoute allowedRoles={['stagiaire']}>
            <Submission />
          </ProtectedRoute>
        } />
          
        {/* --- ESPACE ADMINISTRATION --- */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardAdmin />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        
        <Route path="/admin-projects" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProjects />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Notifications />
          </ProtectedRoute>
        } />
        
        {/* --- ROUTES COMMUNES (PROFIL & EXPLORATION) --- */}
        <Route path="/explore" element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        } />
        
       

        {/* C'est ici que l'utilisateur voit SES propres dépôts via la BDD */}
        <Route path="/user-projects" element={
          <ProtectedRoute>
            <UserProjectsPage />
          </ProtectedRoute>
        } />
        
        {/* Page de détails technique d'un projet spécifique */}
        <Route path="/project/:id" element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        } />

        <Route path="/downloads" element={
          <ProtectedRoute>
            <MyDownloads />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />  

        {/* Redirection automatique si la page n'existe pas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// --- POINT D'ENTRÉE PRINCIPAL ---
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}