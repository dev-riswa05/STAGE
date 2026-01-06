import React, { useState } from "react";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Image de fond
  const backgroundImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!identifier || !password) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Identifiants incorrects");
      }

      // --- ÉTAPE CRUCIALE : NETTOYAGE ET STOCKAGE ---
      localStorage.clear(); // Supprime les anciennes sessions
      localStorage.setItem("current_user", JSON.stringify(data.user));
      
      // Récupération du rôle en minuscules pour éviter les erreurs de casse
      const role = data.user.role ? data.user.role.toLowerCase() : "";
      console.log("Utilisateur connecté avec le rôle :", role);

      // --- LOGIQUE DE REDIRECTION FLEXIBLE ---
      if (role === "admin" || role === "administrateur") {
        console.log("Redirection vers le Dashboard Admin...");
        navigate("/admin-dashboard");
      } else if (role === "stagiaire" || role === "apprenant") {
        console.log("Redirection vers le Dashboard Stagiaire...");
        navigate("/dashboard");
      } else {
        console.warn("Rôle non reconnu, retour à l'accueil");
        navigate("/");
      }
      
    } catch (err) {
      console.error("Erreur de connexion:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex justify-center items-center relative p-4" 
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 z-0 bg-black/70"></div>

      <div className="w-full max-w-[420px] z-10">
        <form 
          onSubmit={handleLogin} 
          className="p-8 md:p-10 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10" 
          style={{ background: "rgba(25, 25, 25, 0.85)" }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "#CE0033" }}>
              Connexion
            </h1>
            <p className="text-gray-400 text-sm">Accédez à votre espace Simplon Hub</p>
          </div>

          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center gap-2 w-full mb-6 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </button>

          {error && (
            <div className="mb-6 p-3 rounded-lg text-red-200 bg-red-500/20 border border-red-500/40 text-sm text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">
              Pseudo ou Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#CE0033] transition-all"
              placeholder="Ex: AD-500 ou pseudo"
              disabled={loading}
            />
          </div>

          <div className="mb-8">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 block">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#CE0033] transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ 
              background: "linear-gradient(135deg, #CE0033 0%, #990026 100%)" 
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                Vérification...
              </span>
            ) : "Se connecter"}
          </button>

          <div className="mt-8 pt-6 border-t border-white/5 text-center"> 
            <button 
              type="button" 
              onClick={() => navigate('/activation')} 
              className="text-sm text-gray-400 hover:text-[#CE0033] transition-colors"
            >
              Pas encore de compte ? <span className="underline font-semibold">Activer mon accès</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}