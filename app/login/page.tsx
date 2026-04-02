"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Lock, ShieldCheck, ArrowRight, Loader2, Mail } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// CHANGE THIS TO YOUR ACTUAL ADMIN EMAIL
const SUPER_ADMIN_EMAIL = "immanuelniik@gmail.com"; 

export default function SmartLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email === SUPER_ADMIN_EMAIL) router.push("/admin");
        else router.push("/fleet");
      }
    }
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        // SMART REDIRECT LOGIC
        if (data.user.email === SUPER_ADMIN_EMAIL) {
          router.push("/admin");
        } else {
          router.push("/fleet");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication Failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono text-gray-300">
      <div className="w-full max-w-md bg-[#080808] border border-gray-900 rounded-[3rem] p-10 relative shadow-2xl overflow-hidden">
        {/* Top Glow Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        
        <header className="text-center mb-10">
          <div className="inline-flex p-4 bg-cyan-950/10 rounded-2xl mb-4 border border-cyan-900/20">
            <ShieldCheck className="w-8 h-8 text-cyan-500" />
          </div>
          <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">Secure Terminal</h1>
          <p className="text-[9px] text-gray-600 tracking-[0.4em] mt-2 uppercase">Integrity Ledger Access</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-4">Credential Identity</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input 
                required
                type="email" 
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-gray-900 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:border-cyan-600 outline-none transition-all placeholder:text-gray-800 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-4">Passkey Verification</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input 
                required
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-900 rounded-2xl py-5 pl-14 pr-6 text-sm text-cyan-500 focus:border-cyan-600 outline-none transition-all placeholder:text-gray-800"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-950/10 border border-red-900/30 p-4 rounded-xl text-[10px] text-red-500 uppercase font-black text-center animate-pulse">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all disabled:opacity-20 shadow-lg shadow-cyan-900/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Authorize Access <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-[8px] text-gray-800 uppercase tracking-widest leading-relaxed px-4">
            Authorized Personnel Only. All session data is cryptographically logged for forensic audit.
          </p>
        </footer>
      </div>
    </div>
  );
}