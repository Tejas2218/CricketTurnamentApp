import React from 'react';
import { useTournament } from '../store/TournamentContext';
import { Play, CheckCircle2, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';

const ScheduleView = ({ onNavigate }) => {
  const { schedule, teams, resetMatch } = useTournament();

  const getTeamName = (id) => {
    if (!id) return 'TBD';
    return teams.find(t => t.id === id)?.name || 'Unknown';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success"><CheckCircle2 size={12} className="mr-1"/> Completed</span>;
      case 'upcoming': return <span className="badge badge-primary"><Clock size={12} className="mr-1"/> Upcoming</span>;
      case 'pending': return <span className="badge badge-warning"><Clock size={12} className="mr-1"/> Pending</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Tournament Schedule</h2>
        <p className="text-slate-400 text-sm">Round Robin (6 Matches) + Final</p>
      </div>

      <div className="space-y-4">
        {schedule.map(match => (
          <div 
            key={match.id} 
            className={`glass-panel p-4 md:p-6 transition-all ${match.isFinal ? 'border-amber-500/50 bg-amber-900/10' : ''}`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-400">
                {match.isFinal ? '🏆 FINAL MATCH' : `Match ${match.id}`} • Day {match.day}
              </span>
              {getStatusBadge(match.status)}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="flex-1 w-full flex items-center justify-between md:justify-center md:gap-8 bg-slate-800/50 p-4 rounded-xl">
                <div className="text-right flex-1">
                  <h3 className={`text-lg md:text-xl font-bold ${match.status === 'completed' && match.result?.winner === match.team1Id ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {getTeamName(match.team1Id)}
                  </h3>
                  {match.status === 'completed' && (
                    <p className="text-sm text-slate-400">
                      {match.result.team1.runs}/{match.result.team1.wickets} ({match.result.team1.overs})
                    </p>
                  )}
                </div>

                <div className="px-4 font-bold text-slate-500">VS</div>

                <div className="text-left flex-1">
                  <h3 className={`text-lg md:text-xl font-bold ${match.status === 'completed' && match.result?.winner === match.team2Id ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {getTeamName(match.team2Id)}
                  </h3>
                  {match.status === 'completed' && (
                    <p className="text-sm text-slate-400">
                      {match.result.team2.runs}/{match.result.team2.wickets} ({match.result.team2.overs})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 items-center w-full md:w-auto">
                {match.status === 'upcoming' && match.team1Id && match.team2Id && (
                  <button 
                    className="btn btn-primary w-full md:w-auto"
                    onClick={() => onNavigate('livescore', match.id)}
                  >
                    <Play size={16} /> Play
                  </button>
                )}

                {match.status === 'completed' && (
                  <>
                    <div className="text-sm text-center md:text-right w-full md:w-auto text-emerald-400 font-medium">
                      {match.result.winner === 'tie' 
                        ? "Match Tied"
                        : `${getTeamName(match.result.winner)} won by ${match.result.winMargin}`}
                    </div>
                    <button className="btn btn-secondary mr-2" onClick={() => handleDownloadResultPDF(match)}>
                      <Download size={14} className="mr-2" /> Download Result
                    </button>
                  </>
                )}

                <button
                  className="btn btn-secondary ml-2"
                  onClick={() => {
                    if (window.confirm('Reset match to upcoming (this will clear the result)?')) {
                      resetMatch(match.id);
                    }
                  }}
                >
                  Reset Match
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function handleDownloadResultPDF(match) {
  if (!match || !match.result) return;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`SPL - Match ${match.id} Result`, 14, 22);

  const t1 = match.team1Id ? match.team1Id : 'Team 1';
  const t2 = match.team2Id ? match.team2Id : 'Team 2';

  doc.setFontSize(14);
  doc.text(`Winner: ${match.result.winner === 'tie' ? 'Tie' : match.result.winner}`, 14, 36);
  doc.text('Team Scores:', 14, 48);

  const yStart = 56;
  doc.setFontSize(12);
  if (match.result.team1) {
    doc.text(`Team 1: ${match.result.team1.runs}/${match.result.team1.wickets} (${match.result.team1.overs})`, 18, yStart);
  }
  if (match.result.team2) {
    doc.text(`Team 2: ${match.result.team2.runs}/${match.result.team2.wickets} (${match.result.team2.overs})`, 18, yStart + 8);
  }

  doc.save(`SPL_Match_${match.id}_Result.pdf`);
}

export default ScheduleView;
