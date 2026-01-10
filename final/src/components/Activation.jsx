import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, Loader2, CheckCircle, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

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

  const validateMatricule = (value) => {
    const upperMatricule = value.toUpperCase().trim();
    if (!upperMatricule.match(/^(AD|MAT)-\d+$/)) {
      return "Format invalide (ex: AD-123 ou MAT-456)";
    }
    const parts = upperMatricule.split('-');
    if (parts.length !== 2 || !parts[1]) return "Format invalide. Exemple: AD-123";
    if (!/^\d+$/.test(parts[1])) return "La partie après le tiret doit être numérique";
    return null;
  };

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleMatriculeChange = (e) => {
    const value = e.target.value;
    setMatricule(value);
    if (value.trim() === "") {
      setMatriculeError("");
    } else {
      const error = validateMatricule(value);
      setMatriculeError(error);
    }
  };

  const sendCode = async () => {
    const upperMatricule = matricule.toUpperCase().trim();
    const matriculeValidationError = validateMatricule(matricule);
    if (matriculeValidationError) {
      showNotification(matriculeValidationError, "error");
      return;
    }
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
        body: JSON.stringify({ matricule: upperMatricule, email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");
      showNotification("Code envoyé avec succès !", "success");
      setStep(2);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      showNotification("Le code doit contenir 6 chiffres", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code incorrect");
      showNotification("Code vérifié !", "success");
      setStep(3);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const finalActivation = async () => {
    if (!pseudo.trim() || password.length < 6 || password !== confirmPassword) {
      showNotification("Vérifiez vos informations", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), matricule: matricule.toUpperCase().trim(), pseudo: pseudo.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'activation");
      setStep(4);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full bg-black/40 border border-white/10 p-3.5 rounded-xl outline-none text-white placeholder-gray-500 transition-all duration-200 focus:border-[#CE0033] focus:ring-1 focus:ring-[#CE0033]/30";

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2 group-focus-within:text-[#CE0033] transition-colors">
                <User size={14} /> Matricule <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={matricule} 
                  onChange={handleMatriculeChange}
                  className={`${inputStyle} ${matriculeError ? 'border-red-500/50' : ''}`}
                  placeholder="Ex: AD-123 ou MAT-456" 
                  disabled={loading}
                />
              </div>
              {matriculeError && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5 px-1 animate-pulse">
                  <AlertCircle size={12} /> {matriculeError}
                </p>
              )}
            </div>
            
            <div className="group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2 group-focus-within:text-[#CE0033] transition-colors">
                <Mail size={14} /> Email Professionnel <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className={inputStyle}
                placeholder="nom@email.com" 
                disabled={loading}
              />
            </div>
            
            <button 
              onClick={sendCode} 
              disabled={loading || !!matriculeError || !matricule.trim() || !email.trim()}
              className="w-full py-4 rounded-xl font-black text-white transition-all duration-300 flex justify-center items-center gap-2 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#CE0033]/10"
              style={{ background: loading || matriculeError || !matricule.trim() || !email.trim() ? '' : '#CE0033' }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "RECEVOIR MON CODE"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-gray-400 text-sm mb-1">Code envoyé à :</p>
              <p className="text-white font-mono font-bold">{email}</p>
            </div>
            
            <div className="group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block text-center">
                Code de vérification (6 chiffres)
              </label>
              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${inputStyle} text-center tracking-[0.5em] text-2xl font-mono font-bold`}
                placeholder="000000" 
                disabled={loading}
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl font-bold border border-white/10 text-gray-400 hover:bg-white/5 transition-all">RETOUR</button>
              <button 
                onClick={verifyCode} 
                disabled={loading || code.length !== 6}
                className="flex-[2] py-3.5 rounded-xl font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:bg-gray-700"
                style={{ background: code.length === 6 ? '#CE0033' : '' }}
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "VÉRIFIER LE CODE"}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Pseudo</label>
              <input type="text" placeholder="Min. 3 caractères" value={pseudo} onChange={(e) => setPseudo(e.target.value)} className={inputStyle} disabled={loading} />
            </div>
            
            <div className="group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 caractères" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="group">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Confirmation</label>
              <input type="password" placeholder="Confirmez votre mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputStyle} ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''}`} disabled={loading} />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl font-bold border border-white/10 text-gray-400 hover:bg-white/5 transition-all">RETOUR</button>
              <button 
                onClick={finalActivation} 
                disabled={loading || !pseudo.trim() || password.length < 6 || password !== confirmPassword}
                className="flex-[2] py-3.5 rounded-xl font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:bg-gray-700 shadow-lg shadow-[#CE0033]/20"
                style={{ background: (!loading && pseudo.trim() && password.length >= 6 && password === confirmPassword) ? '#CE0033' : '' }}
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "ACTIVER LE COMPTE"}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                <CheckCircle size={80} className="text-green-500 mx-auto relative z-10" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2 italic">SUCCÈS !</h2>
              <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
                <p className="text-sm text-gray-400">Matricule : <span className="text-white font-bold">{matricule.toUpperCase()}</span></p>
                <p className="text-sm text-gray-400">Rôle : <span className="text-[#CE0033] font-bold uppercase tracking-widest">{matricule.toUpperCase().startsWith('AD-') ? 'Administrateur' : 'Stagiaire'}</span></p>
              </div>
            </div>
            <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl font-black text-white hover:brightness-125 transition-all shadow-xl shadow-[#CE0033]/20" style={{ background: '#CE0033' }}>
              SE CONNECTER MAINTENANT
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center p-4 z-[9999] overflow-hidden selection:bg-[#CE0033]/30"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-[#CE0033]/10 z-0"></div>
      
      {notification && (
        <div className={`fixed top-6 right-6 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[10000] animate-in slide-in-from-top-10 duration-300 backdrop-blur-md
          ${notification.type === 'error' ? 'bg-red-500/20 border border-red-500/50 text-red-200' : 'bg-green-500/20 border border-green-500/50 text-green-200'}`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-bold text-sm uppercase tracking-wide">{notification.message}</span>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/5">
          <div className="h-full bg-gradient-to-r from-[#CE0033] to-[#FF2E63] transition-all duration-700 ease-out" style={{ width: `${(step/4)*100}%` }}></div>
        </div>

        <div className="p-8 sm:p-12">
          <header className="mb-10 text-center">
            <h1 className="text-2xl font-black mb-2 text-white uppercase tracking-tighter">
                <span className="text-[#CE0033]">Activation</span> de Compte
            </h1>
            <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-300 ${step >= s ? 'w-8 bg-[#CE0033]' : 'w-4 bg-white/10'}`} />
                ))}
            </div>
          </header>

          {renderStepContent()}

          {step < 4 && (
            <button 
              onClick={() => navigate('/')} 
              className="w-full mt-8 text-xs font-bold text-gray-500 hover:text-[#CE0033] transition-colors uppercase tracking-widest"
            >
              Annuler l'opération
            </button>
          )}
        </div>
      </div>
    </div>
  );
}