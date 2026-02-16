
import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, update, push, set, remove, get } from '../services/firebase';
import { Player, Message, RoomState, WORDS } from '../types';
import { Canvas } from './Canvas';
import { Chat } from './Chat';
import { Scoreboard } from './Scoreboard';

interface GameRoomProps {
  roomCode: string;
  userId: string;
  nickname: string;
  onLeave: () => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ roomCode, userId, nickname, onLeave }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const playersRef = ref(db, `rooms/${roomCode}/players`);
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Player[];
        setPlayers(list.sort((a, b) => b.score - a.score));
      }
    });

    const stateRef = ref(db, `rooms/${roomCode}`);
    const unsubState = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomState({
          code: roomCode,
          status: data.status,
          drawerId: data.drawerId || null,
          currentWord: data.currentWord || null,
          timer: data.timer || 0,
          round: data.round || 0
        });
        setTimer(data.timer);
      }
    });

    return () => {
      unsubPlayers();
      unsubState();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode]);

  const isHost = players.find(p => p.id === userId)?.isHost;
  const isDrawer = roomState?.drawerId === userId;

  // Host Logic: Turn management
  useEffect(() => {
    if (!isHost || roomState?.status !== 'playing') return;

    timerRef.current = window.setInterval(async () => {
      if (timer > 0) {
        const nextTimer = timer - 1;
        setTimer(nextTimer);
        await update(ref(db, `rooms/${roomCode}`), { timer: nextTimer });
      } else {
        // Time over, next turn
        handleNextTurn();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, roomState?.status, timer]);

  const handleStartGame = async () => {
    if (players.length < 2) {
      alert('최소 2명이 필요합니다.');
      return;
    }
    await handleNextTurn();
  };

  const handleNextTurn = async () => {
    const nextWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    
    // Find next drawer
    let nextDrawerIndex = 0;
    if (roomState?.drawerId) {
      const currentIndex = players.findIndex(p => p.id === roomState.drawerId);
      nextDrawerIndex = (currentIndex + 1) % players.length;
    }
    const nextDrawerId = players[nextDrawerIndex].id;

    await update(ref(db, `rooms/${roomCode}`), {
      status: 'playing',
      drawerId: nextDrawerId,
      currentWord: nextWord,
      timer: 60,
      round: (roomState?.round || 0) + 1
    });

    // Clear canvas
    await set(ref(db, `rooms/${roomCode}/canvas`), null);
    
    // Add system message
    await push(ref(db, `rooms/${roomCode}/messages`), {
      senderId: 'system',
      senderName: 'SYSTEM',
      text: `라운드 ${(roomState?.round || 0) + 1} 시작! 출제자가 선정되었습니다.`,
      timestamp: Date.now(),
      isSystem: true
    });
  };

  const handleCorrectGuess = async (guessUserId: string, guessUserName: string) => {
    if (roomState?.status !== 'playing') return;

    // Add points
    const playerRef = ref(db, `rooms/${roomCode}/players/${guessUserId}`);
    const snapshot = await get(playerRef);
    const currentScore = snapshot.val()?.score || 0;
    await update(playerRef, { score: currentScore + 10 });

    // System announcement
    await push(ref(db, `rooms/${roomCode}/messages`), {
      senderId: 'system',
      senderName: 'SYSTEM',
      text: `${guessUserName}님이 정답 [${roomState.currentWord}]을(를) 맞췄습니다!`,
      timestamp: Date.now(),
      isSystem: true
    });

    // Go to next turn
    handleNextTurn();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-screen flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-mono font-bold">
            코드: {roomCode}
          </div>
          {roomState?.status === 'playing' && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-red-500">{timer}s</span>
              <div className="h-4 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000" 
                  style={{ width: `${(timer / 60) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {roomState?.status === 'playing' ? (
            <div className="bg-amber-100 text-amber-800 px-4 py-1 rounded-full font-semibold border border-amber-200">
              {isDrawer ? (
                <span>출제 단어: <strong className="text-xl">{roomState.currentWord}</strong></span>
              ) : (
                <span>출제자: <strong>{players.find(p => p.id === roomState.drawerId)?.name}</strong></span>
              )}
            </div>
          ) : (
            isHost && (
              <button 
                onClick={handleStartGame}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
              >
                게임 시작
              </button>
            )
          )}
          <button onClick={onLeave} className="text-slate-400 hover:text-red-500 transition-colors">방 나가기</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-grow bg-white rounded-2xl shadow-lg relative overflow-hidden flex flex-col border border-slate-200">
          <Canvas 
            roomCode={roomCode} 
            isDrawer={isDrawer} 
            status={roomState?.status || 'waiting'} 
          />
        </div>

        {/* Sidebar: Chat & Scores */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
            <Chat 
              roomCode={roomCode} 
              userId={userId} 
              nickname={nickname} 
              isDrawer={isDrawer} 
              currentWord={roomState?.currentWord || ''}
              onCorrect={(id, name) => handleCorrectGuess(id, name)}
            />
          </div>
          <div className="h-64 lg:h-48 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">플레이어 순위</h3>
            <Scoreboard players={players} currentDrawerId={roomState?.drawerId || null} />
          </div>
        </div>
      </div>
    </div>
  );
};
