import React from 'react';
import { useTournament } from '../store/TournamentContext';
import { Play, Calendar, Trophy, Users } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const { schedule, teams, settings, calculateStandings } = useTournament();

  const upcomingMatches = schedule.filter(m => m.status === 'upcoming' || m.status === 'pending');
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;
  const completedCount = schedule.filter(m => m.status === 'completed').length;
  
  const standings = calculateStandings();
  const topTeam = standings.length > 0 ? standings[0] : null;

  return (
    <div className="space-y-6">
      <div className="glass-panel text-center py-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy size={100} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">Society Premier League</h2>
        <p className="text-blue-200 text-sm md:text-base max-w-md mx-auto">
          Manage your street cricket tournament with ease. 
          {completedCount} / {schedule.length} matches completed.
        </p>
      </div>

      <div className="grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel flex items-center p-4 gap-4 cursor-pointer hover:border-blue-500/50" onClick={() => onNavigate('teams')}>
          <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Teams</p>
            <h3 className="text-xl font-bold">{teams.length}</h3>
          </div>
        </div>
        
        <div className="glass-panel flex items-center p-4 gap-4 cursor-pointer hover:border-emerald-500/50" onClick={() => onNavigate('schedule')}>
          <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Matches Left</p>
            <h3 className="text-xl font-bold">{upcomingMatches.length}</h3>
          </div>
        </div>

        <div className="glass-panel flex items-center p-4 gap-4 cursor-pointer hover:border-amber-500/50" onClick={() => onNavigate('table')}>
          <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Top Team</p>
            <h3 className="text-lg font-bold truncate w-24">{topTeam?.name || 'N/A'}</h3>
          </div>
        </div>
      </div>

      {nextMatch && (
        <div className="glass-panel">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Next Match</h3>
            <span className="badge badge-primary">Match {nextMatch.id} {nextMatch.isFinal ? '(FINAL)' : ''}</span>
          </div>
          
          <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="text-center flex-1">
              <h4 className="text-xl md:text-2xl font-bold text-blue-400">
                {nextMatch.isFinal ? (nextMatch.team1Id ? teams.find(t => t.id === nextMatch.team1Id)?.name : 'TBD') : teams.find(t => t.id === nextMatch.team1Id)?.name}
              </h4>
            </div>
            
            <div className="px-4 text-center">
              <span className="text-sm text-slate-400 block mb-1">Day {nextMatch.day}</span>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm mx-auto">
                VS
              </div>
            </div>
            
            <div className="text-center flex-1">
              <h4 className="text-xl md:text-2xl font-bold text-purple-400">
                {nextMatch.isFinal ? (nextMatch.team2Id ? teams.find(t => t.id === nextMatch.team2Id)?.name : 'TBD') : teams.find(t => t.id === nextMatch.team2Id)?.name}
              </h4>
            </div>
          </div>
          
          {(!nextMatch.isFinal || (nextMatch.team1Id && nextMatch.team2Id)) && (
            <button 
              className="btn btn-primary w-full mt-4 py-3 text-lg justify-center"
              onClick={() => onNavigate('livescore', nextMatch.id)}
            >
              <Play size={20} fill="currentColor" />
              Start Match
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
