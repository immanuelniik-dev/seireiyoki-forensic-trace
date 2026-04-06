import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Package, Truck, UserCheck, BarChart2, LogOut } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function FleetHeader({
  userEmail,
}: { userEmail: string}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="max-w-6xl mx-auto flex justify-between items-end mb-12 border-b border-gray-900 pb-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-cyan-500 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">Fleet Dashboard</h1>
          <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold">Logged in as: {userEmail}</p>
        </div>
      </div>
      <nav className="flex items-center gap-6">
        <Link href="/fleet" className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black hover:text-cyan-500 transition-all">
          <Package className="w-3 h-3" />
          Fleet Inventory
        </Link>
        <Link href="/fleet/authentication" className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black hover:text-cyan-500 transition-all">
          <UserCheck className="w-3 h-3" />
          Authentication/Drivers
        </Link>
        <Link href="/fleet/reports" className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black hover:text-cyan-500 transition-all">
          <BarChart2 className="w-3 h-3" />
          Reports
        </Link>
        <button onClick={handleLogout} className="p-3 bg-gray-950 border border-gray-900 rounded-xl hover:text-red-500 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </nav>
    </header>
  );
}
