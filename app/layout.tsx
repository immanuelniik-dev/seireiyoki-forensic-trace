import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ShieldCheck } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEIREIYOKI | Supply Chain Authentication",
  description: "Industrial Logistics & Integrity Ledger - Secure Supply Chain Traceability by SeireiYoki Technology Limited",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SeireiYoki",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#050505]`}
    >
      <body className="min-h-screen flex flex-col text-gray-300 font-mono">
        {/* Main Content Area */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Corporate Subsidiary Footer */}
        <footer className="mt-auto border-t border-gray-900 bg-[#080808] p-10 md:p-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] text-cyan-600 font-black uppercase tracking-[0.4em]">
                <ShieldCheck className="w-4 h-4" /> 
                Authentication Secured
              </div>
              <p className="text-xs text-gray-400 font-medium tracking-wide max-w-md leading-relaxed">
                SeireiYoki Technology Limited is a proprietary subsidiary of 
                <span className="text-white font-bold ml-1 border-b border-cyan-900/50 uppercase italic">
                  Conseillier Enterprises
                </span>. 
                Unauthorized access is strictly prohibited by Global Logistics Protocol.
              </p>
            </div>
            
            <div className="flex flex-col md:items-end gap-2 border-l md:border-l-0 md:border-r border-gray-900 pl-6 md:pl-0 md:pr-6">
              <div className="text-[9px] text-gray-700 uppercase tracking-[0.3em] font-black text-left md:text-right space-y-1">
                <p>© 2026 YOKI TECHNOLOGY LIMITED</p>
                <p className="text-cyan-950">AUTHENTICATION NODE // NIGERIA </p>
                <p className="opacity-40">LEDGER PROTOCOL v2.6.1</p>
              </div>
            </div>

          </div>
        </footer>
      </body>
    </html>
  );
}