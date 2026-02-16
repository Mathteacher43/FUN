
import React from 'react';
import { Player } from '../types';

interface ScoreboardProps {
  players: Player[];
  currentDrawerId: string | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players, currentDrawerId }) => {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div 
          key={player.id} 
          className={`flex items-center justify-between p-2 rounded-xl transition-colors ${player.id === currentDrawerId ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'}`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${player.id === currentDrawerId ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
            <span className={`text-sm font-bold ${player.id === currentDrawerId ? 'text-amber-800' : 'text-slate-700'}`}>
              {player.name}
              {player.isHost && <span className="ml-1 text-[10px] text-indigo-500 font-black">HOST</span>}
            </span>
          </div>
          <span className="text-xs font-black text-slate-500">{player.score} pts</span>
        </div>
      ))}
    </div>
  );
};
