"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, RefreshCcw, LogOut, Lock, 
  ExternalLink, Truck, Search, RotateCcw, User, Phone
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AuthenticationControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState("");
  const [exists, setExists] = useState(false);
  
  const [formData, setFormData] = useState({
    batch_number: "",
    product_name: "",
    origin: "", 
    current_location: "Processing Facility",
    status: "Quality Certified",
    driver_name: "",
    driver_phone: ""
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else setIsAuth(true);
    };
    checkSession();
  }, [router]);

  // AUTO-FILL SEARCH LOGIC
  const checkExistingBatch = useCallback(async (id: string) => {
    if (id.length < 3) return;
    
    const { data } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_number", id.toUpperCase().trim())
      .maybeSingle();

    if (data) {
      setFormData({
        batch_number: data.batch_number,
        product_name: data.product_name || "",
        origin: data.origin || "",
        current_location: data.current_location || "",
        status: data.status || "Quality Certified",
        driver_name: data.driver_name || "",
        driver_phone: data.driver_phone || ""
      });
      setExists(true);
      setMessage(data.status === "Audit Verified" ? "NODE EXPIRED: Verification Complete." : "MATCH FOUND: Active Record.");
    } else {
      setExists(false);
      setMessage("");
    }
  }, []);

  // RESET FUNCTION FOR EXPIRED LINKS
  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("batches")
      .update({ 
        status: "In Transit - Sealed", 
        current_location: "Transit Authorization Reset" 
      })
      .eq("batch_number", formData.batch_number);
    
    if (!error) {
      setFormData(prev => ({ ...prev, status: "In Transit - Sealed" }));
      setMessage("SUCCESS: Terminal Authorization Restored.");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "batch_number") checkExistingBatch(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Synchronizing Ledger...");

    try {
      const cleanID = formData.batch_number.toUpperCase().trim();
      const { error } = await supabase
        .from("batches")
        .upsert({ 
            ...formData, 
            batch_number: cleanID, 
            last_updated: new Date().toISOString() 
        }, { onConflict: 'batch_number' });

      if (error) throw error;
      setMessage(`SUCCESS: ${cleanID} secured in ledger.`);
      setExists(true);
    } catch (err: any) { 
      setMessage(`ERROR: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      
      <header className="mb-10 border-b border-gray-900/60 pb-8 flex justify-between items-center">
        <h1 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
          <Lock className="text-cyan-500 w-5 h-5" /> 
          Authentication <span className="text-cyan-500 font-light">Control</span>
        </h1>
        <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-[10px] text-red-900 font-black uppercase tracking-widest hover:text-red-500 transition-colors">
          <LogOut className="w-3 h-3 inline mr-2" /> Terminate Session
        </button>
      </header>

      <div className="max-w-4xl bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 relative shadow-2xl mx-auto overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CONSIGNMENT SEARCH & ID */}
            <div className="relative">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Consignment ID</label>
              <div className="relative">
                <input required type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white uppercase font-black text-xl tracking-tighter focus:border-cyan-600 outline-none transition-all" />
                <Search className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 ${exists ? "text-cyan-500" : "text-gray-900"}`} />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Classification</label>
              <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold" placeholder="e.g. Fresh Wheat Bran" />
            </div>

            {/* DRIVER DETAILS SECTION */}
            <div className="md:col-span-1">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black flex items-center gap-2">
                <User className="w-3 h-3" /> Driver Full Name
              </label>
              <input type="text" name="driver_name" value={formData.driver_name} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold" />
            </div>

            <div className="md:col-span-1">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black flex items-center gap-2">
                <Phone className="w-3 h-3" /> Driver Contact
              </label>
              <input type="text" name="driver_phone" value={formData.driver_phone} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-cyan-500 font-black" placeholder="+234..." />
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">System Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-cyan-500 font-black appearance-none">
                <option value="Quality Certified">01: Origin (Awaiting Dispatch)</option>
                <option value="In Transit - Sealed">02: Transit (Active GPS)</option>
                <option value="Audit Verified">03: Handover (EXPIRES TERMINAL)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Manual Ref Location</label>
              <input required type="text" name="current_location" value={formData.current_location} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Manufacturing Source / Origin</label>
              <input required type="text" name="origin" value={formData.origin} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white" />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className={`text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-lg border ${formData.status === "Audit Verified" ? "text-red-500 bg-red-950/10 border-red-900/30" : "text-cyan-500 bg-cyan-950/10 border-cyan-900/30"}`}>
                {message || (exists ? "EXISTING RECORD LOADED" : "READY FOR NEW ENTRY")}
              </div>

              {/* REACTIVATE DRIVER LINK */}
              {formData.status === "Audit Verified" && (
                <button type="button" onClick={handleReset} className="flex items-center gap-2 text-[9px] text-orange-500 hover:text-orange-400 font-black uppercase tracking-widest transition-all">
                  <RotateCcw className="w-3 h-3" /> Reactivate Driver Terminal
                </button>
              )}

              {/* LIVE TERMINAL LINK */}
              {exists && formData.status !== "Audit Verified" && (
                <Link 
                  href={`/driver/${formData.batch_number.toUpperCase()}`} 
                  target="_blank" 
                  className="flex items-center gap-2 text-[9px] text-cyan-400 hover:text-white font-black uppercase tracking-widest bg-cyan-950/10 px-4 py-2 rounded-lg border border-cyan-900/20"
                >
                  <ExternalLink className="w-3 h-3" /> Driver Terminal Link
                </Link>
              )}
            </div>

            <button disabled={loading} type="submit" className="w-full md:w-auto bg-cyan-950 hover:bg-cyan-600 text-white px-10 py-5 rounded-2xl uppercase tracking-[0.4em] text-[10px] font-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-4">
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {exists ? "UPDATE LEDGER" : "CREATE LEDGER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}