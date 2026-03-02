"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Save, Loader2, Key, Camera } from "lucide-react";

export default function PerfilClient() {
  const { data: session, update } = useSession() ?? {};
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwSection, setShowPwSection] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        setProfile(data.user);
        setForm({ name: data.user?.name ?? "", phone: data.user?.phone ?? "" });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const payload: any = { name: form.name, phone: form.phone };
      if (showPwSection && pwForm.newPassword) {
        if (pwForm.newPassword !== pwForm.confirmPassword) { setError("As senhas não coincidem"); return; }
        if (pwForm.newPassword.length < 6) { setError("Senha mínimo 6 caracteres"); return; }
        payload.currentPassword = pwForm.currentPassword;
        payload.newPassword = pwForm.newPassword;
      }
      const res = await fetch("/api/user/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) { setProfile(data.user); setMsg("Perfil atualizado com sucesso!"); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else setError(data.error ?? "Erro ao salvar");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F]" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500 text-sm">Gerencie suas informações pessoais e senha</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A5F] to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {(profile?.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
              profile?.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}>{profile?.role === "ADMIN" ? "Administrador" : "Colaborador"}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={profile?.email ?? ""} disabled
                className="w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button onClick={() => setShowPwSection(!showPwSection)}
              className="flex items-center gap-2 text-sm font-medium text-[#1E3A5F] hover:underline">
              <Key className="w-4 h-4" /> {showPwSection ? "Ocultar" : "Alterar senha"}
            </button>
          </div>

          {showPwSection && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              {[
                { label: "Senha atual", key: "currentPassword" },
                { label: "Nova senha", key: "newPassword" },
                { label: "Confirmar nova senha", key: "confirmPassword" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="password" value={(pwForm as any)[key]} onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-sm bg-white" />
                </div>
              ))}
            </div>
          )}

          {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">{msg}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Alterações
          </button>
        </div>
      </motion.div>
    </div>
  );
}
