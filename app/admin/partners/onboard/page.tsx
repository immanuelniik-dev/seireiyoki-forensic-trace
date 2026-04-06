"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { LogOut, ShieldCheck, Activity, Building2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer"; // Using '@' alias is safer for deep paths

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const SUPER_ADMIN_EMAIL = "admin@seirei.com.ng";

export default function OnboardPartner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [partners, setPartners] = useState<any[]>([]);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fleet_trucks")
      .select("owner_email, company_name, active")
      .order('owner_email', { ascending: true });
    
    if (data) {
      const uniquePartners = Array.from(
        new Map(data.map(item => [item.owner_email, item])).values()
      );
      setPartners(uniquePartners);
    }
    if (error) console.error("Error fetching partners:", error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== SUPER_ADMIN_EMAIL) {
        router.replace("/login");
        return;
      }
      
      setIsAuth(true);
      fetchPartners();
    };
    checkSession();
  }, [router, fetchPartners]);

  const handleOnboardPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Authorizing Partner...");
    setLoading(true);

    try {
      const { error } = await supabase
        .from("fleet_trucks")
        .insert({
          owner_email: partnerEmail.trim().toLowerCase(),
          company_name: companyName.trim() || "Independent Partner",
          plate_number: "SYSTEM-INIT", 
          tracker_device_id: "PENDING",
          tracker_provider: "SEIREI_CORE",
          active: true 
        });

      if (error) throw error;
      
      setMessage(`SUCCESS: Authorized ${companyName || partnerEmail}`);
      setPartnerEmail("");
      setCompanyName("");
      fetchPartners();
    } catch (err: any) {
      setMessage(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePartnerStatus = async (email: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("fleet_trucks")
        .update({ active: !currentStatus })
        .eq("owner_email", email);
      
      if (error) throw error;
      setMessage(`Partner status updated successfully.`);
      fetchPartners();
    } catch (err: any) {
      setMessage(`Update Failed: ${err.message}`);
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
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="flex-grow text-gray-300 font-mono p-6 md:p-12">
        <header className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-gray-900 pb-8">
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
              <Building2 className="text-cyan-500 w-6 h-6" /> Partner <span className="text-cyan-500 font-light">Onboarding</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/admin">
              <button className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all">
                <ShieldCheck className="w-4 h-4" />
              </button>
            </Link>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.replace("/login"))} 
              className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-red-500 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600"></div>
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-8">Provision Partner</h3>
            <form onSubmit={handleOnboardPartner} className="space-y-6">
              <div>
                <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">Partner Email</label>
                <input required type="email" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-5 px-6 text-sm text-white focus:border-cyan-600 outline-none transition-all" placeholder="partner@email.com" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block">Company Name</label>
                <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-5 px-6 text-sm text-white focus:border-cyan-600 outline-none transition-all" placeholder="e.g. Dangote Logistics" />
              </div>
              <button disabled={loading} className="w-full bg-cyan-950 text-cyan-400 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-cyan-600 hover:text-white transition-all shadow-lg active:scale-95 flex justify-center items-center gap-3">
                {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                AUTHORIZE PARTNER
              </button>
            </form>
          </div>

          <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl h-fit">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-8 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" /> Network Partners
            </h3>
            <ul className="space-y-4">
              {partners.map((partner, index) => (
                <li key={index} className="flex items-center justify-between p-6 bg-gray-950/40 rounded-2xl border border-gray-900">
                  <div>
                    <p className="text-sm font-black text-white tracking-tighter uppercase">{partner.company_name || "New Partner"}</p>
                    <p className="text-[10px] text-gray-600 font-mono mt-1">{partner.owner_email}</p>
                  </div>
                  <button 
                    onClick={() => handleTogglePartnerStatus(partner.owner_email, !!partner.active)} 
                    className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${partner.active ? "text-emerald-500 border-emerald-900/50 hover:bg-emerald-500/10" : "text-red-500 border-red-900/50 hover:bg-red-500/10"}`}
                    disabled={loading}
                  >
                    {partner.active ? "Active" : "Disabled"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </main>

        {message && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-cyan-400 text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl border border-cyan-900/50 z-50">
            {message}
          </div>
        )}
      </div>

    </div>
  );
}