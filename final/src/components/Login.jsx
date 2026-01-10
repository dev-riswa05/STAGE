import React, { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [debugMode, setDebugMode] = useState(false);

  const navigate = useNavigate();

  const backgroundImage =
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";

  // Vérifier la connexion au backend au démarrage
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log("🔍 Vérification du backend...");
        const response = await fetch("http://localhost:5001/api/health");
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Backend connecté:", data);
          setBackendStatus("connected");
          setSuccess(`Backend connecté (${data.users_count} utilisateurs)`);
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setBackendStatus("error");
          console.error("❌ Backend erreur:", response.status);
        }
      } catch (err) {
        setBackendStatus("error");
        console.error("❌ Impossible de joindre le backend:", err);
      }
    };

    checkBackend();

    // Vérifier si déjà connecté
    const isAuth = localStorage.getItem("isAuthenticated");
    const userData = localStorage.getItem("current_user");

    if (isAuth === "true" && userData) {
      try {
        const user = JSON.parse(userData);
        console.log("👤 Utilisateur déjà connecté:", user.pseudo);

        // Redirection automatique
        if (user.role === "admin" || user.matricule?.startsWith("AD-")) {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      } catch (e) {
        console.error("❌ Erreur parsing user data:", e);
        localStorage.removeItem("current_user");
        localStorage.removeItem("isAuthenticated");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation
    if (!identifier.trim()) {
      setError("Veuillez entrer votre email ou pseudo");
      return;
    }

    if (!password.trim()) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    console.log("🔄 Tentative de connexion...");
    console.log("Identifiant:", identifier);
    console.log("URL: http://localhost:5001/api/login");

    try {
      const startTime = Date.now();

      const response = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim()
        })
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Temps de réponse: ${responseTime}ms`);
      console.log("📊 Status:", response.status, response.statusText);

      // Lire la réponse
      const responseText = await response.text();
      console.log("📄 Réponse brute:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Erreur parsing JSON:", parseError);
        throw new Error("Le serveur a retourné une réponse invalide");
      }

      if (!response.ok) {
        const errorMessage = data.error || `Erreur ${response.status}: ${response.statusText}`;
        console.error("❌ Erreur serveur:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ Connexion réussie!");
      console.log("👤 Utilisateur:", data.user);
      console.log("📍 Redirection:", data.redirectTo);

      // Stocker les données utilisateur
      if (data.user) {
        localStorage.setItem("current_user", JSON.stringify(data.user));
        localStorage.setItem("isAuthenticated", "true");
        console.log("💾 Données sauvegardées");
      }

      // Afficher un message de succès
      setSuccess(`Connexion réussie! Bienvenue ${data.user?.pseudo || ""}`);

      // Redirection après un court délai
      setTimeout(() => {
        if (data.redirectTo) {
          navigate(data.redirectTo);
        } else {
          // Fallback selon le rôle
          const userRole = data.user?.role;
          const matricule = data.user?.matricule;

          if (userRole === "admin" || (matricule && matricule.startsWith("AD-"))) {
            navigate("/admin-dashboard");
          } else {
            navigate("/dashboard");
          }
        }
      }, 1500);

    } catch (err) {
      console.error("❌ Erreur complète:", err);

      // Messages d'erreur personnalisés
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setError(
          "Impossible de se connecter au serveur. Vérifiez que:\n" +
          "1. Le backend est démarré (port 5001)\n" +
          "2. Aucun blocage CORS\n" +
          "3. Le serveur est accessible"
        );
      } else if (err.message.includes("JSON")) {
        setError("Le serveur a retourné une réponse invalide");
      } else if (err.message.includes("401") || err.message.includes("incorrect")) {
        setError("Identifiant ou mot de passe incorrect");
      } else {
        setError(err.message || "Une erreur est survenue lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("🔍 Test de connexion au backend...");
      const response = await fetch("http://localhost:5001/api/health");
      const data = await response.json();

      if (response.ok) {
        const message = `✅ Backend OK!\nUtilisateurs: ${data.users_count}\nProjets: ${data.projects_count}\nTéléchargements: ${data.downloads_count}`;
        setSuccess(message);
        setBackendStatus("connected");
        console.log("📊 Stats backend:", data);
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("❌ Test échoué:", err);
      setError("Impossible de joindre le backend sur le port 5001");
      setBackendStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    setSuccess("LocalStorage vidé avec succès");
    console.log("🧹 LocalStorage vidé");
    setTimeout(() => {
      setSuccess("");
      window.location.reload();
    }, 1500);
  };

  const showDebugInfo = () => {
    console.log("=== DEBUG INFO ===");
    console.log("Identifier:", identifier);
    console.log("Password:", password ? "***" : "(vide)");
    console.log("Backend Status:", backendStatus);
    console.log("LocalStorage current_user:", localStorage.getItem("current_user"));
    console.log("LocalStorage isAuthenticated:", localStorage.getItem("isAuthenticated"));
    console.log("=== END DEBUG ===");
    setDebugMode(!debugMode);
  };

  // Indicateur de statut backend
  const getBackendStatusIcon = () => {
    switch (backendStatus) {
      case "connected":
        return <CheckCircle2 size={14} className="text-green-500" />;
      case "error":
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <Server size={14} className="text-yellow-500" />;
    }
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center items-center relative p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay sombre */}
      <div className="absolute inset-0 z-0 bg-black/75 backdrop-blur-sm"></div>

      {/* Carte de connexion */}
      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in duration-300">
        <form
          onSubmit={handleLogin}
          className="p-8 md:p-10 rounded-2xl shadow-2xl border border-white/10"
          style={{ background: "rgba(20, 20, 20, 0.95)" }}
        >
          {/* En-tête */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-[#CE0033]">
              Connexion
            </h1>
            <p className="text-gray-400 text-sm mb-2">Simplon Code Hub</p>
            
            {/* Indicateur backend */}
           
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="mb-6 p-4 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div className="whitespace-pre-line">{error}</div>
              </div>
            </div>
          )}

          {/* Messages de succès */}
          {success && (
            <div className="mb-6 p-4 rounded-xl text-green-400 bg-green-500/10 border border-green-500/20 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                <div className="whitespace-pre-line">{success}</div>
              </div>
            </div>
          )}

          {/* Champs de formulaire */}
          <div className="space-y-5">
            {/* Identifiant */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Email ou Pseudo
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#CE0033] transition-colors disabled:opacity-50"
                placeholder="exemple@simplon.com ou monpseudo"
                required
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-[#CE0033] transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password.trim()}
              className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed mt-4 transition-all duration-300 hover:bg-[#A50029] hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: loading || !identifier.trim() || !password.trim()
                  ? "#555"
                  : "#CE0033"
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </div>

          {/* Liens et outils */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-4">
            {/* Lien activation */}
            <button
              type="button"
              onClick={() => navigate("/activation")}
              className="text-sm text-gray-400 hover:text-[#CE0033] transition-colors disabled:opacity-30"
              disabled={loading}
            >
              Pas encore de compte ?{" "}
              <span className="font-bold underline">Activer l'accès</span>
            </button>

            {/* Retour accueil */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-gray-500 hover:text-white flex items-center justify-center gap-1 transition-colors disabled:opacity-30"
              disabled={loading}
            >
              <ArrowLeft size={12} /> Retour à l'accueil
            </button>

           

            {/* Info debug mode */}
            {debugMode && (
              <div className="mt-2 p-3 bg-gray-900/50 rounded-lg text-left">
                <p className="text-xs text-gray-400 font-mono">
                  <strong>Identifier:</strong> {identifier}<br/>
                  <strong>Backend:</strong> {backendStatus}<br/>
                  <strong>LocalStorage:</strong> {localStorage.getItem("isAuthenticated") ? "OK" : "Empty"}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify({
                    identifier,
                    backendStatus,
                    storage: {
                      current_user: localStorage.getItem("current_user"),
                      isAuthenticated: localStorage.getItem("isAuthenticated")
                    }
                  }))}
                  className="text-xs text-gray-500 hover:text-gray-300 mt-2"
                >
                  Copier les infos
                </button>
              </div>
            )}
          </div>
        </form>

       
      </div>
    </div>
  );
}