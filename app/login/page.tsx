"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, User, Activity } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("AUTHORIZATION DENIED: Invalid Credentials.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-md bg-[#0c0c0c] border border-gray-800 rounded-3xl p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
        
        <div className="text-center mb-10">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Command Access</h1>
          <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase mt-2 font-bold">Secure Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Personnel ID (Email)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#050505] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-red-600 outline-none transition-all" placeholder="admin@seireiyoki.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Access Cipher (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#050505] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-red-600 outline-none transition-all" placeholder="••••••••" />
            </div>
          </div>

          {error && <p className="text-[10px] text-red-500 uppercase tracking-widest font-black text-center">{error}</p>}

          <button disabled={loading} type="submit" className="w-full bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 flex items-center justify-center gap-3">
            {loading ? <Activity className="w-4 h-4 animate-spin" /> : "Authorize Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}