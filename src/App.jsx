import React, { useState } from 'react';
import { Home, Users, Calendar, Activity, Trophy, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TeamsView from './components/TeamsView';
import ScheduleView from './components/ScheduleView';
import LiveScoreView from './components/LiveScoreView';
import PointsTable from './components/PointsTable';
import { useTournament } from './store/TournamentContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMatch, setSelectedMatch] = useState(null); // For LiveScore
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigateTo = (tab, matchId = null) => {
    setActiveTab(tab);
    if (matchId) {
      setSelectedMatch(matchId);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
    { id: 'teams', label: 'Teams', icon: <Users size={20} /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={20} /> },
    { id: 'table', label: 'Standings', icon: <Trophy size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-20 md:pb-0">
      
      {/* Top Header */}
      <header className="glass-nav sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            S
          </div>
          <h1 className="text-xl font-bold text-gradient m-0">SPL Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="hamburger-btn p-2 rounded-md hover:bg-white/5"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-container animate-fade-in">
        {activeTab === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
        {activeTab === 'teams' && <TeamsView />}
        {activeTab === 'schedule' && <ScheduleView onNavigate={navigateTo} />}
        {activeTab === 'livescore' && <LiveScoreView matchId={selectedMatch} onNavigate={navigateTo} />}
        {activeTab === 'table' && <PointsTable />}
      </main>

      {/* Hamburger Drawer Navigation */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
      <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-hidden={!isDrawerOpen}>
        <div className="drawer-header flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">S</div>
            <strong>SPL Menu</strong>
          </div>
          <button className="p-2 rounded-md hover:bg-slate-800" onClick={() => setIsDrawerOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="drawer-body px-4 py-2">
          <ul className="drawer-list">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id} className="drawer-list-item">
                  <button onClick={() => { navigateTo(item.id); setIsDrawerOpen(false); }} className={`drawer-item ${isActive ? 'active' : ''}`}>
                    <span className="drawer-icon">{React.cloneElement(item.icon, { size: 20 })}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs text-slate-300/60">Manage {item.label.toLowerCase()}</div>
                    </div>
                    {isActive && <span className="text-xs text-blue-300">Active</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 px-2">
            <button className="w-full btn-ghost" onClick={() => { navigateTo('livescore'); setIsDrawerOpen(false); }}>Open Live Score</button>
          </div>
        </nav>
      </aside>

      {/* Desktop Sidebar (Optional, we'll keep it simple and just use top nav + bottom nav on mobile) */}
    </div>
  );
}

export default App;
