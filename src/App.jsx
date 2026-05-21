import React, { useState } from 'react';
import { Home, Users, Calendar, Activity, Trophy } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TeamsView from './components/TeamsView';
import ScheduleView from './components/ScheduleView';
import LiveScoreView from './components/LiveScoreView';
import PointsTable from './components/PointsTable';
import { useTournament } from './store/TournamentContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMatch, setSelectedMatch] = useState(null); // For LiveScore

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
      </header>

      {/* Main Content Area */}
      <main className="app-container animate-fade-in">
        {activeTab === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
        {activeTab === 'teams' && <TeamsView />}
        {activeTab === 'schedule' && <ScheduleView onNavigate={navigateTo} />}
        {activeTab === 'livescore' && <LiveScoreView matchId={selectedMatch} onNavigate={navigateTo} />}
        {activeTab === 'table' && <PointsTable />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="glass-nav-bottom fixed bottom-0 left-0 right-0 w-full flex justify-around p-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-16 h-16 ${
              activeTab === item.id 
                ? 'text-white bg-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            style={{ border: 'none', background: activeTab === item.id ? '' : 'transparent' }}
          >
            {React.cloneElement(item.icon, { 
              size: activeTab === item.id ? 24 : 20,
              className: `transition-all duration-300 ${activeTab === item.id ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`
            })}
            <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${activeTab === item.id ? 'text-blue-200' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Desktop Sidebar (Optional, we'll keep it simple and just use top nav + bottom nav on mobile) */}
    </div>
  );
}

export default App;
