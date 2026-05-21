import React from 'react';
import { useTournament } from '../store/TournamentContext';
import { Trophy } from 'lucide-react';

const PointsTable = () => {
  const { calculateStandings } = useTournament();
  const standings = calculateStandings();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="text-amber-400" /> Points Table
        </h2>
        <p className="text-slate-400 text-sm">Top 2 teams qualify for the Final.</p>
      </div>

      <div className="glass-panel p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                  <th className="w-10">Pos</th>
                  <th>Team</th>
                  <th className="text-center">Played</th>
                  <th className="text-center">Won</th>
                  <th className="text-center">Lost</th>
                  <th className="text-center">Tied</th>
                  <th className="text-center font-bold text-blue-400">Points</th>
                  <th className="text-center">Net RR</th>
                </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.id} className={index < 2 ? 'bg-emerald-900/10' : ''}>
                  <td className="font-bold">{index + 1}</td>
                  <td className="font-bold flex items-center gap-2">
                    {team.name}
                    {index < 2 && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Q</span>}
                  </td>
                  <td className="text-center">{team.played}</td>
                  <td className="text-center text-emerald-400">{team.won}</td>
                  <td className="text-center text-red-400">{team.lost}</td>
                  <td className="text-center text-slate-400">{team.tied}</td>
                  <td className="text-center font-bold text-blue-400 text-lg">{team.points}</td>
                  <td className="text-center font-mono text-sm">{team.nrr > 0 ? `+${team.nrr}` : team.nrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="glass-panel text-sm text-slate-400">
        <h4 className="font-bold text-white mb-2">Rules:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Win: 2 points, Tie: 1 point, Loss: 0 points.</li>
          <li>If points are equal, Net Run Rate (NRR) determines the position.</li>
          <li>Top 2 teams based on points/NRR will play the Final match.</li>
        </ul>
      </div>
    </div>
  );
};

export default PointsTable;
