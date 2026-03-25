/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  UserPlus, 
  Play, 
  RotateCcw, 
  ChevronRight, 
  Coins, 
  User, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { Player, Team, MatchStep, MatchState, Innings, SkillType } from './types';
import { getMatchAnalysis } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STORAGE_KEY = 'cricmaster_match_state';

const INITIAL_INNINGS = (battingTeam: 'A' | 'B'): Innings => ({
  battingTeam,
  runs: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
});

const INITIAL_STATE: MatchState = {
  step: 'CAPTAIN_SETUP',
  teamA: { name: '', captain: '', players: [] },
  teamB: { name: '', captain: '', players: [] },
  totalPlayers: 11,
  totalOvers: 5,
  allPlayers: [],
  currentInnings: 1,
  innings1: INITIAL_INNINGS('A'),
  innings2: INITIAL_INNINGS('B'),
  lastBowlerId: undefined,
  isMatchOver: false,
};

function MatchStartSelection({ battingTeam, bowlingTeam, onStart, setNotification }: { 
  battingTeam: Team; 
  bowlingTeam: Team; 
  onStart: (s: string, ns: string, b: string) => void;
  setNotification: (n: { message: string; type: 'error' | 'success' } | null) => void;
}) {
  const [strikerId, setStrikerId] = useState(battingTeam.players[0]?.id || '');
  const [nonStrikerId, setNonStrikerId] = useState(battingTeam.players[1]?.id || '');
  const [bowlerId, setBowlerId] = useState(bowlingTeam.players[0]?.id || '');

  return (
    <motion.div
      key="match-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-display font-bold text-emerald-400 uppercase tracking-tight text-glow">খেলার প্রস্তুতি</h2>
        <p className="text-slate-400 text-sm font-medium tracking-wide">আপনার উদ্বোধনী লাইনআপ নির্বাচন করুন</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-8 rounded-[2.5rem] space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <h3 className="text-sm font-display font-bold text-emerald-400 uppercase tracking-widest">ব্যাটসম্যান নির্বাচন করুন ({battingTeam.name})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-1">স্ট্রাইকার</label>
                <div className="relative group">
                  <select 
                    value={strikerId}
                    onChange={(e) => setStrikerId(e.target.value)}
                    className="w-full glass-input rounded-2xl px-5 py-4 appearance-none font-bold text-slate-200 cursor-pointer"
                  >
                    {battingTeam.players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-1">নন-স্ট্রাইকার</label>
                <div className="relative group">
                  <select 
                    value={nonStrikerId}
                    onChange={(e) => setNonStrikerId(e.target.value)}
                    className="w-full glass-input rounded-2xl px-5 py-4 appearance-none font-bold text-slate-200 cursor-pointer"
                  >
                    {battingTeam.players.map((p) => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <h3 className="text-sm font-display font-bold text-blue-400 uppercase tracking-widest">বোলার নির্বাচন করুন ({bowlingTeam.name})</h3>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-1">উদ্বোধনী বোলার</label>
              <div className="relative group">
                <select 
                  value={bowlerId}
                  onChange={(e) => setBowlerId(e.target.value)}
                  className="w-full glass-input rounded-2xl px-5 py-4 appearance-none font-bold text-slate-200 cursor-pointer"
                >
                  {bowlingTeam.players.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (strikerId === nonStrikerId) {
              setNotification({ message: 'স্ট্রাইকার এবং নন-স্ট্রাইকার অবশ্যই আলাদা খেলোয়াড় হতে হবে!', type: 'error' });
              return;
            }
            onStart(strikerId, nonStrikerId, bowlerId);
          }}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-lg"
        >
          খেলা শুরু করুন <Play className="w-6 h-6 fill-current" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [state, setState] = useState<MatchState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSkill, setNewPlayerSkill] = useState<SkillType>('Average');
  const [lotteryAnimation, setLotteryAnimation] = useState<string | null>(null);
  const [isTossing, setIsTossing] = useState(false);
  const [tossRotation, setTossRotation] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.step]);

  const resetMatch = () => {
    setState(INITIAL_STATE);
    setAnalysis(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleFetchAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await getMatchAnalysis(state);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const updateState = (updates: Partial<MatchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // --- Step 1: Captain Setup ---
  const handleCaptainSetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teamAName = formData.get('teamAName') as string;
    const teamBName = formData.get('teamBName') as string;
    const teamACaptain = formData.get('teamACaptain') as string;
    const teamBCaptain = formData.get('teamBCaptain') as string;
    const totalPlayers = parseInt(formData.get('totalPlayers') as string);
    const totalOvers = parseInt(formData.get('totalOvers') as string);

    const captains: Player[] = [
      { 
        id: 'cap-a', 
        name: teamACaptain, 
        skill: 'Good', 
        isCaptain: true, 
        team: 'A',
        runs: 0, ballsFaced: 0, wickets: 0, oversBowled: 0, runsConceded: 0, isOut: false 
      },
      { 
        id: 'cap-b', 
        name: teamBCaptain, 
        skill: 'Good', 
        isCaptain: true, 
        team: 'B',
        runs: 0, ballsFaced: 0, wickets: 0, oversBowled: 0, runsConceded: 0, isOut: false 
      },
    ];

    updateState({
      step: 'PLAYER_ENTRY',
      teamA: { ...state.teamA, name: teamAName, captain: teamACaptain, players: [captains[0]] },
      teamB: { ...state.teamB, name: teamBName, captain: teamBCaptain, players: [captains[1]] },
      totalPlayers,
      totalOvers,
      allPlayers: captains,
    });
  };

  const fillDemoPlayers = () => {
    const needed = state.totalPlayers * 2 - state.allPlayers.length;
    if (needed <= 0) return;
    
    const demoPlayers: Player[] = Array.from({ length: needed }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: `খেলোয়াড় ${state.allPlayers.length + i + 1}`,
      skill: Math.random() > 0.5 ? 'Good' : 'Average',
      isCaptain: false,
      runs: 0, ballsFaced: 0, wickets: 0, oversBowled: 0, runsConceded: 0, isOut: false
    }));

    updateState({
      allPlayers: [...state.allPlayers, ...demoPlayers]
    });
  };

  // --- Step 2: Player Entry ---
  const addPlayer = () => {
    if (state.allPlayers.length >= state.totalPlayers * 2) {
      setNotification({ message: 'সর্বোচ্চ খেলোয়াড় সংখ্যা পূর্ণ হয়েছে!', type: 'error' });
      return;
    }
    if (!newPlayerName.trim()) {
      setNotification({ message: 'খেলোয়াড়ের নাম লিখুন!', type: 'error' });
      return;
    }
    const player: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlayerName.trim(),
      skill: newPlayerSkill,
      isCaptain: false,
      runs: 0, ballsFaced: 0, wickets: 0, oversBowled: 0, runsConceded: 0, isOut: false
    };

    updateState({
      allPlayers: [...state.allPlayers, player]
    });
    setNewPlayerName('');
    setNotification({ message: `${newPlayerName} যোগ করা হয়েছে!`, type: 'success' });
  };

  // --- Step 3: Lottery ---
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startLottery = async () => {
    if (state.allPlayers.length < state.totalPlayers * 2) {
      setNotification({ message: `দয়া করে আরও ${state.totalPlayers * 2 - state.allPlayers.length} জন খেলোয়াড় যোগ করুন।`, type: 'error' });
      return;
    }

    updateState({ step: 'LOTTERY' });

    const captains = state.allPlayers.filter(p => p.isCaptain);
    const others = state.allPlayers.filter(p => !p.isCaptain);
    
    // Sort others by skill and shuffle each group properly
    const goodPlayers = shuffleArray(others.filter(p => p.skill === 'Good'));
    const avgPlayers = shuffleArray(others.filter(p => p.skill === 'Average'));

    const teamAPlayers = [captains.find(c => c.team === 'A')!].filter(Boolean);
    const teamBPlayers = [captains.find(c => c.team === 'B')!].filter(Boolean);

    let turn: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B';
    const distribute = async (pool: Player[]) => {
      for (const player of pool) {
        setLotteryAnimation(player.name);
        await new Promise(r => setTimeout(r, 600));
        
        if (turn === 'A') {
          const p = { ...player, team: 'A' as const };
          teamAPlayers.push(p);
          updateState({ teamA: { ...state.teamA, players: [...teamAPlayers] } });
          turn = 'B';
        } else {
          const p = { ...player, team: 'B' as const };
          teamBPlayers.push(p);
          updateState({ teamB: { ...state.teamB, players: [...teamBPlayers] } });
          turn = 'A';
        }
      }
    };

    await distribute(goodPlayers);
    await distribute(avgPlayers);

    setLotteryAnimation(null);
    setNotification({ message: 'লটারি সম্পন্ন হয়েছে!', type: 'success' });
    updateState({
      teamA: { ...state.teamA, players: teamAPlayers },
      teamB: { ...state.teamB, players: teamBPlayers },
      allPlayers: [...teamAPlayers, ...teamBPlayers]
    });
  };

  // --- Step 4: Toss ---
  const handleToss = async () => {
    if (isTossing) return;
    setIsTossing(true);
    
    // Better randomness for the winner
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const winner = randomBuffer[0] % 2 === 0 ? 'A' : 'B';
    
    // Cumulative rotation to avoid jumping back to 0
    const extraSpins = 8 + Math.floor(Math.random() * 7); // 8-15 spins for more excitement
    const currentMod = tossRotation % 360;
    const targetMod = winner === 'A' ? 0 : 180;
    
    let diff = targetMod - currentMod;
    if (diff < 0) diff += 360;
    
    const finalRotation = tossRotation + (extraSpins * 360) + diff;
    setTossRotation(finalRotation);
    
    // Wait for animation to complete (increased to 3.5s for more suspense)
    await new Promise(r => setTimeout(r, 3500));
    
    setIsTossing(false);
    updateState({ tossWinner: winner });
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: winner === 'A' ? ['#fbbf24', '#f59e0b', '#d97706'] : ['#94a3b8', '#64748b', '#475569']
    });
  };

  const handleTossChoice = (choice: 'Bat' | 'Bowl') => {
    const battingTeam = (state.tossWinner === 'A' && choice === 'Bat') || (state.tossWinner === 'B' && choice === 'Bowl') ? 'A' : 'B';
    updateState({ 
      tossChoice: choice, 
      step: 'MATCH_START',
      innings1: INITIAL_INNINGS(battingTeam),
      innings2: INITIAL_INNINGS(battingTeam === 'A' ? 'B' : 'A')
    });
  };

  // --- Step 5: Match Start / Live Score ---
  const startMatch = (strikerId: string, nonStrikerId: string, bowlerId: string) => {
    updateState({
      step: 'LIVE_SCORE',
      strikerId,
      nonStrikerId,
      bowlerId
    });
  };

  const handleScore = (action: number | 'W' | 'WD' | 'NB') => {
    if (!state.strikerId || !state.nonStrikerId || !state.bowlerId) return;

    const currentInningsKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
    const innings = state[currentInningsKey];
    
    let newRuns = innings.runs;
    let newWickets = innings.wickets;
    let newBalls = innings.balls;
    let newOvers = innings.overs;
    let newStrikerId = state.strikerId;
    let newNonStrikerId = state.nonStrikerId;
    let newBowlerId = state.bowlerId;

    const players = state.allPlayers.map(p => ({ ...p }));
    const striker = players.find(p => p.id === state.strikerId);
    const bowler = players.find(p => p.id === state.bowlerId);

    if (!striker || !bowler) return;

    if (typeof action === 'number') {
      newRuns += action;
      striker.runs += action;
      striker.ballsFaced += 1;
      bowler.runsConceded += action;
      newBalls += 1;
      
      if (action % 2 !== 0) {
        [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
      }
    } else if (action === 'W') {
      newWickets += 1;
      striker.ballsFaced += 1;
      striker.isOut = true;
      bowler.wickets += 1;
      newBalls += 1;
      newStrikerId = undefined;
    } else if (action === 'WD' || action === 'NB') {
      newRuns += 1;
      bowler.runsConceded += 1;
    }

    if (newBalls === 6) {
      newOvers += 1;
      newBalls = 0;
      bowler.oversBowled += 1;
      // Always rotate strike at end of over
      [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
      newBowlerId = undefined;
    }

    const isAllOut = newWickets >= state.totalPlayers - 1;
    const isTargetReached = state.currentInnings === 2 && innings.target && newRuns >= innings.target;
    const isOversFinished = newOvers === state.totalOvers && newBalls === 0;

    const updatedInnings = {
      ...innings,
      runs: newRuns,
      wickets: newWickets,
      overs: newOvers,
      balls: newBalls
    };

    if (isAllOut || isTargetReached || isOversFinished) {
      if (state.currentInnings === 1) {
        updateState({
          [currentInningsKey]: updatedInnings,
          currentInnings: 2,
          innings2: { ...state.innings2, target: newRuns + 1 },
          step: 'MATCH_START', // Go back to selection for 2nd innings
          strikerId: undefined,
          nonStrikerId: undefined,
          bowlerId: undefined,
          lastBowlerId: undefined,
          allPlayers: players
        });
      } else {
        updateState({
          [currentInningsKey]: updatedInnings,
          step: 'RESULT',
          isMatchOver: true,
          allPlayers: players
        });
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      updateState({
        [currentInningsKey]: updatedInnings,
        strikerId: newStrikerId,
        nonStrikerId: newNonStrikerId,
        bowlerId: newBowlerId,
        lastBowlerId: newBalls === 0 && newOvers > 0 ? state.bowlerId : state.lastBowlerId,
        allPlayers: players
      });
    }
  };

  const getWinner = () => {
    const i1 = state.innings1;
    const i2 = state.innings2;
    if (!i2.target) return null;
    
    if (i2.runs >= i2.target) {
      return i2.battingTeam === 'A' ? state.teamA.name : state.teamB.name;
    }
    
    const isAllOut = i2.wickets >= state.totalPlayers - 1;
    const isOversFinished = i2.overs === state.totalOvers && i2.balls === 0;
    
    if (isAllOut || isOversFinished) {
      if (i2.runs < i2.target - 1) {
        return i1.battingTeam === 'A' ? state.teamA.name : state.teamB.name;
      }
      return "ম্যাচ টাই হয়েছে!";
    }
    
    return null;
  };

  const currentInnings = state.currentInnings === 1 ? state.innings1 : state.innings2;
  const battingTeam = currentInnings.battingTeam === 'A' ? state.teamA : state.teamB;
  const bowlingTeam = currentInnings.battingTeam === 'A' ? state.teamB : state.teamA;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <Activity className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-slate-100 leading-none">ক্রিকমাস্টার</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Professional Scorer</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={resetMatch}
          className="p-2.5 hover:bg-red-500/10 rounded-xl transition-colors text-red-400 border border-transparent hover:border-red-500/20"
          title="ম্যাচ রিসেট করুন"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 24, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
          >
            <div className={cn(
              "px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border backdrop-blur-2xl",
              notification.type === 'error' ? "bg-red-500/20 border-red-500/50 text-red-100" : "bg-emerald-500/20 border-emerald-500/50 text-emerald-100"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                notification.type === 'error' ? "bg-red-500/20" : "bg-emerald-500/20"
              )}>
                {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <span className="font-display font-bold text-sm tracking-wide">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-md mx-auto p-6 pb-32">
        <AnimatePresence mode="wait">
          {/* STEP 1: CAPTAIN SETUP */}
          {state.step === 'CAPTAIN_SETUP' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-display font-bold text-emerald-400 uppercase tracking-tight text-glow">ম্যাচ সেটআপ</h2>
                <p className="text-slate-400 text-sm font-medium tracking-wide">যাত্রা শুরু করতে দলের বিবরণ লিখুন</p>
              </div>

              <form onSubmit={handleCaptainSetup} className="space-y-6">
                <div className="glass-card p-6 rounded-[2rem] space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                      <label className="text-[11px] font-display font-bold text-emerald-400 uppercase tracking-[0.2em]">দল এ-এর বিবরণ</label>
                    </div>
                    <div className="space-y-3">
                      <input required name="teamAName" placeholder="দল এ-এর নাম" className="w-full glass-input rounded-2xl px-5 py-4 font-bold text-slate-200 placeholder:text-slate-600" />
                      <input required name="teamACaptain" placeholder="অধিনায়কের নাম" className="w-full glass-input rounded-2xl px-5 py-4 font-bold text-slate-200 placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-blue-500 rounded-full" />
                      <label className="text-[11px] font-display font-bold text-blue-400 uppercase tracking-[0.2em]">দল বি-এর বিবরণ</label>
                    </div>
                    <div className="space-y-3">
                      <input required name="teamBName" placeholder="দল বি-এর নাম" className="w-full glass-input rounded-2xl px-5 py-4 font-bold text-slate-200 placeholder:text-slate-600" />
                      <input required name="teamBCaptain" placeholder="অধিনায়কের নাম" className="w-full glass-input rounded-2xl px-5 py-4 font-bold text-slate-200 placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">খেলোয়াড় / দল</label>
                      <input required type="number" name="totalPlayers" defaultValue={11} min={2} max={11} className="w-full glass-input rounded-2xl px-5 py-4 font-bold text-slate-200" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">মোট ওভার</label>
                      <input required type="number" name="totalOvers" defaultValue={5} min={1} max={50} className="w-full glass-input rounded-2xl px-5 py-4 font-bold text-slate-200" />
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-lg group"
                >
                  পরবর্তী ধাপ <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: PLAYER ENTRY */}
          {state.step === 'PLAYER_ENTRY' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                  <h2 className="text-3xl font-display font-bold text-emerald-400 uppercase tracking-tight text-glow">খেলোয়াড় এন্ট্রি</h2>
                  <p className="text-slate-400 text-xs font-medium tracking-wide">আরও {state.totalPlayers * 2 - state.allPlayers.length} জন খেলোয়াড় যোগ করুন</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-bold text-emerald-500 leading-none">{state.allPlayers.length}</span>
                    <span className="text-slate-600 text-sm font-bold">/{state.totalPlayers * 2}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-[2rem] space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      value={newPlayerName}
                      onChange={e => setNewPlayerName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addPlayer()}
                      placeholder="খেলোয়াড়ের নাম" 
                      className="w-full glass-input rounded-2xl pl-14 pr-5 py-4 font-bold text-slate-200 placeholder:text-slate-600" 
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    {(['Good', 'Average'] as SkillType[]).map(skill => (
                      <motion.button
                        key={skill}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setNewPlayerSkill(skill)}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-display font-bold transition-all border text-xs tracking-widest uppercase",
                          newPlayerSkill === skill 
                            ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]" 
                            : "bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10"
                        )}
                      >
                        {skill === 'Good' ? 'ভালো' : 'সাধারণ'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addPlayer}
                    className="flex-[2] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-display font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    <UserPlus className="w-5 h-5" /> যোগ করুন
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fillDemoPlayers}
                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-display font-bold py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest"
                  >
                    ডেমো পূরণ
                  </motion.button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-[0.2em]">বর্তমান তালিকা</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-4" />
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {state.allPlayers.map((p, idx) => (
                      <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-4 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white/5">
                            {idx + 1}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-200 tracking-tight">{p.name}</span>
                            {p.isCaptain && (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">অধিনায়ক</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border",
                          p.skill === 'Good' 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}>
                          {p.skill === 'Good' ? 'ভালো' : 'সাধারণ'}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {state.allPlayers.length === state.totalPlayers * 2 && (
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startLottery}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-lg"
                >
                  <Play className="w-6 h-6 fill-current" /> লটারি শুরু করুন
                </motion.button>
              )}
            </motion.div>
          )}

          {/* STEP 3: LOTTERY ANIMATION & RESULTS */}
          {state.step === 'LOTTERY' && (
            <motion.div
              key="lottery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {lotteryAnimation ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-8">
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-40 h-40 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-emerald-500/20">
                        <Users className="w-10 h-10 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-emerald-500 font-display font-bold uppercase tracking-[0.3em] text-xs">খেলোয়াড় নির্ধারণ করা হচ্ছে</p>
                    <motion.h3 
                      key={lotteryAnimation}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-5xl font-display font-black text-slate-100 tracking-tighter"
                    >
                      {lotteryAnimation}
                    </motion.h3>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-4xl font-display font-black text-emerald-400 uppercase tracking-tight text-glow italic">দল চূড়ান্ত</h2>
                    <p className="text-slate-400 text-sm font-medium">লটারি তার রায় দিয়েছে!</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Team A */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-[2.5rem] overflow-hidden border-emerald-500/20"
                    >
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60">দল এ</span>
                          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-slate-950">{state.teamA.name}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-950/20 backdrop-blur-sm flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-slate-950" />
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        {state.teamA.players.map((p, idx) => (
                          <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-600">{idx + 1}</span>
                              <span className={cn("font-bold tracking-tight", p.isCaptain ? "text-emerald-400" : "text-slate-200")}>
                                {p.name} {p.isCaptain && "©"}
                              </span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                              p.skill === 'Good' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-white/5"
                            )}>
                              {p.skill === 'Good' ? 'ভালো' : 'সাধারণ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Team B */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="glass-card rounded-[2.5rem] overflow-hidden border-blue-500/20"
                    >
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/60">দল বি</span>
                          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-slate-950">{state.teamB.name}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-950/20 backdrop-blur-sm flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-slate-950" />
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        {state.teamB.players.map((p, idx) => (
                          <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-600">{idx + 1}</span>
                              <span className={cn("font-bold tracking-tight", p.isCaptain ? "text-blue-400" : "text-slate-200")}>
                                {p.name} {p.isCaptain && "©"}
                              </span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                              p.skill === 'Good' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-slate-800 text-slate-500 border-white/5"
                            )}>
                              {p.skill === 'Good' ? 'ভালো' : 'সাধারণ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateState({ step: 'TOSS' })}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-lg"
                  >
                    টসের দিকে এগিয়ে যান <Coins className="w-6 h-6" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: TOSS SYSTEM */}
          {state.step === 'TOSS' && (
            <motion.div
              key="toss"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 space-y-16 min-h-[60vh]"
            >
              <div className="text-center space-y-3">
                <h2 className="text-5xl font-display font-black text-emerald-400 uppercase tracking-tighter italic text-glow">টস</h2>
                <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">কে শুরু করবে তা নির্ধারণ করতে সোনার মুদ্রাটি ফ্লিপ করুন</p>
              </div>

              {!state.tossWinner ? (
                <div className="flex flex-col items-center gap-16">
                  <div className="relative w-64 h-64 perspective-1000">
                    <motion.div
                      animate={{
                        rotateY: tossRotation,
                        y: isTossing ? [0, -300, 0] : 0,
                        scale: isTossing ? [1, 1.5, 1] : 1
                      }}
                      transition={{
                        duration: isTossing ? 3 : 0.6,
                        ease: isTossing ? [0.45, 0.05, 0.55, 0.95] : "easeOut"
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="w-full h-full relative cursor-pointer"
                      onClick={handleToss}
                    >
                      {/* Front Side (Team A) */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 rounded-full border-[8px] border-amber-100/50 flex flex-col items-center justify-center text-center p-8 shadow-[0_0_60px_rgba(245,158,11,0.3)] backface-hidden"
                      >
                        <div className="absolute inset-2 border-2 border-white/20 rounded-full" />
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                          <Coins className="w-10 h-10 text-white" />
                        </div>
                        <span className="font-display font-black text-[10px] uppercase text-amber-950/60 tracking-[0.3em] mb-1">দল এ</span>
                        <span className="font-display font-black text-lg leading-tight text-amber-950 uppercase tracking-tight">{state.teamA.name}</span>
                      </div>
                      
                      {/* Back Side (Team B) */}
                      <div 
                        style={{ transform: "rotateY(180deg)" }}
                        className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 rounded-full border-[8px] border-slate-100/50 flex flex-col items-center justify-center text-center p-8 shadow-[0_0_60px_rgba(148,163,184,0.3)] backface-hidden"
                      >
                        <div className="absolute inset-2 border-2 border-white/20 rounded-full" />
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                          <Coins className="w-10 h-10 text-white" />
                        </div>
                        <span className="font-display font-black text-[10px] uppercase text-slate-900/60 tracking-[0.3em] mb-1">দল বি</span>
                        <span className="font-display font-black text-lg leading-tight text-slate-950 uppercase tracking-tight">{state.teamB.name}</span>
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isTossing}
                    onClick={handleToss}
                    className={cn(
                      "px-12 py-6 rounded-full font-display font-black text-2xl transition-all flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] uppercase tracking-tighter italic",
                      isTossing 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed scale-95" 
                        : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    )}
                  >
                    {isTossing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RotateCcw className="w-8 h-8" />
                        </motion.div>
                        ফ্লিপ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Coins className="w-8 h-8" />
                        মুদ্রাটি ফ্লিপ করুন
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <motion.div 
                  initial={{ y: 30, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  className="w-full max-w-md space-y-8"
                >
                  <div className="glass-card p-10 rounded-[3rem] text-center space-y-8 relative overflow-hidden border-emerald-500/30">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                    
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500/10 rounded-3xl mb-2 border border-emerald-500/20 rotate-12">
                      <Trophy className="w-12 h-12 text-emerald-500 -rotate-12" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-emerald-500 font-display font-bold uppercase tracking-[0.3em] text-[10px]">টস বিজয়ী</p>
                      <h3 className="text-5xl font-display font-black tracking-tighter uppercase italic text-glow">
                        {state.tossWinner === 'A' ? state.teamA.name : state.teamB.name}
                      </h3>
                    </div>
                    
                    <p className="text-slate-400 font-medium text-sm">অভিনন্দন! আপনার সিদ্ধান্ত কি?</p>
                    
                    {!state.tossChoice && (
                      <div className="flex gap-4 pt-4">
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTossChoice('Bat')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-6 rounded-2xl font-display font-black text-xl shadow-xl transition-all uppercase tracking-tight"
                        >
                          ব্যাট 🏏
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTossChoice('Bowl')}
                          className="flex-1 bg-blue-500 hover:bg-blue-400 text-slate-950 py-6 rounded-2xl font-display font-black text-xl shadow-xl transition-all uppercase tracking-tight"
                        >
                          বোলিং 🧤
                        </motion.button>
                      </div>
                    )}
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateState({ tossWinner: undefined, tossChoice: undefined })}
                    className="w-full text-slate-500 hover:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
                  >
                    <RotateCcw className="w-4 h-4" /> আবার ফ্লিপ করুন
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 5: MATCH START (Selection) */}
          {state.step === 'MATCH_START' && (
            <MatchStartSelection 
              battingTeam={battingTeam} 
              bowlingTeam={bowlingTeam} 
              onStart={startMatch}
              setNotification={setNotification}
            />
          )}

          {/* STEP 6: LIVE SCOREBOARD */}
          {state.step === 'LIVE_SCORE' && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Score Display */}
              <div className="glass-card p-8 rounded-[2.5rem] border-emerald-500/30 shadow-2xl space-y-6 relative overflow-hidden bg-gradient-to-br from-emerald-950/40 to-slate-950/40">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Activity className="w-32 h-32" />
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-emerald-400 font-display font-bold uppercase tracking-[0.2em] text-[10px]">{battingTeam.name} ব্যাটিং</h3>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-display font-black tracking-tighter text-glow">{currentInnings.runs}</span>
                      <span className="text-4xl font-display font-bold text-emerald-500/30">/ {currentInnings.wickets}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-slate-500 text-[10px] font-display font-bold uppercase tracking-[0.3em]">ওভার</p>
                    <p className="text-4xl font-display font-black tracking-tighter text-slate-100 italic">{currentInnings.overs}.{currentInnings.balls}</p>
                  </div>
                </div>

                {state.currentInnings === 2 && currentInnings.target && (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-white/10">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">টার্গেট</span>
                      <p className="text-lg font-display font-black text-slate-200 leading-none">{currentInnings.target}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">প্রয়োজন</span>
                      <p className="text-sm font-bold text-emerald-400">{state.totalOvers * 6 - (currentInnings.overs * 6 + currentInnings.balls)} বলে {currentInnings.target - currentInnings.runs} রান</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "glass-card p-5 rounded-3xl border transition-all relative overflow-hidden",
                  state.strikerId ? "border-emerald-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.1)]" : "border-red-500/20 opacity-50"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", state.strikerId ? "bg-emerald-500" : "bg-red-500")} />
                    <p className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest">স্ট্রাইকার</p>
                  </div>
                  {state.strikerId ? (
                    <div className="space-y-1">
                      <p className="font-bold text-slate-100 truncate text-sm tracking-tight">{state.allPlayers.find(p => p.id === state.strikerId)?.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-display font-black text-emerald-400 leading-none">{state.allPlayers.find(p => p.id === state.strikerId)?.runs}</span>
                        <span className="text-xs text-slate-600 font-bold">({state.allPlayers.find(p => p.id === state.strikerId)?.ballsFaced})</span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {}}
                      className="text-[10px] font-bold text-red-400 uppercase tracking-widest"
                    >
                      ব্যাটসম্যান নির্বাচন
                    </button>
                  )}
                </div>

                <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <p className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest">নন-স্ট্রাইকার</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-100 truncate text-sm tracking-tight">{state.allPlayers.find(p => p.id === state.nonStrikerId)?.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-display font-black text-slate-300 leading-none">{state.allPlayers.find(p => p.id === state.nonStrikerId)?.runs}</span>
                      <span className="text-xs text-slate-600 font-bold">({state.allPlayers.find(p => p.id === state.nonStrikerId)?.ballsFaced})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowler Status */}
              <div className={cn(
                "glass-card p-5 rounded-3xl border flex justify-between items-center relative overflow-hidden",
                state.bowlerId ? "border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.1)]" : "border-red-500/20 opacity-50"
              )}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest mb-0.5">বর্তমান বোলার</p>
                    <p className="font-bold text-slate-100 tracking-tight">{state.bowlerId ? state.allPlayers.find(p => p.id === state.bowlerId)?.name : 'বোলার নির্বাচন করুন'}</p>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-2xl font-display font-black text-blue-400 leading-none">
                    {state.allPlayers.find(p => p.id === state.bowlerId)?.wickets} - {state.allPlayers.find(p => p.id === state.bowlerId)?.runsConceded}
                  </p>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">ওভার: {state.allPlayers.find(p => p.id === state.bowlerId)?.oversBowled}</p>
                </div>
              </div>

              {/* Controls */}
              {!state.strikerId || !state.nonStrikerId || !state.bowlerId ? (
                <div className="glass-card p-8 rounded-[2.5rem] border-amber-500/30 space-y-6 bg-amber-500/5 backdrop-blur-md">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 mb-2">
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <h4 className="font-display font-bold text-amber-500 uppercase tracking-[0.2em] text-xs">পদক্ষেপ প্রয়োজন</h4>
                  </div>
                  
                  {(!state.strikerId || !state.nonStrikerId) && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">চালিয়ে যেতে পরবর্তী ব্যাটসম্যান নির্বাচন করুন</p>
                      <div className="grid grid-cols-2 gap-3">
                        {battingTeam.players
                          .filter(p => p.id !== state.strikerId && p.id !== state.nonStrikerId && !state.allPlayers.find(ap => ap.id === p.id && ap.isOut))
                          .map(p => (
                            <motion.button 
                              key={p.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (!state.strikerId) updateState({ strikerId: p.id });
                                else updateState({ nonStrikerId: p.id });
                              }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-4 rounded-2xl text-xs font-bold tracking-tight transition-all"
                            >
                              {p.name}
                            </motion.button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  {!state.bowlerId && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">ওভারের জন্য পরবর্তী বোলার নির্বাচন করুন</p>
                      <div className="grid grid-cols-2 gap-3">
                        {bowlingTeam.players
                          .filter(p => p.id !== state.lastBowlerId)
                          .map(p => (
                            <motion.button 
                              key={p.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateState({ bowlerId: p.id })}
                              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-4 rounded-2xl text-xs font-bold tracking-tight transition-all"
                            >
                              {p.name}
                            </motion.button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {[0, 1, 2, 3, 4, 6].map(run => (
                    <motion.button 
                      key={run}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleScore(run)}
                      className="glass-card hover:bg-emerald-500 hover:text-slate-950 border-emerald-500/20 h-20 rounded-3xl font-display font-black text-2xl transition-all flex items-center justify-center shadow-xl"
                    >
                      {run}
                    </motion.button>
                  ))}
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleScore('W')}
                    className="bg-red-500 hover:bg-red-400 text-slate-950 h-20 rounded-3xl font-display font-black text-2xl shadow-xl transition-all flex items-center justify-center"
                  >
                    W
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleScore('WD')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 h-20 rounded-3xl font-display font-black text-2xl shadow-xl transition-all flex items-center justify-center"
                  >
                    WD
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleScore('NB')}
                    className="bg-orange-500 hover:bg-orange-400 text-slate-950 h-20 rounded-3xl font-display font-black text-2xl shadow-xl transition-all flex items-center justify-center"
                  >
                    NB
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 7: RESULT */}
          {state.step === 'RESULT' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10 py-6"
            >
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-amber-300 to-amber-600 rounded-[2.5rem] shadow-[0_20px_60px_rgba(245,158,11,0.4)] relative z-10"
                  >
                    <Trophy className="w-16 h-16 text-slate-950" />
                  </motion.div>
                  <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 -z-10 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-5xl font-display font-black text-emerald-400 uppercase tracking-tighter italic text-glow">ম্যাচ শেষ!</h2>
                  <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-xs">চূড়ান্ত ফলাফল</p>
                </div>

                <div className="glass-card p-10 rounded-[3.5rem] border-emerald-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-30" />
                  
                  <h3 className="text-3xl font-display font-black mb-8 text-slate-100 tracking-tight leading-tight">
                    {getWinner()?.includes('টাই') ? getWinner() : `${getWinner()} জিতেছে!`}
                  </h3>
                  
                  <div className="flex justify-center items-center gap-10">
                    <div className="space-y-2">
                      <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-slate-500">{state.teamA.name}</p>
                      <p className="text-3xl font-display font-black text-slate-100 italic">
                        {state.innings1.battingTeam === 'A' ? state.innings1.runs : state.innings2.runs}
                        <span className="text-xl text-slate-600 ml-1">/{state.innings1.battingTeam === 'A' ? state.innings1.wickets : state.innings2.wickets}</span>
                      </p>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="space-y-2">
                      <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-slate-500">{state.teamB.name}</p>
                      <p className="text-3xl font-display font-black text-slate-100 italic">
                        {state.innings1.battingTeam === 'B' ? state.innings1.runs : state.innings2.runs}
                        <span className="text-xl text-slate-600 ml-1">/{state.innings1.battingTeam === 'B' ? state.innings1.wickets : state.innings2.wickets}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-[0.2em]">সেরা পারফর্মার</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-4" />
                </div>
                
                <div className="space-y-3">
                  {state.allPlayers
                    .sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))
                    .slice(0, 3)
                    .map((p, i) => (
                      <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-5 rounded-3xl border border-white/5 flex justify-between items-center group hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-xl italic",
                            i === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : "bg-slate-900 text-slate-600 border border-white/5"
                          )}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 tracking-tight">{p.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{p.team === 'A' ? state.teamA.name : state.teamB.name}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="font-display font-black text-emerald-400 text-xl leading-none italic">{p.runs} <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">রান</span></p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.wickets} উইকেট</p>
                        </div>
                      </motion.div>
                    ))
                  }
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-[0.2em]">এআই বিশ্লেষণ</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-4" />
                </div>

                {!analysis ? (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFetchAnalysis}
                    disabled={isAnalyzing}
                    className="w-full glass-card p-6 rounded-3xl border border-emerald-500/20 flex flex-col items-center gap-4 group hover:border-emerald-500/50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-100 tracking-tight">ম্যাচ বিশ্লেষণ করুন</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">এআই এর মাধ্যমে পারফরম্যান্স রিপোর্ট পান</p>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <Sparkles className="w-5 h-5 text-emerald-500/30" />
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-emerald-400 prose-p:text-slate-300 prose-strong:text-emerald-400">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  </motion.div>
                )}
              </div>

              <button 
                onClick={resetMatch}
                className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                হোমে ফিরে যান <RotateCcw className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation (Mobile Only) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0f0a]/90 backdrop-blur-xl border-t border-green-900/20 px-6 py-4 flex justify-around items-center z-40">
        <div className="flex flex-col items-center gap-1 text-green-500">
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">ম্যাচ</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-600">
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">দল</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-600">
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">পরিসংখ্যান</span>
        </div>
      </footer>
    </div>
  );
}
