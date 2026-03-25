export type SkillType = 'Good' | 'Average';

export interface Player {
  id: string;
  name: string;
  skill: SkillType;
  isCaptain: boolean;
  team?: 'A' | 'B';
  // Stats
  runs: number;
  ballsFaced: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  isOut?: boolean;
}

export interface Team {
  name: string;
  captain: string;
  players: Player[];
}

export type MatchStep = 
  | 'CAPTAIN_SETUP' 
  | 'PLAYER_ENTRY' 
  | 'LOTTERY' 
  | 'TOSS' 
  | 'MATCH_START' 
  | 'LIVE_SCORE' 
  | 'RESULT';

export interface Innings {
  battingTeam: 'A' | 'B';
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  target?: number;
}

export interface MatchState {
  step: MatchStep;
  teamA: Team;
  teamB: Team;
  totalPlayers: number;
  totalOvers: number;
  allPlayers: Player[];
  tossWinner?: 'A' | 'B';
  tossChoice?: 'Bat' | 'Bowl';
  currentInnings: 1 | 2;
  innings1: Innings;
  innings2: Innings;
  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;
  lastBowlerId?: string;
  isMatchOver: boolean;
}
