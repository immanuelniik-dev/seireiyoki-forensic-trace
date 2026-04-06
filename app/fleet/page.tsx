"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Truck, Package, ChevronRight, ShieldCheck, LogOut, History, Info, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const DynamicManagerFleetMap = dynamic(
  () => import("@/components/Map/ManagerFleetMap"),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-900 animate-pulse rounded-[2rem]" />
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FleetDashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedTruckLogs, setSelectedTruckLogs] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allPartnersData, setAllPartnersData] = useState<any[]>([]);
  const [paymentReminder, setPaymentReminder] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        setLoading(false);
        return;
      }

      const email = user.email.trim();
      setUserEmail(email);
      const isSuperAdmin = email === "admin@seirei.com.ng";
      setIsAdmin(isSuperAdmin);

      if (isSuperAdmin) {
        const { data: partners } = await supabase
          .from("fleet_trucks")
          .select("owner_email, company_name, active");

        if (partners) {
          const uniqueEmails = Array.from(new Set(partners.map(p => p.owner_email)));
          const partnersSummary = await Promise.all(uniqueEmails.map(async (pEmail) => {
            const pInfo = partners.find(p => p.owner_email === pEmail);
            const { count: truckCount } = await supabase
              .from("fleet_trucks")
              .select("*", { count: "exact", head: true })
              .eq("owner_email", pEmail);

            const { count: deliveryCount } = await supabase
              .from("batches")
              .select("*", { count: "exact", head: true })
              .eq("fleet_manager_email", pEmail)
              .ilike("status", "%Audit Verified%");

            return {
              email: pEmail,
              companyName: pInfo?.company_name || "N/A",
              totalTrucks: truckCount || 0,
              totalDeliveries: deliveryCount || 0,
              activeStatus: pInfo?.active ? "Active" : "Inactive",
            };
          }));
          setAllPartnersData(partnersSummary);
        }

        const { data: allBatches } = await supabase
          .from("batches")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (allBatches) setBatches(allBatches);

      } else {
        // MANAGER LOGIC: Fetching trucks with all forensic columns
        const { data: fleet } = await supabase
          .from("fleet_trucks")
          .select("*, payment_due_date, truck_model, assigned_driver_name")
          .ilike("owner_email", email);

        const { data: b } = await supabase
          .from("batches")
          .select(`*, customers (email)`)
          .ilike("fleet_manager_email", email)
          .order("created_at", { ascending: false });

        if (fleet && fleet.length > 0) {
          setTrucks(fleet);
          setCompanyName(fleet[0].company_name || "Authorized Logistics Partner");

          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          const nearDue = fleet.find(t => {
            if (!t.payment_due_date) return false;
            const d = new Date(t.payment_due_date);
            return d >= today && d <= nextWeek;
          });

          if (nearDue) {
            setPaymentReminder(`System Notice: Forensic Maintenance Invoice due on ${new Date(nearDue.payment_due_date).toLocaleDateString()}.`);
          }
        }
        if (b) setBatches(b);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleStatusUpdate = async (batch: any, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("batches")
      .update({ status: newStatus, last_updated: new Date().toISOString() })
      .eq("id", batch.id);

    if (error) {
      console.error("Update failed:", error.message);
      setLoading(false);
      return;
    }

    const buyerEmail = batch.customers?.email;
    if (buyerEmail && (newStatus === "02: Transit" || newStatus === "03: Handover")) {
      try {
        await fetch("/api/send-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyerEmail,
            status: newStatus,
            consignmentId: batch.batch_number,
            partnerName: companyName,
          }),
        });
      } catch (err) {
        console.error("Email trigger failed:", err);
      }
    }
    window.location.reload();
  };

  const fetchTruckHistory = async (plate: string) => {
    if (viewingHistory === plate) {
      setViewingHistory(null);
      return;
    }
    setViewingHistory(plate);
    const { data } = await supabase
      .from("batches")
      .select("batch_number, product_name, status, last_updated")
      .eq("truck_plate", plate)
      .ilike("status", "%Audit Verified%")
      .order("last_updated", { ascending: false });
    
    setSelectedTruckLogs(data || []);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCcw className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="flex-grow p-6 md:p-12 pb-12">
        {paymentReminder && (
          <div className="max-w-6xl mx-auto bg-cyan-900/20 border border-cyan-800 text-cyan-500 text-[10px] uppercase font-black tracking-widest px-8 py-4 rounded-2xl mb-8 text-center shadow-xl">
            {paymentReminder}
          </div>
        )}

        <header className="max-w-6xl mx-auto flex justify-between items-end mb-12 border-b border-gray-900 pb-8">
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{isAdmin ? "NETWORK OVERSEER" : companyName}</h1>
            <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold">Node Identity: {userEmail}</p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin/partners/onboard">
                <button className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </Link>
            )}
            <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-red-500 transition-all text-gray-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {isAdmin ? (
            <div className="lg:col-span-12 space-y-12">
              <section>
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                  <Info className="w-3 h-3" /> Partner Network Registry
                </h3>
                <div className="bg-[#080808] border border-gray-900 p-8 rounded-[2.5rem] shadow-2xl overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] text-gray-600 uppercase tracking-widest border-b border-gray-800">
                        <th className="pb-4">Partner</th>
                        <th className="pb-4 text-center">Fleet Size</th>
                        <th className="pb-4 text-center">Completed</th>
                        <th className="pb-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {allPartnersData.map((p, i) => (
                        <tr key={i} className="border-b border-gray-900 last:border-0">
                          <td className="py-4 font-bold text-white uppercase italic">{p.companyName}<br/><span className="text-[9px] text-gray-600 font-mono not-italic">{p.email}</span></td>
                          <td className="py-4 text-center font-mono">{p.totalTrucks}</td>
                          <td className="py-4 text-center font-mono">{p.totalDeliveries}</td>
                          <td className={`py-4 text-right font-black uppercase text-[10px] ${p.activeStatus === "Active" ? "text-emerald-500" : "text-red-500"}`}>{p.activeStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : (
            <>
              <div className="lg:col-span-7 space-y-8">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                  Active Forensic Dispatches
                </h3>
                <div className="mb-8">
                  <DynamicManagerFleetMap managerId={userEmail} />
                </div>
                {batches.filter(b => b.status !== "Audit Verified").length === 0 ? (
                  <div className="bg-[#080808] border border-gray-900 p-8 rounded-[2rem] text-center italic text-gray-700 text-[10px] uppercase">No Active Dispatches in Ledger</div>
                ) : (
                  batches.filter(b => b.status !== "Audit Verified").map((batch) => (
                    <div key={batch.id} className="bg-[#080808] border border-gray-900 p-6 rounded-[2rem] shadow-xl group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-black border border-gray-800 rounded-xl text-cyan-500"><Package className="w-5 h-5" /></div>
                          <div>
                            <h4 className="text-white font-black uppercase italic">{batch.product_name}</h4>
                            <p className="text-[9px] text-gray-600 uppercase tracking-widest">ID: {batch.batch_number} | {batch.status}</p>
                          </div>
                        </div>
                        <Link href={`/fleet/${batch.batch_number}`}>
                          <ChevronRight className="w-5 h-5 text-gray-700 hover:text-white transition-all" />
                        </Link>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(batch, "02: Transit")}
                          className="flex-1 py-3 bg-cyan-950/20 border border-cyan-900/50 text-cyan-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-cyan-500 hover:text-black transition-all"
                        >
                          Start Transit
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(batch, "03: Handover")}
                          className="flex-1 py-3 bg-emerald-950/20 border border-emerald-900/50 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
                        >
                          Complete Delivery
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="lg:col-span-5 space-y-8">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                  <Truck className="w-3 h-3 text-cyan-500" /> Fleet Registry
                </h3>
                <nav className="flex gap-6 mb-8 border-b border-gray-900 pb-4">
                  <Link href="/fleet/authentication" className="text-[9px] text-cyan-500 hover:text-white uppercase font-black tracking-widest">Auth Control</Link>
                  <Link href="/fleet/consignments" className="text-[9px] text-gray-600 hover:text-white uppercase font-black tracking-widest">New Dispatch</Link>
                </nav>

                <div className="space-y-4">
                  {trucks.map((truck) => (
                    <div key={truck.id} className="bg-[#080808] border border-gray-900 rounded-[2rem] overflow-hidden transition-all">
                      <div 
                        onClick={() => fetchTruckHistory(truck.plate_number)}
                        className="p-6 cursor-pointer hover:bg-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-cyan-950/10 border border-cyan-900/30 rounded-xl text-cyan-500"><Truck className="w-5 h-5" /></div>
                          <div>
                            <h4 className="text-white font-black uppercase italic">{truck.truck_name || "Heavy Asset"}</h4>
                            <p className="text-[10px] text-gray-600 font-bold">{truck.plate_number} {truck.truck_model ? `• ${truck.truck_model}` : ""}</p>
                          </div>
                        </div>
                        <History className={`w-4 h-4 ${viewingHistory === truck.plate_number ? "text-cyan-500" : "text-gray-800"}`} />
                      </div>

                      {viewingHistory === truck.plate_number && (
                        <div className="bg-black/40 border-t border-gray-900 p-6 space-y-4">
                          <div className="mb-4 pb-4 border-b border-gray-900">
                             <p className="text-[8px] text-gray-700 uppercase font-bold mb-1">Assigned Personnel</p>
                             <p className="text-[10px] text-gray-300 font-black uppercase italic">{truck.assigned_driver_name || "No Driver Assigned"}</p>
                          </div>
                          {selectedTruckLogs.length === 0 ? (
                            <p className="text-[9px] text-gray-700 italic uppercase">No Forensic History Recorded</p>
                          ) : (
                            selectedTruckLogs.map(log => (
                              <div key={log.batch_number} className="flex justify-between items-center border-b border-gray-900 pb-3 last:border-0">
                                <div>
                                  <p className="text-[10px] text-gray-300 font-black uppercase">{log.product_name}</p>
                                  <p className="text-[8px] text-gray-600 font-mono">{log.batch_number}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] text-emerald-500 font-black uppercase">Verified</p>
                                  <p className="text-[7px] text-gray-700">{new Date(log.last_updated).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}