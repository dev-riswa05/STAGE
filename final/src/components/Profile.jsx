import React, { useMemo } from 'react';
import { User, Mail, Shield, Hash, Calendar } from 'lucide-react';
import { UserSidebar } from '../components/Sidebar';

const Profile = () => {
  const user = useMemo(() => JSON.parse(localStorage.getItem('current_user') || '{}'), []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex">
      <UserSidebar activeTab="profile" />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto bg-[#161618] rounded-3xl border border-white/5 p-8 mt-10">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-24 h-24 bg-[#CE0033] rounded-full flex items-center justify-center text-4xl font-black">
              {user.pseudo?.[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">{user.pseudo}</h1>
              <p className="text-[#CE0033] font-bold uppercase text-sm tracking-widest">{user.role}</p>
            </div>
          </div>

          <div className="space-y-6">
            <InfoRow icon={<Mail size={20}/>} label="Email" value={user.email} />
            <InfoRow icon={<Hash size={20}/>} label="Matricule" value={user.matricule} />
            <InfoRow icon={<Shield size={20}/>} label="Statut du compte" value="Activé" />
          </div>
        </div>
      </main>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
    <div className="text-gray-500">{icon}</div>
    <div>
      <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  </div>
);

export default Profile;