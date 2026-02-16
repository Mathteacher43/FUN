
import React, { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Player } from './types';
import { db, ref, onValue, remove } from './services/firebase';

const App: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Handle cleanup when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomCode) {
        remove(ref(db, `rooms/${roomCode}/players/${userId}`));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomCode, userId]);

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
        <Lobby 
          nickname={nickname} 
          setNickname={setNickname} 
          onJoinRoom={(code) => setRoomCode(code)} 
          userId={userId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <GameRoom 
        roomCode={roomCode} 
        userId={userId} 
        nickname={nickname}
        onLeave={() => setRoomCode(null)}
      />
    </div>
  );
};

export default App;
