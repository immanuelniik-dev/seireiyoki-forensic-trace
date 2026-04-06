"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { UserPlus, Truck, LogOut, CheckCircle2, ShieldCheck, ArrowLeft, Factory, UserCheck, Activity, RefreshCcw } from "lucide-react";
import Link from "next/link";
import FleetHeader from "../../../components/FleetHeader";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FleetAuthenticationControl() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // Driver States
  const [driverFullName, setDriverFullName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  
  // Truck States
  const [newTruckPlate, setNewTruckPlate] = useState("");
  const [truckModel, setTruckModel] = useState("");
  const [assignedTruckDriver, setAssignedTruckDriver] = useState("");
  
  // Consignment States
  const [classification, setClassification] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [selectedConsignmentDriver, setSelectedConsignmentDriver] = useState("");
  const [systemStatus, setSystemStatus] = useState("Quality Certified");
  const [originSource, setOriginSource] = useState("");

  // Data States
  const [message, setMessage] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [companyTrucks, setCompanyTrucks] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");

  const fetchCompanyName = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("fleet_trucks")
      .select("company_name")
      .ilike("owner_email", email)
      .limit(1)
      .maybeSingle();
    
    if (data?.company_name) setCompanyName(data.company_name);
  }, []);

  const fetchDrivers = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("managed_drivers")
      .select("driver_name, driver_phone")
      .ilike("fleet_manager_email", email);
    
    if (data) setDrivers(data);
  }, []);

  const fetchCompanyTrucks = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("fleet_trucks")
      .select("plate_number, tracker_device_id, truck_model, assigned_driver_name")
      .ilike("owner_email", email);
    
    if (data) setCompanyTrucks(data);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        router.push("/login");
      } else {
        const { data: fleetTrucksData } = await supabase
          .from("fleet_trucks")
          .select("active")
          .ilike("owner_email", user.email)
          .limit(1)
          .single();
        
        if (fleetTrucksData && !fleetTrucksData.active) {
          router.push("/account-restricted");
        } else {
          setIsAuth(true);
          setUserEmail(user.email);
          fetchDrivers(user.email);
          fetchCompanyTrucks(user.email);
          fetchCompanyName(user.email);
        }
      }
    };
    checkSession();
  }, [router, fetchDrivers, fetchCompanyTrucks, fetchCompanyName]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("managed_drivers")
        .insert({
          driver_name: driverFullName,
          driver_phone: driverPhone,
          fleet_manager_email: userEmail,
          status: "Managed"
        });

      if (error) throw error;
      setMessage(`SUCCESS: Driver ${driverFullName} added to secure list.`);
      setDriverFullName("");
      setDriverPhone("");
      fetchDrivers(userEmail);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("fleet_trucks")
        .insert({
          plate_number: newTruckPlate.toUpperCase().trim(),
          truck_model: truckModel,
          assigned_driver_name: assignedTruckDriver,
          owner_email: userEmail,
          tracker_device_id: "PENDING",
          tracker_provider: "SYSTEM"
        });

      if (error) throw error;
      setMessage(`SUCCESS: Truck ${newTruckPlate} indexed in fleet.`);
      setNewTruckPlate("");
      setTruckModel("");
      setAssignedTruckDriver("");
      fetchCompanyTrucks(userEmail);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const prefix = companyName || userEmail.split("@")[0].substring(0, 4).toUpperCase();
      const consignmentId = `${prefix}-${randomNum}`.toUpperCase();

      const { error } = await supabase
        .from("batches")
        .insert({
          batch_number: consignmentId,
          product_name: classification,
          buyer_email: buyerEmail,
          fleet_manager_email: userEmail,
          driver_name: selectedConsignmentDriver,
          status: systemStatus,
          origin: originSource,
          owner_email: userEmail,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
      setMessage(`SUCCESS: Consignment ${consignmentId} anchored to ledger.`);
      setClassification("");
      setBuyerEmail("");
      setSelectedConsignmentDriver("");
      setOriginSource("");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) return <div className="min-h-screen bg-black flex items-center justify-center"><RefreshCcw className="w-6 h-6 animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-6 md:p-12">
      <FleetHeader userEmail={userEmail} />
      
      <div className="max-w-6xl mx-auto mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-cyan-500 transition-all">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Consignment Section */}
        <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600"></div>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-8 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Provision Consignment
          </h3>
          <form onSubmit={handleCreateConsignment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required type="text" value={classification} onChange={e => setClassification(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-5 text-xs text-white outline-none focus:border-emerald-600" placeholder="Classification" />
              <input required type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-5 text-xs text-white outline-none focus:border-emerald-600" placeholder="Buyer Email" />
              <select required value={selectedConsignmentDriver} onChange={e => setSelectedConsignmentDriver(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-5 text-xs text-white outline-none">
                <option value="">-- Assigned Driver --</option>
                {drivers.map((d, i) => <option key={i} value={d.driver_name}>{d.driver_name}</option>)}
              </select>
              <select value={systemStatus} onChange={e => setSystemStatus(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-5 text-[10px] text-emerald-500 font-bold outline-none">
                <option value="Quality Certified">01: Origin (Awaiting)</option>
                <option value="In Transit - Sealed">02: Transit (Active)</option>
                <option value="Audit Verified">03: Handover (Closed)</option>
              </select>
              <div className="md:col-span-2">
                <input required type="text" value={originSource} onChange={e => setOriginSource(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-5 text-xs text-white outline-none focus:border-emerald-600" placeholder="Manufacturer Source / Origin" />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-emerald-600 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-xl">
              {loading ? "Syncing..." : `Authorize ${companyName || 'SEIREI'}-ID`}
            </button>
          </form>
        </div>

        {/* Driver Provisioning Section */}
        <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600"></div>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-8 flex items-center gap-2">
            <UserPlus className="w-3 h-3 text-cyan-500" /> Provision Driver
          </h3>
          <form onSubmit={handleAddDriver} className="space-y-6">
            <input required type="text" value={driverFullName} onChange={e => setDriverFullName(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-6 text-xs text-white" placeholder="Driver Full Name" />
            <input required type="tel" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} className="w-full bg-black border border-gray-800 rounded-2xl py-4 px-6 text-xs text-white" placeholder="Phone (+234)" />
            <button disabled={loading} className="w-full bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all">
              Add to Managed Driver List
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-900 max-h-48 overflow-y-auto">
            {drivers.map((d, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-950/20 p-3 rounded-lg border border-gray-900 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] font-bold text-white uppercase">{d.driver_name} <span className="text-gray-600 ml-2">{d.driver_phone}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Truck Registry Section (The "Missing" Section Re-Added) */}
        <div className="bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl h-fit lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-600"></div>
          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-8 flex items-center gap-2">
            <Truck className="w-3 h-3 text-cyan-500" /> Register Asset to Fleet
          </h3>
          <form onSubmit={handleRegisterTruck} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input required type="text" value={newTruckPlate} onChange={e => setNewTruckPlate(e.target.value)} className="bg-black border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white uppercase outline-none focus:border-cyan-600" placeholder="Plate Number" />
            <input required type="text" value={truckModel} onChange={e => setTruckModel(e.target.value)} className="bg-black border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white outline-none focus:border-cyan-600" placeholder="Truck Model (e.g. Mack)" />
            <select required value={assignedTruckDriver} onChange={e => setAssignedTruckDriver(e.target.value)} className="bg-black border border-gray-800 rounded-2xl py-5 px-6 text-xs text-white outline-none">
              <option value="">Assign Driver</option>
              {drivers.map((d, i) => <option key={i} value={d.driver_name}>{d.driver_name}</option>)}
            </select>
            <button disabled={loading} className="md:col-span-3 bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] hover:bg-cyan-600 transition-all shadow-xl">
              Index Asset to Fleet Inventory
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-900">
            <h4 className="text-[9px] text-gray-600 uppercase font-black mb-6 tracking-widest">Active Fleet Ledger</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyTrucks.map((truck, index) => (
                <div key={index} className="bg-gray-950/40 p-5 rounded-2xl border border-gray-900 hover:border-gray-700 transition-all">
                  <p className="text-sm font-black text-white uppercase tracking-tighter">{truck.plate_number}</p>
                  <p className="text-[10px] text-cyan-500 mt-1 uppercase font-bold">{truck.truck_model || "Standard Model"}</p>
                  <p className="text-[8px] text-gray-600 mt-2 uppercase font-black">Driver: {truck.assigned_driver_name || "Unassigned"}</p>
                  <p className="text-[8px] text-gray-600 mt-2 uppercase font-black">Device ID: {truck.tracker_device_id || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-cyan-400 text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl border border-cyan-900 shadow-2xl z-50">
          {message}
        </div>
      )}
    </div>
  );
}
