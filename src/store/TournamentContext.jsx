import React, { createContext, useState, useEffect, useContext } from 'react';

const TournamentContext = createContext();

export const useTournament = () => useContext(TournamentContext);

const defaultTeams = [
  { id: 1, name: 'Team A', captain: '', players: [] },
  { id: 2, name: 'Team B', captain: '', players: [] },
  { id: 3, name: 'Team C', captain: '', players: [] },
  { id: 4, name: 'Team D', captain: '', players: [] }
];

const defaultSettings = {
  oversPerMatch: 7,
  playersPerTeam: 7,
  winPoints: 2,
  tiePoints: 1,
  lossPoints: 0
};

const defaultSchedule = [
  { id: 1, day: 2, team1Id: 1, team2Id: 2, status: 'upcoming', result: null },
  { id: 2, day: 3, team1Id: 3, team2Id: 4, status: 'upcoming', result: null },
  { id: 3, day: 4, team1Id: 1, team2Id: 3, status: 'upcoming', result: null },
  { id: 4, day: 5, team1Id: 2, team2Id: 4, status: 'upcoming', result: null },
  { id: 5, day: 6, team1Id: 1, team2Id: 4, status: 'upcoming', result: null },
  { id: 6, day: 7, team1Id: 2, team2Id: 3, status: 'upcoming', result: null },
  { id: 7, day: 8, team1Id: null, team2Id: null, status: 'pending', isFinal: true, result: null }
];

export const TournamentProvider = ({ children }) => {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('spl_teams');
    return saved ? JSON.parse(saved) : defaultTeams;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('spl_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('spl_schedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('spl_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('spl_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('spl_schedule', JSON.stringify(schedule));
  }, [schedule]);

  const updateTeam = (teamId, updatedData) => {
    setTeams(teams.map(t => t.id === teamId ? { ...t, ...updatedData } : t));
  };

  const addPlayer = (teamId, playerName) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        if (t.players.length >= settings.playersPerTeam) return t;
        return { ...t, players: [...t.players, { id: Date.now(), name: playerName }] };
      }
      return t;
    }));
  };

  const removePlayer = (teamId, playerId) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        return { ...t, players: t.players.filter(p => p.id !== playerId) };
      }
      return t;
    }));
  };

  const updatePlayer = (teamId, playerId, newName) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        return { ...t, players: t.players.map(p => p.id === playerId ? { ...p, name: newName } : p) };
      }
      return t;
    }));
  };

  const updateMatchResult = (matchId, resultData) => {
    setSchedule(schedule.map(m => m.id === matchId ? { ...m, status: 'completed', result: resultData } : m));
    
    // Check if league matches are done to set Final teams
    const updatedSchedule = schedule.map(m => m.id === matchId ? { ...m, status: 'completed', result: resultData } : m);
    const leagueMatches = updatedSchedule.filter(m => !m.isFinal);
    if (leagueMatches.every(m => m.status === 'completed')) {
      const standings = calculateStandings(updatedSchedule, teams);
      if (standings.length >= 2) {
        setSchedule(updatedSchedule.map(m => 
          m.isFinal ? { ...m, status: 'upcoming', team1Id: standings[0].id, team2Id: standings[1].id } : m
        ));
      }
    }
  };

  const resetMatch = (matchId) => {
    setSchedule(schedule.map(m => m.id === matchId ? { ...m, status: 'upcoming', result: null } : m));
  };

  const calculateStandings = (matchesToUse = schedule, teamsToUse = teams) => {
    const table = teamsToUse.map(t => ({
      id: t.id,
      name: t.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      nrr: 0
    }));

    matchesToUse.filter(m => m.status === 'completed' && !m.isFinal).forEach(match => {
      const t1 = table.find(t => t.id === match.team1Id);
      const t2 = table.find(t => t.id === match.team2Id);
      if (!t1 || !t2) return;
      
      const r1 = match.result.team1;
      const r2 = match.result.team2;

      t1.played++;
      t2.played++;

      t1.runsScored += r1.runs;
      t1.oversFaced += r1.overs;
      t1.runsConceded += r2.runs;
      t1.oversBowled += r2.overs;

      t2.runsScored += r2.runs;
      t2.oversFaced += r2.overs;
      t2.runsConceded += r1.runs;
      t2.oversBowled += r1.overs;

      if (r1.runs > r2.runs) {
        t1.won++;
        t1.points += settings.winPoints;
        t2.lost++;
      } else if (r2.runs > r1.runs) {
        t2.won++;
        t2.points += settings.winPoints;
        t1.lost++;
      } else {
        t1.tied++;
        t2.tied++;
        t1.points += settings.tiePoints;
        t2.points += settings.tiePoints;
      }
    });

    table.forEach(t => {
      const rs = t.runsScored / (t.oversFaced || 1);
      const rc = t.runsConceded / (t.oversBowled || 1);
      t.nrr = (rs - rc).toFixed(2);
    });

    return table.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return parseFloat(b.nrr) - parseFloat(a.nrr);
    });
  };

  return (
    <TournamentContext.Provider value={{
      teams, settings, schedule,
      updateTeam, addPlayer, removePlayer, updatePlayer, updateMatchResult, resetMatch, calculateStandings
    }}>
      {children}
    </TournamentContext.Provider>
  );
};
