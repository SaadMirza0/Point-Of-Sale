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
        <div className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6 text-2xl font-black border-b border-slate-700">
            PRO <span className="text-blue-400">POS</span>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/" className="block p-3 rounded hover:bg-slate-800">📊 Dashboard</Link>
            <Link to="/sell" className="block p-3 rounded hover:bg-slate-800">🛒 Sell Page</Link>
            <Link to="/inventory" className="block p-3 rounded ">📦 Inventory</Link>
            <Link to="/reports" className="block p-3 rounded ">📦 Past Reports</Link>
            <Link to="/settings" className="block p-3 rounded hover:bg-slate-800">⚙️ Settings</Link>
          </nav>
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
