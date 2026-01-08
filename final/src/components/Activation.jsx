import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, Loader2, CheckCircle, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Activation() {
  const [step, setStep] = useState(1);
  const [matricule, setMatricule] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [matriculeError, setMatriculeError] = useState("");
  
  const navigate = useNavigate();

  const bgImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920";

  // Fonction de validation du matricule
  const validateMatricule = (value) => {
    const upperMatricule = value.toUpperCase().trim();
    
    // Vérifier le format AD-xxx ou MAT-xxx
    if (!upperMatricule.match(/^(AD|MAT)-\d+$/)) {
      return "Format invalide. Utilisez AD-xxx ou MAT-xxx (ex: AD-123 ou MAT-456)";
    }
    
    // Vérifier que les chiffres après le tiret sont présents
    const parts = upperMatricule.split('-');
    if (parts.length !== 2 || !parts[1]) {
      return "Format invalide. Exemple: AD-123";
    }
    
    // Vérifier que la partie numérique contient bien des chiffres
    if (!/^\d+$/.test(parts[1])) {
      return "La partie après le tiret doit être numérique";
    }
    
    return null;
  };

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Gestion du changement de matricule avec validation en temps réel
  const handleMatriculeChange = (e) => {
    const value = e.target.value;
    setMatricule(value);
    
    // Validation en temps réel
    if (value.trim() === "") {
      setMatriculeError("");
    } else {
      const error = validateMatricule(value);
      setMatriculeError(error);
    }
  };

  // ÉTAPE 1 : Envoi du code par email
  const sendCode = async () => {
    const upperMatricule = matricule.toUpperCase().trim();
    
    // Validation finale du matricule avant envoi
    const matriculeValidationError = validateMatricule(matricule);
    if (matriculeValidationError) {
      showNotification(matriculeValidationError, "error");
      return;
    }

    if (!email) {
      showNotification("Veuillez remplir votre email !", "error");
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Veuillez entrer un email valide !", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          matricule: upperMatricule, 
          email: email.toLowerCase().trim() 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");
      
      showNotification("Code envoyé avec succès ! Vérifiez votre boîte mail.", "success");
      setStep(2);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ÉTAPE 2 : Vérification du code reçu
  const verifyCode = async () => {
    if (!code) {
      showNotification("Veuillez entrer le code !", "error");
      return;
    }
    
    // Vérifier que le code contient uniquement 6 chiffres
    if (!/^\d{6}$/.test(code)) {
      showNotification("Le code doit contenir 6 chiffres", "error");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          code 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code incorrect");
      
      showNotification("Code vérifié avec succès !", "success");
      setStep(3);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ÉTAPE 3 : Création finale du compte (Pseudo + MDP)
  const finalActivation = async () => {
    // Validation des champs
    if (!pseudo.trim()) {
      showNotification("Veuillez choisir un pseudo !", "error");
      return;
    }
    
    if (pseudo.length < 3) {
      showNotification("Le pseudo doit contenir au moins 3 caractères", "error");
      return;
    }
    
    if (!password || !confirmPassword) {
      showNotification("Veuillez remplir les mots de passe !", "error");
      return;
    }
    
    if (password.length < 6) {
      showNotification("Le mot de passe doit contenir au moins 6 caractères", "error");
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification("Les mots de passe ne correspondent pas !", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          matricule: matricule.toUpperCase().trim(), 
          pseudo: pseudo.trim(), 
          password 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'activation");
      
      showNotification("Compte activé avec succès ! Vous pouvez maintenant vous connecter.", "success");
      setStep(4);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Rendu du formulaire selon l'étape
  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">
                Matricule <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center bg-black/40 border p-3 rounded-xl focus-within:border-[#CE0033] ${
                matriculeError ? 'border-red-500/50' : 'border-white/10'
              }`}>
                <User className="mr-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={matricule} 
                  onChange={handleMatriculeChange}
                  className="bg-transparent outline-none w-full text-white placeholder-gray-500" 
                  placeholder="Ex: AD-123 ou MAT-456" 
                  disabled={loading}
                />
              </div>
              {matriculeError && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {matriculeError}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format requis: AD-xxx (Administrateur) ou MAT-xxx (Stagiaire)
              </p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">
                Email Professionnel <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center bg-black/40 border border-white/10 p-3 rounded-xl focus-within:border-[#CE0033]">
                <Mail className="mr-3 text-gray-500" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-transparent outline-none w-full text-white placeholder-gray-500" 
                  placeholder="nom@email.com" 
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              onClick={sendCode} 
              disabled={loading || !!matriculeError || !matricule.trim() || !email.trim()}
              className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: loading || matriculeError || !matricule.trim() || !email.trim() ? '#555' : '#CE0033',
                backgroundColor: loading || matriculeError || !matricule.trim() || !email.trim() ? '#555' : '#CE0033'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Envoi en cours...
                </>
              ) : "Recevoir mon code d'activation"}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">Un code à 6 chiffres a été envoyé à :</p>
              <p className="text-white font-bold text-base mb-1">{email}</p>
              <p className="text-gray-400 text-xs">Vérifiez également vos spams</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">
                Code de vérification <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center bg-black/40 border border-white/10 p-3 rounded-xl focus-within:border-[#CE0033]">
                <Key className="mr-3 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => {
                    // Accepter uniquement les chiffres
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(value);
                  }}
                  className="bg-transparent outline-none w-full text-white text-center tracking-widest font-bold text-xl" 
                  placeholder="000000" 
                  maxLength="6"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-center">
                Entrez les 6 chiffres reçus par email
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-medium border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400"
                disabled={loading}
              >
                Retour
              </button>
              <button 
                onClick={verifyCode} 
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: loading || code.length !== 6 ? '#555' : '#CE0033',
                  backgroundColor: loading || code.length !== 6 ? '#555' : '#CE0033'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Vérification...
                  </>
                ) : "Vérifier le code"}
              </button>
            </div>
            
            <button 
              onClick={sendCode}
              className="w-full text-sm text-gray-400 hover:text-white underline"
              disabled={loading}
            >
              Renvoyer le code
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">
                Choisissez un pseudo <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Votre pseudo (min. 3 caractères)" 
                value={pseudo} 
                onChange={(e) => setPseudo(e.target.value)} 
                className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#CE0033] outline-none placeholder-gray-500"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Mot de passe (min. 6 caractères)" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#CE0033] outline-none placeholder-gray-500"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <input 
                type="password" 
                placeholder="Retapez votre mot de passe" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#CE0033] outline-none placeholder-gray-500"
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl font-medium border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400"
                disabled={loading}
              >
                Retour
              </button>
              <button 
                onClick={finalActivation} 
                disabled={loading || !pseudo.trim() || password.length < 6 || password !== confirmPassword}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: loading || !pseudo.trim() || password.length < 6 || password !== confirmPassword ? '#555' : '#CE0033',
                  backgroundColor: loading || !pseudo.trim() || password.length < 6 || password !== confirmPassword ? '#555' : '#CE0033'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Activation...
                  </>
                ) : "Activer mon compte"}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <CheckCircle size={80} className="text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Félicitations !</h2>
              <p className="text-gray-300 mb-1">Votre compte a été activé avec succès</p>
              <p className="text-sm text-gray-400">
                Matricule: <span className="font-bold text-white">{matricule.toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-400">
                Rôle: <span className="font-bold text-white">
                  {matricule.toUpperCase().startsWith('AD-') ? 'Administrateur' : 'Stagiaire'}
                </span>
              </p>
            </div>
            <button 
              onClick={() => navigate('/login')} 
              className="w-full py-4 rounded-xl font-bold text-white hover:bg-[#A50029] transition-all duration-300"
              style={{ background: '#CE0033' }}
            >
              Se connecter maintenant
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Retour à l'accueil
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-4 z-[9999] overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      <div className="absolute inset-0 bg-black/75 z-0"></div>
      
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-2xl flex items-center gap-3 z-[10000] animate-bounce-in
          ${notification.type === 'error' ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'bg-green-500/20 border border-green-500/50 text-green-400'}`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md bg-[#1E1E1E]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-white/10">
          <div className="h-full bg-[#CE0033] transition-all duration-500" style={{ width: `${(step/4)*100}%` }}></div>
        </div>

        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold mb-2 text-center text-[#CE0033]">Activation de Compte</h1>
          <p className="text-gray-400 text-center text-sm mb-8">
            {step < 4 ? `Étape ${step} sur 3` : 'Compte activé avec succès !'}
          </p>

          {renderStepContent()}

          {step < 4 && step > 1 && (
            <button 
              onClick={() => navigate('/')} 
              className="w-full mt-8 text-sm text-gray-500 hover:text-white underline"
            >
              Annuler l'activation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}