
import React, { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, push } from '../services/firebase';
import { Message } from '../types';

interface ChatProps {
  roomCode: string;
  userId: string;
  nickname: string;
  isDrawer: boolean;
  currentWord: string;
  onCorrect: (userId: string, userName: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ roomCode, userId, nickname, isDrawer, currentWord, onCorrect }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = ref(db, `rooms/${roomCode}/messages`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data) as Message[]);
      }
    });
    return () => unsubscribe();
  }, [roomCode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    
    // Check for correct answer
    if (!isDrawer && currentWord && trimmedInput === currentWord) {
      onCorrect(userId, nickname);
      setInput('');
      return;
    }

    await push(ref(db, `rooms/${roomCode}/messages`), {
      senderId: userId,
      senderName: nickname,
      text: trimmedInput,
      timestamp: Date.now()
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
            {msg.isSystem ? (
              <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                {msg.text}
              </span>
            ) : (
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${msg.senderId === userId ? 'bg-indigo-600 text-white self-end rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                <span className="block text-[10px] opacity-70 mb-0.5 font-bold">{msg.senderName}</span>
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isDrawer ? "출제자는 정답을 칠 수 없습니다" : "정답을 맞춰보세요!"}
          disabled={isDrawer}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button 
          type="submit" 
          disabled={isDrawer}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
};
