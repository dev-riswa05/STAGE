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
  const navigate = useNavigate();

  const bgImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920";

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ÉTAPE 1 : Envoi du code par email
  const sendCode = async () => {
    const upperMatricule = matricule.toUpperCase().trim();
    
    // Validation du format du matricule
    if (!upperMatricule.startsWith("AD-") && !upperMatricule.startsWith("MAT-")) {
      showNotification("Le matricule doit commencer par AD- ou MAT-", "error");
      return;
    }

    if (!matricule || !email) {
      showNotification("Veuillez remplir matricule et email !", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule: upperMatricule, email }),
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

  // ÉTAPE 2 : Vérification du code reçu
  const verifyCode = async () => {
    if (!code) {
      showNotification("Veuillez entrer le code !", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
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

  // ÉTAPE 3 : Création finale du compte (Pseudo + MDP)
  const finalActivation = async () => {
    if (!pseudo || !password || !confirmPassword) {
      showNotification("Veuillez remplir tous les champs !", "error");
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
          email, 
          matricule: matricule.toUpperCase(), 
          pseudo, 
          password 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur activation");
      
      showNotification("Compte activé avec succès !", "success");
      setStep(4);
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
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

      <div className="relative z-10 w-full max-w-md bg-[#1E1E1E]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-white/10">
          <div className="h-full bg-[#CE0033] transition-all duration-500" style={{ width: `${(step/4)*100}%` }}></div>
        </div>

        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold mb-2 text-center text-[#CE0033]">Activation Compte</h1>
          <p className="text-gray-400 text-center text-xs mb-8">
            {step < 4 ? `Étape ${step} sur 3` : 'Félicitations'}
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Matricule (AD- ou MAT-)</label>
                <div className="flex items-center bg-black/40 border border-white/10 p-3 rounded-xl focus-within:border-[#CE0033]">
                  <User className="mr-3 text-gray-500" size={18} />
                  <input type="text" value={matricule} onChange={(e) => setMatricule(e.target.value)} 
                    className="bg-transparent outline-none w-full text-white" placeholder="Ex: AD-101" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Email Professionnel</label>
                <div className="flex items-center bg-black/40 border border-white/10 p-3 rounded-xl focus-within:border-[#CE0033]">
                  <Mail className="mr-3 text-gray-500" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                    className="bg-transparent outline-none w-full text-white" placeholder="nom@gmail.com" />
                </div>
              </div>
              <button onClick={sendCode} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-[#CE0033] hover:bg-[#A50029] flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin" /> : "Recevoir mon code"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center text-gray-300 text-sm">Entrez le code envoyé à <br/><span className="text-white font-bold">{email}</span></div>
              <div className="flex items-center bg-black/40 border border-white/10 p-3 rounded-xl focus-within:border-[#CE0033]">
                <Key className="mr-3 text-gray-500" size={18} />
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} 
                  className="bg-transparent outline-none w-full text-white text-center tracking-widest font-bold text-xl" placeholder="000000" />
              </div>
              <button onClick={verifyCode} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-[#CE0033] flex justify-center">
                {loading ? <Loader2 className="animate-spin" /> : "Vérifier le code"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <input type="text" placeholder="Pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} 
                className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#CE0033] outline-none" />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#CE0033] outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input type="password" placeholder="Confirmer" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#CE0033] outline-none" />
              <button onClick={finalActivation} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-[#CE0033] flex justify-center mt-4">
                {loading ? <Loader2 className="animate-spin" /> : "Finaliser l'activation"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-6">Compte Activé !</h2>
              <button onClick={() => navigate('/login')} className="w-full py-4 rounded-xl font-bold bg-[#CE0033]">Se connecter</button>
            </div>
          )}

          {step < 4 && (
            <button onClick={() => navigate('/')} className="w-full mt-6 text-sm text-gray-500 hover:text-white underline">Annuler</button>
          )}
        </div>
      </div>
    </div>
  );
}