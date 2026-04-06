"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { LogOut, ShieldCheck, Activity, Building2, RefreshCcw, ArrowLeft, Mail, Lock } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function PartnerOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyName: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== "admin@seirei.com.ng") {
        router.replace("/login");
        return;
      }
      setIsAuth(true);
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("INITIATING PARTNER NODE...");

    try {
      // 1. Create the Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.companyName,
            role: "fleet_manager",
          }
        }
      });

      if (authError) throw authError;

      // 2. We don't necessarily need to insert into a profile table if 
      // your app logic relies on the auth metadata, but we'll add a success message.
      setMessage(`SUCCESS: ${formData.companyName} ONBOARDED.`);
      setFormData({ email: "", password: "", companyName: "" });
      
    } catch (err: any) {
      setMessage(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCcw className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 flex flex-col">
      <header className="max-w-4xl mx-auto w-full mb-10 border-b border-gray-900/60 pb-8 flex justify-between items-center">
        <Link href="/admin" className="text-[10px] tracking-widest uppercase font-black flex items-center gap-2 text-gray-600 hover:text-cyan-500 transition-all">
          <ArrowLeft className="w-3 h-3" /> Back to Terminal
        </Link>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-cyan-500 w-5 h-5" />
          <h1 className="text-sm font-black text-white uppercase italic tracking-tighter">Partner <span className="text-cyan-500">Provisioning</span></h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 relative shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
          
          <div className="mb-8 text-center">
             <Building2 className="w-10 h-10 text-gray-800 mx-auto mb-4" />
             <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.3em]">Identity Enrollment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Partner Legal Name</label>
              <div className="relative">
                <input 
                  required 
                  type="text" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-cyan-600 transition-all" 
                  placeholder="e.g. Dangote Logistics" 
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Authorized Email</label>
              <div className="relative">
                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" />
                <input 
                  required 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-cyan-600 transition-all" 
                  placeholder="partner@enterprise.com" 
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Security Credentials</label>
              <div className="relative">
                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" />
                <input 
                  required 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-cyan-600 transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div className={`text-[8px] font-black tracking-widest uppercase text-center py-2 ${message.includes('ERROR') ? 'text-red-500' : 'text-cyan-500'}`}>
              {message}
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-cyan-950 hover:bg-cyan-600 text-white py-5 rounded-2xl uppercase tracking-[0.4em] text-[10px] font-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-4"
            >
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Generate Node
            </button>
          </form>
        </div>
      </main>

      {/* Inline Replacement for broken Footer import */}
      <footer className="max-w-4xl mx-auto w-full mt-10 border-t border-gray-900/60 pt-8 text-center">
        <p className="text-[8px] text-gray-700 uppercase font-bold tracking-[0.5em]">
          &copy; 2026 Seirei Forensic Trace • Yoki Technology Ltd
        </p>
      </footer>
    </div>
  );
}