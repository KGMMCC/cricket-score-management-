import { GoogleGenAI } from "@google/genai";
import { MatchState, Player } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getMatchAnalysis(state: MatchState) {
  const winner = state.innings2.runs > (state.innings1.runs || 0) 
    ? (state.innings2.battingTeam === 'A' ? state.teamA.name : state.teamB.name)
    : (state.innings1.battingTeam === 'A' ? state.teamA.name : state.teamB.name);

  const teamAStats = state.teamA.players.map(p => `${p.name}: ${p.runs} runs (${p.ballsFaced} balls), ${p.wickets} wickets`).join('\n');
  const teamBStats = state.teamB.players.map(p => `${p.name}: ${p.runs} runs (${p.ballsFaced} balls), ${p.wickets} wickets`).join('\n');

  const prompt = `
    You are a professional cricket analyst. Analyze the following match data and provide a summary in Bengali.
    
    Match Details:
    - Team A: ${state.teamA.name} (Captain: ${state.teamA.captain})
    - Team B: ${state.teamB.name} (Captain: ${state.teamB.captain})
    - Winner: ${winner}
    - Innings 1 (${state.innings1.battingTeam === 'A' ? state.teamA.name : state.teamB.name}): ${state.innings1.runs}/${state.innings1.wickets} in ${state.innings1.overs}.${state.innings1.balls} overs
    - Innings 2 (${state.innings2.battingTeam === 'A' ? state.teamA.name : state.teamB.name}): ${state.innings2.runs}/${state.innings2.wickets} in ${state.innings2.overs}.${state.innings2.balls} overs
    
    Player Stats:
    Team A:
    ${teamAStats}
    
    Team B:
    ${teamBStats}
    
    Please provide:
    1. A brief summary of the match.
    2. Key performers from both teams.
    3. Turning point of the match.
    4. Suggestions for the losing team.
    
    Write the response in professional Bengali. Use markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "দুঃখিত, এই মুহূর্তে এআই বিশ্লেষণ পাওয়া যাচ্ছে না।";
  }
}
