import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';

// IMPORT YOUR REAL PAGES HERE
import Inventory from './pages/Inventory'; 
import SellPage from './pages/SellPage';
import Reports from './pages/Report';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';


const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        
        {/* Sidebar */}
        <div className="w-64 bg-primary text-white flex flex-col border-r border-primary-container shadow-xl z-40">
          <div className="p-8 text-2xl font-black border-b border-primary-container flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-3xl">precision_manufacturing</span>
            <div className="leading-tight">
              RETAIL<br/><span className="text-secondary">PRECISION</span>
            </div>
          </div>
          <nav className="flex-1 p-6 space-y-4 font-public-sans">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-container transition-all group">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-white">dashboard</span>
              <span className="font-semibold tracking-wide">Dashboard</span>
            </Link>
            <Link to="/sell" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-container transition-all group">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-white">shopping_cart</span>
              <span className="font-semibold tracking-wide">Sell Page</span>
            </Link>
            <Link to="/inventory" className="flex items-center gap-3 p-3 rounded-lg bg-primary-container transition-all group">
              <span className="material-symbols-outlined text-white">inventory_2</span>
              <span className="font-semibold tracking-wide text-white">Inventory</span>
            </Link>
            <Link to="/reports" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-container transition-all group">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-white">analytics</span>
              <span className="font-semibold tracking-wide">Reports</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-container transition-all group">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-white">settings</span>
              <span className="font-semibold tracking-wide">Settings</span>
            </Link>
          </nav>
          <div className="p-6 border-t border-primary-container">
            <div className="flex items-center gap-3 text-xs text-outline-variant uppercase tracking-widest font-bold">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              System Online
            </div>
          </div>
        </div>


        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
        <Route path="/sell" element={<SellPage />} />
            
            {/* USE THE REAL COMPONENT HERE */}
            <Route path="/inventory" element={<Inventory />} /> 
            <Route path="/reports" element={<Reports />} /> 
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
};

export default App;
