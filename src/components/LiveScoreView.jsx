import React, { useState, useRef } from 'react';
import { useTournament } from '../store/TournamentContext';
import { Download, ArrowLeft, History } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const LiveScoreView = ({ matchId, onNavigate }) => {
  const { schedule, teams, settings, updateMatchResult, resetMatch } = useTournament();
  const scorecardRef = useRef(null);

  const match = schedule.find(m => m.id === matchId);
  const t1 = teams.find(t => t.id === match?.team1Id);
  const t2 = teams.find(t => t.id === match?.team2Id);

  // State
  const [innings, setInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(1); // 1 = t1, 2 = t2
  const [score1, setScore1] = useState({ runs: 0, wickets: 0, balls: 0, extras: 0 });
  const [score2, setScore2] = useState({ runs: 0, wickets: 0, balls: 0, extras: 0 });
  
  // Array of arrays. Each sub-array is an over containing balls.
  const [innings1History, setInnings1History] = useState([[]]); 
  const [innings2History, setInnings2History] = useState([[]]);

  const [matchOver, setMatchOver] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [isEditingScore, setIsEditingScore] = useState(false);

  if (!match || !t1 || !t2) return <div>Invalid Match</div>;

  const currentScore = innings === 1 ? (battingTeam === 1 ? score1 : score2) : (battingTeam === 1 ? score1 : score2);
  const setCurrentScore = innings === 1 ? (battingTeam === 1 ? setScore1 : setScore2) : (battingTeam === 1 ? setScore1 : setScore2);
  
  const currentHistory = innings === 1 ? innings1History : innings2History;
  const setCurrentHistory = innings === 1 ? setInnings1History : setInnings2History;

  const targetScore = innings === 2 ? (battingTeam === 1 ? score2.runs + 1 : score1.runs + 1) : null;

  const getOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

  const checkInningsOver = (newScore) => {
    if (newScore.wickets >= settings.playersPerTeam - 1 || newScore.balls >= settings.oversPerMatch * 6) {
      if (innings === 1) {
        setInnings(2);
        setBattingTeam(battingTeam === 1 ? 2 : 1);
      } else {
        finishMatch(newScore);
      }
      return true;
    }
    if (innings === 2 && newScore.runs >= targetScore) {
      finishMatch(newScore);
      return true;
    }
    return false;
  };

  const parseLabel = (label) => {
    const s = String(label);
    if (!s) return { runs: 0, wickets: 0, isExtra: false, ballCount: 0 };
    if (s.includes('Wd') || s.toLowerCase().includes('wd')) {
      return { runs: 1, wickets: 0, isExtra: true, ballCount: 0 };
    }
    if (s.includes('Nb') || s.toLowerCase().includes('nb')) {
      return { runs: 1, wickets: 0, isExtra: true, ballCount: 0 };
    }
    if (s.startsWith('W') || s.startsWith('w')) {
      // W or W+2
      const parts = s.split('+');
      const extra = parts[1] ? parseInt(parts[1], 10) || 0 : 0;
      return { runs: extra, wickets: 1, isExtra: false, ballCount: 1 };
    }
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      return { runs: num, wickets: 0, isExtra: false, ballCount: 1 };
    }
    return { runs: 0, wickets: 0, isExtra: false, ballCount: 0 };
  };

  const editBall = (overIdx, ballIdx) => {
    const hist = [...currentHistory];
    const over = hist[overIdx] ? [...hist[overIdx]] : null;
    if (!over) return;
    const oldLabel = over[ballIdx];
    const newLabel = window.prompt('Edit ball label (e.g. 0,1,2,4,W,W+2,Wd,Nb):', oldLabel);
    if (newLabel === null) return;

    const oldParsed = parseLabel(oldLabel);
    const newParsed = parseLabel(newLabel);

    // compute deltas
    const deltaRuns = newParsed.runs - oldParsed.runs;
    const deltaWickets = newParsed.wickets - oldParsed.wickets;
    const deltaExtras = (newParsed.isExtra ? 1 : 0) - (oldParsed.isExtra ? 1 : 0);
    const deltaBalls = newParsed.ballCount - oldParsed.ballCount;

    // update history
    over[ballIdx] = newLabel;
    hist[overIdx] = over;
    setCurrentHistory(hist);

    // update currentScore (works for displayed innings)
    const updated = { ...currentScore };
    updated.runs = Math.max(0, updated.runs + deltaRuns + deltaExtras); // extras counted in runs
    updated.wickets = Math.max(0, updated.wickets + deltaWickets);
    updated.extras = Math.max(0, updated.extras + deltaExtras);
    updated.balls = Math.max(0, updated.balls + deltaBalls);
    setCurrentScore(updated);
  };

  const finishMatch = (finalScore2) => {
    setMatchOver(true);
    const finalScore1 = battingTeam === 1 ? score2 : score1;
    const finalScore2Actual = battingTeam === 1 ? finalScore2 : (innings === 2 ? score2 : finalScore2);
    
    const s1 = battingTeam === 1 ? finalScore2Actual : finalScore1;
    const s2 = battingTeam === 1 ? finalScore1 : finalScore2Actual;

    let winnerId = null;
    let margin = '';

    if (s1.runs > s2.runs) {
      winnerId = t1.id;
      margin = `${s1.runs - s2.runs} runs`;
    } else if (s2.runs > s1.runs) {
      winnerId = t2.id;
      const wRem = (settings.playersPerTeam - 1) - s2.wickets;
      margin = `${wRem} wickets`;
    } else {
      winnerId = 'tie';
      margin = 'Tie';
    }

    setResultMsg(winnerId === 'tie' ? 'Match Tied!' : `${winnerId === t1.id ? t1.name : t2.name} won by ${margin}`);

    updateMatchResult(match.id, {
      winner: winnerId,
      winMargin: margin,
      team1: { runs: s1.runs, wickets: s1.wickets, overs: s1.balls / 6 },
      team2: { runs: s2.runs, wickets: s2.wickets, overs: s2.balls / 6 }
    });
  };

  const addBall = (runs, isWicket = false, isExtra = false, extraType = '') => {
    if (matchOver) return;

    let r = runs;
    let w = isWicket ? 1 : 0;
    let b = isExtra ? 0 : 1;
    let runsToAdd = isExtra ? (extraType === 'wide' || extraType === 'nb' ? 1 + runs : runs) : runs;

    const newScore = {
      ...currentScore,
      runs: currentScore.runs + runsToAdd,
      wickets: currentScore.wickets + w,
      balls: currentScore.balls + b,
      extras: currentScore.extras + (isExtra ? 1 : 0)
    };

    setCurrentScore(newScore);
    
    let historyLabel = isWicket ? 'W' : (isExtra ? (extraType === 'wide' ? `Wd` : (extraType === 'nb' ? `Nb` : r)) : r);
    if(isWicket && runs > 0) historyLabel = `W+${runs}`;
    
    // Add ball to current over in history
    let newHistory = [...currentHistory];
    let currentOverIdx = newHistory.length - 1;
    newHistory[currentOverIdx] = [...newHistory[currentOverIdx], historyLabel];

    // If ball was legal and it's the 6th ball, start a new over array (if match isn't over)
    if (!isExtra && newScore.balls % 6 === 0 && newScore.balls < settings.oversPerMatch * 6) {
      newHistory.push([]); // Prepare next over
    }

    setCurrentHistory(newHistory);
    checkInningsOver(newScore);
  };

  const undoLastBall = () => {
    if (matchOver) {
      // allow undo even after match conclusion
      setMatchOver(false);
      setResultMsg('');
    }

    let hist = [...currentHistory];
    if (hist.length === 0) return;
    let lastOverIdx = hist.length - 1;
    let lastOver = [...hist[lastOverIdx]];
    if (lastOver.length === 0) {
      if (hist.length === 1) return;
      // remove empty over
      hist.pop();
      setCurrentHistory(hist);
      return;
    }

    const lastLabel = lastOver.pop();
    hist[lastOverIdx] = lastOver;

    // revert score changes based on label
    const sc = { ...currentScore };
    if (typeof lastLabel === 'string') {
      if (lastLabel.includes('Wd')) {
        sc.extras = Math.max(0, sc.extras - 1);
        sc.runs = Math.max(0, sc.runs - 1);
      } else if (lastLabel.includes('Nb')) {
        sc.extras = Math.max(0, sc.extras - 1);
        sc.runs = Math.max(0, sc.runs - 1);
      } else if (lastLabel.includes('W+')) {
        const parts = lastLabel.split('+');
        const extraRuns = parseInt(parts[1] || '0', 10) || 0;
        sc.wickets = Math.max(0, sc.wickets - 1);
        sc.runs = Math.max(0, sc.runs - extraRuns);
        sc.balls = Math.max(0, sc.balls - 1);
      } else if (lastLabel === 'W') {
        sc.wickets = Math.max(0, sc.wickets - 1);
        sc.balls = Math.max(0, sc.balls - 1);
      } else {
        const num = parseInt(lastLabel, 10);
        if (!isNaN(num)) {
          sc.runs = Math.max(0, sc.runs - num);
          sc.balls = Math.max(0, sc.balls - 1);
        }
      }
    }

    setCurrentScore(sc);
    setCurrentHistory(hist);
  };

  const saveEditedScore = (vals) => {
    const { runs, wickets, balls, extras } = vals;
    setCurrentScore({ runs: Number(runs), wickets: Number(wickets), balls: Number(balls), extras: Number(extras) });
    setIsEditingScore(false);
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    
    // PDF Styling
    doc.setFillColor(15, 23, 42); // bg-slate-900
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SPL Manager - Match Result", 105, 30, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(148, 163, 184); // text-slate-400
    doc.text(`Match ${match.id} ${match.isFinal ? '(FINAL)' : ''}`, 105, 40, { align: "center" });

    // Winner Box
    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(20, 50, 170, 30, 3, 3, 'FD');
    
    doc.setTextColor(167, 139, 250); // Winner color
    doc.setFontSize(18);
    doc.text(resultMsg, 105, 68, { align: "center" });

    // Team 1 Stats
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(20, 90, 80, 50, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(t1.name, 60, 105, { align: "center" });
    doc.setFontSize(24);
    const s1 = battingTeam === 1 && innings === 1 ? score1 : (battingTeam === 1 ? score1 : (innings === 2 ? score1 : score1)); // simplified lookup
    // Actually, score1 and score2 map cleanly to t1 and t2 based on how we track it.
    // wait, battingTeam 1 means t1. So score1 is t1's score.
    doc.text(`${score1.runs}/${score1.wickets}`, 60, 120, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text(`Overs: ${getOvers(score1.balls)} | Extras: ${score1.extras}`, 60, 130, { align: "center" });

    // Team 2 Stats
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(110, 90, 80, 50, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(t2.name, 150, 105, { align: "center" });
    doc.setFontSize(24);
    doc.text(`${score2.runs}/${score2.wickets}`, 150, 120, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text(`Overs: ${getOvers(score2.balls)} | Extras: ${score2.extras}`, 150, 130, { align: "center" });

    // Footer
    doc.setFontSize(10);
    doc.text("Generated by Society Premier League Manager App", 105, 280, { align: "center" });

    doc.save(`SPL_Match_${matchId}_Result.pdf`);
  };

  const currentOverArray = currentHistory[currentHistory.length - 1] || [];

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => onNavigate('schedule')} className="flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} className="mr-1" /> Back to Schedule
        </button>
        <span className="badge badge-primary">Match {match.id} {match.isFinal ? 'FINAL' : ''}</span>
      </div>

      {/* Main Scoreboard Card */}
      <div className="glass-panel p-0 overflow-hidden relative border-blue-500/30">
        
        {/* Teams Header Overview */}
        <div className="flex bg-slate-900 border-b border-white/10">
          <div className={`flex-1 p-4 text-center border-r border-white/10 ${battingTeam === 1 && !matchOver ? 'bg-blue-900/20 border-b-2 border-b-blue-500' : ''}`}>
            <h3 className="text-sm font-bold text-slate-400 mb-1">{t1.name}</h3>
            <p className="text-xl font-bold text-white">{score1.runs}/{score1.wickets} <span className="text-xs text-slate-500 font-normal">({getOvers(score1.balls)})</span></p>
          </div>
          <div className={`flex-1 p-4 text-center ${battingTeam === 2 && !matchOver ? 'bg-blue-900/20 border-b-2 border-b-blue-500' : ''}`}>
            <h3 className="text-sm font-bold text-slate-400 mb-1">{t2.name}</h3>
            <p className="text-xl font-bold text-white">{score2.runs}/{score2.wickets} <span className="text-xs text-slate-500 font-normal">({getOvers(score2.balls)})</span></p>
          </div>
        </div>

        {/* Current Batting Focus */}
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <p className="text-amber-400 font-bold mb-2 uppercase tracking-widest text-sm">
              {matchOver ? 'Match Concluded' : `Innings ${innings} • ${battingTeam === 1 ? t1.name : t2.name} Batting`}
            </p>
            <div className="flex justify-center items-end gap-2">
              <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tighter">
                {currentScore.runs}<span className="text-3xl md:text-4xl text-slate-500">/{currentScore.wickets}</span>
              </h1>
            </div>
            <p className="text-lg text-blue-400 font-mono mt-2">
              Overs: {getOvers(currentScore.balls)} <span className="text-slate-500">/ {settings.oversPerMatch}</span>
            </p>
          </div>

          {innings === 2 && !matchOver && (
            <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-700 shadow-inner">
              <p className="text-sm text-slate-400 uppercase tracking-wider">Target</p>
              <h3 className="text-2xl font-bold text-emerald-400 my-1">{targetScore}</h3>
              <p className="text-sm font-medium text-slate-300">
                Need <span className="text-white">{targetScore - currentScore.runs}</span> runs in <span className="text-white">{(settings.oversPerMatch * 6) - currentScore.balls}</span> balls
              </p>
            </div>
          )}

          {matchOver && (
            <div className="mt-4 p-4 md:p-6 bg-emerald-900/30 border border-emerald-500/50 rounded-2xl text-center shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-400">{resultMsg}</h2>
                <div className="flex flex-col md:flex-row gap-3 items-center justify-center mt-6">
                  <button onClick={handleDownloadPDF} className="btn btn-primary w-full md:w-auto">
                    <Download size={18} className="mr-2" /> Download PDF Result
                  </button>
                  <button onClick={() => {
                    // clear local score state and reset schedule
                    resetMatch(match.id);
                    setScore1({ runs: 0, wickets: 0, balls: 0, extras: 0 });
                    setScore2({ runs: 0, wickets: 0, balls: 0, extras: 0 });
                    setInnings(1);
                    setBattingTeam(1);
                    setInnings1History([[]]);
                    setInnings2History([[]]);
                    setMatchOver(false);
                    setResultMsg('');
                  }} className="btn btn-secondary w-full md:w-auto">
                    Rematch
                  </button>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel (Hidden if match over) */}
      {!matchOver && (
        <div className="glass-panel animate-fade-in space-y-6 border-amber-500/20">
          
          {/* Detailed Over History Timeline */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <History size={16} />
              <h4 className="text-sm font-bold uppercase tracking-wider">Live Data Record</h4>
            </div>
            
            <div className="history-list max-h-[160px] overflow-y-auto pr-2">
              {currentHistory.length === 0 && <div className="text-xs text-slate-600 italic py-2">No balls yet — Ready</div>}
              {currentHistory.map((overBalls, overIdx) => (
                <div key={overIdx} className={`mb-2 p-2 rounded-lg ${overIdx === currentHistory.length - 1 ? 'bg-blue-900/10 border border-blue-500/20' : 'bg-slate-800/30'}`}>
                  <div className="text-xs font-bold text-slate-500 mb-1">Over {overIdx + 1}</div>
                  <div className="flex flex-col gap-1">
                      {overBalls.map((b, ballIdx) => (
                        <div key={ballIdx} className="text-sm text-slate-100 flex items-center gap-2">
                          <span className="text-slate-400">Ball {ballIdx + 1}:</span>
                          <button
                            className={`text-left ${String(b).includes('W') ? 'text-red-400' : (String(b).includes('Wd')||String(b).includes('Nb') ? 'text-amber-400' : 'text-blue-200')}`}
                            onClick={() => editBall(overIdx, ballIdx)}
                            title="Click to edit this ball"
                          >{b}</button>
                        </div>
                      ))}
                    {overBalls.length === 0 && <div className="text-xs text-slate-500 italic">—</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring Buttons */}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Runs & Wickets</p>
            <div className="scoring-row">
              {/* Removed 5 and 6 buttons */}
              {[0, 1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => addBall(r)} className="btn btn-secondary btn-score bg-slate-800 hover:bg-slate-700">
                  {r}
                </button>
              ))}
              <button onClick={() => addBall(0, true)} className="btn btn-danger btn-score shadow-[0_0_15px_rgba(239,68,68,0.3)]">W</button>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Extras & Street Rules</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => addBall(0, false, true, 'wide')} className="btn btn-secondary text-sm py-3 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400">Wide</button>
              <button onClick={() => addBall(0, false, true, 'nb')} className="btn btn-secondary text-sm py-3 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400">No Ball</button>
              <button onClick={() => addBall(0, true)} className="btn btn-danger text-sm py-3 shadow-none opacity-90">Net (Out)</button>
              <button onClick={() => addBall(1)} className="btn btn-secondary text-sm py-3 text-blue-300 border-blue-500/30 hover:bg-blue-500/10">Behind (1)</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={undoLastBall} className="btn btn-secondary text-sm py-2 px-3">Undo Last Ball</button>
            <button onClick={() => setIsEditingScore(true)} className="btn btn-secondary text-sm py-2 px-3">Edit Score</button>
          </div>
        </div>
      )}

      {/* Edit Score Modal */}
      {isEditingScore && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm">
            <div className="modal-inner">
              <div className="p-2 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit Current Score</h3>
                <button onClick={() => setIsEditingScore(false)} className="p-2 rounded hover:bg-white/5">Close</button>
              </div>
              <div className="p-3 space-y-3">
                <label className="text-sm text-slate-400">Runs</label>
                <input defaultValue={currentScore.runs} type="number" id="edit_runs" className="input-field" />
                <label className="text-sm text-slate-400">Wickets</label>
                <input defaultValue={currentScore.wickets} type="number" id="edit_wickets" className="input-field" />
                <label className="text-sm text-slate-400">Balls</label>
                <input defaultValue={currentScore.balls} type="number" id="edit_balls" className="input-field" />
                <label className="text-sm text-slate-400">Extras</label>
                <input defaultValue={currentScore.extras} type="number" id="edit_extras" className="input-field" />
                <div className="flex gap-2">
                  <button onClick={() => saveEditedScore({ runs: document.getElementById('edit_runs').value, wickets: document.getElementById('edit_wickets').value, balls: document.getElementById('edit_balls').value, extras: document.getElementById('edit_extras').value })} className="btn btn-primary flex-1">Save</button>
                  <button onClick={() => setIsEditingScore(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScoreView;
