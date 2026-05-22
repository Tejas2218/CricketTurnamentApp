import React, { useState } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Plus, X, Edit2, Check, UserPlus } from 'lucide-react';

const TeamsView = () => {
  const { teams, updateTeam, addPlayer, removePlayer, settings, updatePlayer, setCaptain } = useTournament();
  
  // Modal State
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [newPlayerIsCaptain, setNewPlayerIsCaptain] = useState(false);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  const openTeamDetails = (team) => {
    setSelectedTeamId(team.id);
    setTeamNameInput(team.name);
    setIsEditModalOpen(true);
  };

  const closeTeamDetails = () => {
    setIsEditModalOpen(false);
    setSelectedTeamId(null);
    setNewPlayerInput('');
  };

  const handleSaveTeamName = () => {
    if (teamNameInput.trim()) {
      updateTeam(selectedTeamId, { name: teamNameInput.trim() });
    }
  };

  const handleAddPlayer = () => {
    if (newPlayerInput.trim() && selectedTeam.players.length < settings.playersPerTeam) {
      addPlayer(selectedTeamId, newPlayerInput.trim(), newPlayerIsCaptain);
      setNewPlayerInput('');
      setNewPlayerIsCaptain(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Teams & Squads</h2>
          <p className="text-slate-400 text-sm">Manage the {teams.length} teams.</p>
        </div>
        <span className="badge badge-primary font-bold">{settings.playersPerTeam} Players/Team</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => (
          <div 
            key={team.id} 
            className="glass-panel cursor-pointer hover:border-blue-500/50 group flex flex-col justify-between"
            onClick={() => openTeamDetails(team)}
            style={{ marginBottom: 0 }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{team.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{team.players.length} / {settings.playersPerTeam} Players Added</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                <Edit2 size={18} />
              </div>
            </div>
            
            <div className="team-card-player-list mt-2">
              {team.players.length === 0 && (
                <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Squad Empty</span>
              )}
              {team.players.slice(0, settings.playersPerTeam).map(p => (
                <div key={p.id} className={`player-name-chip flex items-center gap-2 ${team.captain === p.id ? 'captain' : ''}`} title={p.name}>
                  <span className="player-name-text">{p.name}</span>
                </div>
              ))}
              {team.players.length > 6 && (
                <div className="player-name-chip more">+{team.players.length - settings.playersPerTeam} more</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Team Modal */}
      {isEditModalOpen && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-inner">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">Manage Team</h3>
                <button onClick={closeTeamDetails} className="btn-icon" title="Close"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Team Name</label>
                  <div className="flex gap-2 mt-2">
                    <input value={teamNameInput} onChange={(e) => setTeamNameInput(e.target.value)} className="input-field flex-1" />
                    <button onClick={handleSaveTeamName} className="btn btn-primary"><Check size={16} /></button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Squad Members</label>
                    <span className="text-xs text-slate-400">{selectedTeam.players.length}/{settings.playersPerTeam}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedTeam.players.map((player, index) => (
                      <div key={player.id} className="player-row p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center font-bold text-sm">{index + 1}</div>
                          <div>
                            <div className="font-medium">
                              <span className={`player-name-text ${selectedTeam.captain === player.id ? 'captain' : ''}`}>{player.name}</span>
                            </div>
                            <div className="text-xs text-slate-400">Player #{player.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingPlayerId(player.id); setEditingPlayerName(player.name); }} className="btn-icon"><Edit2 size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); removePlayer(selectedTeam.id, player.id); }} className="btn-icon danger"><X size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setCaptain(selectedTeam.id, player.id); }} className="btn-icon" title="Set as Captain"><Check size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {selectedTeam.players.length < settings.playersPerTeam ? (
                    <div className="flex gap-2 items-center">
                      <input type="text" placeholder="Enter player name..." value={newPlayerInput} onChange={(e) => setNewPlayerInput(e.target.value)} className="input-field flex-1" />
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" checked={newPlayerIsCaptain} onChange={(e) => setNewPlayerIsCaptain(e.target.checked)} /> Captain
                      </label>
                      <button onClick={handleAddPlayer} className="btn btn-primary" disabled={!newPlayerInput.trim()}><Plus size={18} /></button>
                    </div>
                  ) : (
                    <div className="text-center text-emerald-400 font-bold">Squad is Full ({settings.playersPerTeam} Players)</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

  );
};

export default TeamsView;
