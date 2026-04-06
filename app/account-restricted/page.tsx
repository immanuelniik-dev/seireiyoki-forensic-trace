"use client";

import { ShieldAlert, Mail, Phone } from "lucide-react";
import Link from "next/link";

export default function AccountRestricted() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center bg-[#080808] border border-gray-900 rounded-[2.5rem] p-10 shadow-2xl">
        <ShieldAlert className="w-20 h-20 text-red-600 mx-auto mb-8 animate-pulse" />
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">ACCESS SUSPENDED</h1>
        <p className="text-sm text-gray-500 mb-8">Your account has been restricted due to a pending invoice. To restore forensic access, please contact our partnerships team.</p>
        
        <div className="space-y-4 mb-8">
          <Link href="mailto:partnerships@seirei.com.ng" className="flex items-center justify-center gap-3 bg-cyan-600 text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all">
            <Mail className="w-4 h-4" /> Email Partnerships
          </Link>
          <Link href="tel:+2348012345678" className="flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-600 transition-all">
            <Phone className="w-4 h-4" /> Call Support
          </Link>
        </div>

        <p className="text-[9px] text-gray-700 uppercase">Reference Code: SR-ACC-LOCK-001</p>
      </div>
    </div>
  );
}
