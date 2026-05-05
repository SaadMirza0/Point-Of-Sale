import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100 text-black">
        {/* SIDEBAR - Exactly like Electron */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6 text-2xl font-black border-b border-slate-700">
            PRO <span className="text-blue-400">WEB</span>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="block p-3 rounded hover:bg-slate-800">📊 Dashboard</Link>
            <Link href="/inventory" className="block p-3 rounded hover:bg-slate-800">📦 Inventory</Link>
            <Link href="/report" className="block p-3 rounded hover:bg-slate-800">📜 Sales History</Link>
            <Link href="/setting" className="block p-3 rounded hover:bg-slate-800">⚙️ Settings</Link>
            <Link href="/sellpage" className="block p-3 rounded hover:bg-slate-800"> Sell</Link>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
