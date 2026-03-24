import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEIREIYOKI | Digital Forensic Audit",
  description: "Secure Last-Mile Supply Chain Traceability by SeireiYoki Technology Limited",
  themeColor: "#050505",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg", // Explicitly point to the SVG
    apple: "/icon.svg", // Use the same for Apple touch icons
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
      <body className="min-h-screen flex flex-col text-gray-300">
        {/* Main Content Area */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Corporate Subsidiary Footer */}
        <footer className="mt-auto border-t border-gray-900 bg-[#080808] p-8 md:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold mb-2">
                Corporate Governance
              </p>
              <p className="text-xs text-gray-400 font-medium tracking-wider">
                SeireiYoki Technology Limited is a proud subsidiary of 
                <span className="text-white font-bold ml-2 border-b border-cyan-900/50">
                  CONSEILLIER ENTERPRISES
                </span>
              </p>
            </div>
            
            <div className="text-[9px] text-gray-700 uppercase tracking-widest text-center md:text-right">
              <p>© 2026 SEIREIYOKI TECH LTD</p>
              <p className="mt-1 text-cyan-950 font-black">FORENSIC LEDGER NODE v2.4.0</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}