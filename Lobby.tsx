
import React, { useState } from 'react';
import { db, ref, set, get, generateRoomCode } from '../services/firebase';

interface LobbyProps {
  nickname: string;
  setNickname: (name: string) => void;
  onJoinRoom: (code: string) => void;
  userId: string;
}

export const Lobby: React.FC<LobbyProps> = ({ nickname, setNickname, onJoinRoom, userId }) => {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    const code = generateRoomCode();
    const player = { id: userId, name: nickname, score: 0, isHost: true };
    
    await set(ref(db, `rooms/${code}`), {
      status: 'waiting',
      players: { [userId]: player },
      createdAt: Date.now()
    });
    
    onJoinRoom(code);
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!joinCode.trim()) {
      setError('방 코드를 입력해주세요.');
      return;
    }

    const upperCode = joinCode.toUpperCase();
    const snapshot = await get(ref(db, `rooms/${upperCode}`));
    
    if (snapshot.exists()) {
      const player = { id: userId, name: nickname, score: 0, isHost: false };
      await set(ref(db, `rooms/${upperCode}/players/${userId}`), player);
      onJoinRoom(upperCode);
    } else {
      setError('존재하지 않는 방 코드입니다.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-indigo-600 mb-2">CatchMind</h1>
        <p className="text-slate-500">실시간 멀티플레이 그림 퀴즈</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all"
            placeholder="이름을 입력하세요"
            maxLength={10}
          />
        </div>

        <div className="pt-4 border-t-2 border-slate-100 flex flex-col gap-3">
          <button
            onClick={handleCreateRoom}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 transform"
          >
            방 생성하기
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm">또는</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none uppercase font-mono tracking-widest"
              placeholder="방 코드"
              maxLength={6}
            />
            <button
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
            >
              참가
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center font-medium mt-2">{error}</p>}
      </div>
    </div>
  );
};
