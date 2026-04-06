"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, RefreshCcw, LogOut, Lock, 
  ExternalLink, Truck, Search, RotateCcw, User, Phone, Mail, UserPlus
} from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AdminControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState("");
  const [exists, setExists] = useState(false);
  const [partners, setPartners] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    batch_number: "",
    product_name: "",
    origin: "", 
    current_location: "Processing Facility",
    status: "Quality Certified",
    driver_name: "",
    driver_phone: "",
    buyer_email: "",
    fleet_manager_email: ""
  });

  // 1. FIX: Added a fetchPartners definition inside or outside to be stable
  const fetchPartners = useCallback(async () => {
    const { data, error } = await supabase
      .from("fleet_trucks")
      .select("owner_email");
    
    if (data) {
      const uniquePartners = Array.from(new Set(data.map(p => p.owner_email).filter(Boolean)));
      setPartners(uniquePartners as string[]);
    }
    if (error) console.error("Error fetching partners:", error.message);
  }, []);

  // 2. FIX: Improved Session Check with replace and stable dependencies
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || session.user.email !== "admin@seirei.com.ng") {
        router.replace("/login");
        return;
      }
      
      setIsAuth(true);
      fetchPartners();
    };
    checkSession();
  }, [router, fetchPartners]);

  // 3. FIX: Stable Auto-fill search logic
  const checkExistingBatch = useCallback(async (id: string) => {
    const cleanId = id.toUpperCase().trim();
    if (cleanId.length < 3) return;
    
    const { data } = await supabase
      .from("batches")
      .select("*")
      .eq("batch_number", cleanId)
      .maybeSingle();

    if (data) {
      setFormData({
        batch_number: data.batch_number,
        product_name: data.product_name || "",
        origin: data.origin || "",
        current_location: data.current_location || "",
        status: data.status || "Quality Certified",
        driver_name: data.driver_name || "",
        driver_phone: data.driver_phone || "",
        buyer_email: data.buyer_email || "",
        fleet_manager_email: data.fleet_manager_email || ""
      });
      setExists(true);
      setMessage(data.status === "Audit Verified" ? "NODE EXPIRED: Verification Complete." : "MATCH FOUND: Active Record.");
    } else {
      setExists(false);
      setMessage("");
    }
  }, []);

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
      let finalBatchId = formData.batch_number;
      
      if (!exists) {
        const companyName = "seirei";
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        finalBatchId = `${companyName}-${randomNum}`.toUpperCase();
      }

      const { error } = await supabase
        .from("batches")
        .upsert({ 
            ...formData, 
            batch_number: finalBatchId, 
            last_updated: new Date().toISOString() 
        }, { onConflict: "batch_number" });

      if (error) throw error;
      
      setFormData(prev => ({ ...prev, batch_number: finalBatchId }));
      setMessage(`SUCCESS: ${finalBatchId} secured in ledger.`);
      setExists(true);
    } catch (err: any) { 
      setMessage(`ERROR: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <RefreshCcw className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <header className="mb-10 border-b border-gray-900/60 pb-8 flex justify-between items-center">
        <h1 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
          <Lock className="text-cyan-500 w-5 h-5" /> 
          Super Admin <span className="text-cyan-500 font-light">Control</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/trucks">
            <button className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all shadow-inner">
              <Truck className="w-4 h-4" title="Fleet Inventory" />
            </button>
          </Link>
          <Link href="/admin/partners/onboard">
            <button className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all shadow-inner">
              <UserPlus className="w-4 h-4" title="Onboard Partner" />
            </button>
          </Link>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.replace("/login"))} 
            className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-red-500 transition-all shadow-inner"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 relative shadow-2xl mx-auto overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Select Partner (Enterprise Filter)</label>
              <select 
                value={selectedPartner || ""}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold appearance-none outline-none focus:border-cyan-600 transition-all"
              >
                <option value="">-- All Onboarded Partners --</option>
                {partners.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Consignment ID (Auto-Format)</label>
              <div className="relative">
                <input required type="text" name="batch_number" value={formData.batch_number} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white uppercase font-black text-xl tracking-tighter focus:border-cyan-600 outline-none transition-all" placeholder="SEIREI-0000" />
                <Search className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 ${exists ? "text-cyan-500" : "text-gray-900"}`} />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Classification</label>
              <input required type="text" name="product_name" value={formData.product_name} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-cyan-600" placeholder="e.g. Fresh Wheat Bran" />
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black flex items-center gap-2">
                <Mail className="w-3 h-3 text-cyan-600" /> Buyer Email (Recipient)
              </label>
              <input required type="email" name="buyer_email" value={formData.buyer_email} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-cyan-600" placeholder="buyer@client.com" />
            </div>

            <div>
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black flex items-center gap-2">
                <Truck className="w-3 h-3 text-cyan-600" /> Fleet Manager Email
              </label>
              <input required type="email" name="fleet_manager_email" value={formData.fleet_manager_email} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-cyan-600" placeholder="manager@fleetcompany.com" />
            </div>

            <div className="md:col-span-1">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black flex items-center gap-2">
                <User className="w-3 h-3" /> Driver Full Name
              </label>
              <input type="text" name="driver_name" value={formData.driver_name} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-cyan-600" />
            </div>

            <div className="md:col-span-1">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black flex items-center gap-2">
                <Phone className="w-3 h-3" /> Driver Contact
              </label>
              <input type="text" name="driver_phone" value={formData.driver_phone} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-cyan-500 font-black outline-none focus:border-cyan-600" placeholder="+234..." />
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">System Lifecycle Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-cyan-500 font-black appearance-none outline-none focus:border-cyan-600">
                <option value="Quality Certified">01: Origin (Awaiting Dispatch)</option>
                <option value="In Transit - Sealed">02: Transit (Active GPS)</option>
                <option value="Audit Verified">03: Handover (EXPIRES TERMINAL)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] text-gray-600 uppercase tracking-[0.3em] block mb-3 font-black">Manufacturing Source / Origin</label>
              <input required type="text" name="origin" value={formData.origin} onChange={handleChange} className="w-full bg-[#050505] border border-gray-800 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-cyan-600" />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className={`text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-lg border ${formData.status === "Audit Verified" ? "text-red-500 bg-red-950/10 border-red-900/30" : "text-cyan-500 bg-cyan-950/10 border-cyan-900/30"}`}>
                {message || (exists ? "EXISTING RECORD LOADED" : "READY FOR NEW ENTRY")}
              </div>

              {formData.status === "Audit Verified" && (
                <button type="button" onClick={handleReset} className="flex items-center gap-2 text-[9px] text-orange-500 hover:text-orange-400 font-black uppercase tracking-widest transition-all">
                  <RotateCcw className="w-3 h-3" /> Reactivate Driver Terminal
                </button>
              )}

              {exists && formData.status !== "Audit Verified" && (
                <div className="flex gap-2">
                   <Link 
                     href={`/driver/${formData.batch_number.toUpperCase()}`} 
                     target="_blank" 
                     className="flex items-center gap-2 text-[9px] text-cyan-400 hover:text-white font-black uppercase tracking-widest bg-cyan-950/10 px-4 py-2 rounded-lg border border-cyan-900/20"
                   >
                     <ExternalLink className="w-3 h-3" /> Driver Link
                   </Link>
                   <Link 
                     href={`/fleet/${formData.batch_number.toUpperCase()}`} 
                     target="_blank" 
                     className="flex items-center gap-2 text-[9px] text-emerald-400 hover:text-white font-black uppercase tracking-widest bg-emerald-950/10 px-4 py-2 rounded-lg border border-emerald-900/20"
                   >
                     <Truck className="w-3 h-3" /> Fleet Link
                   </Link>
                </div>
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