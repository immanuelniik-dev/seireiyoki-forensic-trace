"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, Save, Factory, Droplets, 
  Globe, CheckCircle, RefreshCcw, 
  AlertTriangle, LogOut, Lock, ExternalLink
} from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthenticationControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    batch_number: "",
    product_name: "",
    origin: "", 
    current_location: "Processing Facility",
    status: "Quality Certified",
    protein_percent: "",
    moisture_percent: ""
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setIsAuth(true);
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Authenticating Batch Data...");

    try {
      const cleanBatchNumber = formData.batch_number.toUpperCase().trim();
      const { error } = await supabase
        .from("batches")
        .upsert(
          {
            batch_number: cleanBatchNumber,
            product_name: formData.product_name || "Industrial Consignment",
            origin: formData.origin,
            current_location: formData.current_location,
            status: formData.status,
            protein_percent: formData.protein_percent ? parseFloat(formData.protein_percent) : null,
            moisture_percent: formData.moisture_percent ? parseFloat(formData.moisture_percent) : null,
            last_updated: new Date().toISOString(),
          },
          { onConflict: 'batch_number' } 
        );

      if (error) throw error;
      setMessage(`AUTHENTICATED: ${cleanBatchNumber} synchronized.`);
    } catch (error: any) {
      setMessage(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
      // We don't clear the message immediately so the Driver Link remains visible
    }
  };

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12 selection:bg-cyan-900 selection:text-white">
      
      <header className="mb-10 border-b border-gray-900/60 pb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
            <Lock className="text-cyan-500 w-8 h-8" />
            Authentication <span className="text-cyan-500 font-light italic text-2xl">Control</span>
          </h1>
          <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-[0.5em] font-black">
            Personnel: Secure Access Active
          </p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-[10px] text-red-900 hover:text-red-500 transition-colors uppercase tracking-widest font-black border border-red-950/30 px-5 py-2 rounded-xl bg-red-950/5"
        >
          <LogOut className="w-3 h-3" /> Terminate Session
        </button>
      </header>

      <div className="max-w-4xl bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl mx-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
        
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-lg text-white flex items-center gap-4 font-black tracking-widest uppercase italic">
            <Globe className="w-5 h-5 text-cyan-500" />
            Consignment Registration
          </h2>
          <div className="flex items-center gap-2 text-[8px] text-cyan-500 uppercase tracking-widest bg-cyan-950/20 px-4 py-1.5 rounded-full border border-cyan-900/40">
            <ShieldCheck className="w-2.5 h-2.5" /> Encryption Active
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-3 font-black">Consignment ID</label>
              <input required type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white focus:border-cyan-600 transition-all uppercase font-black text-2xl tracking-tighter shadow-inner" />
            </div>

            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-3 font-black">Cargo Classification</label>
              <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} placeholder="e.g. Industrial Premix" className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white focus:border-cyan-600 font-bold shadow-inner" />
            </div>

            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-3 font-black">Authentication Node</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-cyan-500 focus:border-cyan-500 appearance-none cursor-pointer font-black tracking-widest shadow-inner">
                <option value="Quality Certified">01: Dispatch Origin</option>
                <option value="In Transit - Sealed">02: Transit Security</option>
                <option value="Delivered - Awaiting Audit">03: Hub Verification</option>
                <option value="Audit Verified">04: Handover Authenticated</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-3 font-black">Physical Geo-Location</label>
              <input required type="text" name="current_location" value={formData.current_location} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white shadow-inner" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] text-gray-600 uppercase tracking-widest block mb-3 font-black">Manufacturing Source</label>
              <input required type="text" name="origin" value={formData.origin} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white shadow-inner" />
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-4">
              <div className={`text-[10px] font-black tracking-[0.3em] uppercase px-5 py-2.5 rounded-xl border ${message.includes('ERROR') ? 'text-red-500 bg-red-950/10 border-red-900/40' : 'text-cyan-500 bg-cyan-950/10 border-cyan-900/40'}`}>
                {message || "Terminal Status: Ready"}
              </div>
              
              {/* NEW: DRIVER TERMINAL LINK GENERATOR */}
              {message.includes('AUTHENTICATED') && (
                <Link 
                  href={`/driver/${formData.batch_number.toUpperCase()}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-white transition-all text-[9px] uppercase font-black tracking-widest"
                >
                  <ExternalLink className="w-3 h-3" /> Open Driver Stealth Terminal
                </Link>
              )}
            </div>

            <button disabled={loading} type="submit" className="w-full md:w-auto bg-cyan-950 hover:bg-cyan-600 text-cyan-100 border border-cyan-800 px-14 py-6 rounded-2xl uppercase tracking-[0.4em] text-xs font-black flex items-center justify-center gap-5 transition-all active:scale-95 shadow-[0_15px_40px_rgba(6,182,212,0.15)]">
              {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? "AUTHENTICATING..." : "AUTHORIZE SHIPMENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}