import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "ClearPOS Retail Suite",
  description: "High-performance retail management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen bg-surface text-slate-900 font-public-sans">
        {/* SIDEBAR - Retail Precision Design */}
        <aside className="w-64 border-r border-outline-variant bg-white flex flex-col h-full py-6 z-40 shrink-0">


          <nav className="flex-1 space-y-1">
            <NavItem href="/" icon="dashboard" label="Dashboard" active />
            <NavItem href="/inventory" icon="inventory_2" label="Inventory" />
            <NavItem href="/sellpage" icon="point_of_sale" label="Point of Sale" />
            <NavItem href="/report" icon="history" label="Sales History" />
            <NavItem href="/setting" icon="settings" label="Settings" />
          </nav>


        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-surface">
          {/* Top Header */}
          <header className="flex justify-between items-center h-16 px-8 w-full sticky top-0 bg-white border-b border-outline-variant z-30 shrink-0">
            <div className="flex items-center flex-1">
              <div className="relative w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Search orders, items, or customers..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center space-x-6">

              <Link href="/sellpage" className="bg-primary-container text-black px-6 py-2 rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all uppercase tracking-wide">
                New Sale
              </Link>
            </div>
          </header>

          <div className="flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

function NavItem({ href, icon, label, active, isError }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-6 py-3 space-x-3 transition-all duration-150 ${active
        ? "bg-slate-100 text-primary-container border-r-4 border-primary-container"
        : isError
          ? "text-slate-600 hover:text-error"
          : "text-slate-600 hover:bg-slate-50 hover:text-primary-container"
        }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
    </Link>
  );
}
