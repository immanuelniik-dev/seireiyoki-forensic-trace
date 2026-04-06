"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Lock, ShieldCheck, ArrowRight, Loader2, Mail, UserPlus, RefreshCcw } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);



const SUPER_ADMIN_EMAIL = "admin@seirei.com.ng"; 

export default function SmartGate() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email === SUPER_ADMIN_EMAIL) {
          router.push("/admin");
        } else {
          router.push("/fleet");
        }
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/fleet`,
          },
        });
        if (signUpError) throw signUpError;
        setSuccess("Account Created. Check your email for verification.");
        setIsSignUp(false);
      } else {
        // --- LOGIN LOGIC ---
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) throw authError;

        if (data?.user) {
          // BREAK THE LOOP: Hard redirect forces the browser to send cookies to Middleware
          if (data.user.email === SUPER_ADMIN_EMAIL) {
            router.push("/admin");
          } else {
            router.push("/fleet");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Operation Failed");
    } finally {
      // We only stop loading if there was an error. 
      // If successful, the page will redirect.
      if (error) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono text-gray-300">
      <div className="w-full max-w-md bg-[#080808] border border-gray-900 rounded-[3rem] p-10 relative shadow-2xl overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
        )}
        
        <header className="text-center mb-8">
          <div className="inline-flex p-4 bg-cyan-950/10 rounded-2xl mb-4 border border-cyan-900/20 text-cyan-500">
            {loading ? <RefreshCcw className="w-8 h-8 animate-spin" /> : (isSignUp ? <UserPlus className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />)}
          </div>
          <h1 className="text-xl font-black text-white uppercase italic tracking-tighter">
            {isSignUp ? "Partner Registration" : "Secure Terminal"}
          </h1>
          <p className="text-[8px] text-gray-600 tracking-[0.4em] mt-2 uppercase italic font-bold">
            {loading ? "Synchronizing Forensic Ledger..." : (isSignUp ? "Join the Logistics Network" : "Integrity Ledger Access")}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-4 italic">Credential Identity</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-black border border-gray-900 rounded-2xl py-5 pl-14 pr-6 text-sm text-white outline-none focus:border-cyan-600 font-bold transition-all" 
                placeholder="email@company.com" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] text-gray-600 uppercase font-black tracking-widest ml-4 italic">Passkey Verification</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-black border border-gray-900 rounded-2xl py-5 pl-14 pr-6 text-sm text-cyan-500 outline-none focus:border-cyan-600 transition-all font-black tracking-widest" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-950/10 border border-red-900/30 p-4 rounded-xl text-[9px] text-red-500 uppercase font-black text-center">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-xl text-[9px] text-emerald-500 uppercase font-black text-center">
              {success}
            </div>
          )}

          <button 
            disabled={loading} 
            className="w-full bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isSignUp ? "Create Partner ID" : "Authorize Access"} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
                className="text-[9px] text-gray-500 hover:text-cyan-500 font-black uppercase tracking-widest transition-colors outline-none"
            >
                {isSignUp ? "Existing Partner? Log In" : "New Fleet Manager? Register Account"}
            </button>
        </div>

        <footer className="mt-8 text-center border-t border-gray-900/50 pt-6">
          <p className="text-[7px] text-gray-800 uppercase tracking-[0.5em] leading-relaxed font-black italic">
            SeireiYoki Supply Chain Forensics • v2.6.0
          </p>
        </footer>
      </div>
    </div>
  );
}
