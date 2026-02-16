
import React, { useRef, useEffect, useState } from 'react';
import { db, ref, onValue, push, set } from '../services/firebase';
import { DrawPoint } from '../types';

interface CanvasProps {
  roomCode: string;
  isDrawer: boolean;
  status: 'waiting' | 'playing' | 'ended';
}

export const Canvas: React.FC<CanvasProps> = ({ roomCode, isDrawer, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    // Listen for remote drawing data
    const canvasRef_db = ref(db, `rooms/${roomCode}/canvas`);
    const unsubscribe = onValue(canvasRef_db, (snapshot) => {
      const points = snapshot.val();
      if (!points) {
        // Clear canvas if database is cleared
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Re-draw all points (For a real production app, we'd only draw increments, but for simple MVP, we re-draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      Object.values(points).forEach((p: any) => {
        const point = p as DrawPoint;
        if (point.type === 'start') {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.strokeStyle = point.color;
          ctx.lineWidth = point.size;
        } else if (point.type === 'move') {
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        } else if (point.type === 'end') {
          ctx.stroke();
        }
      });
    });

    return () => unsubscribe();
  }, [roomCode]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || status !== 'playing') return;
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    
    push(ref(db, `rooms/${roomCode}/canvas`), {
      x, y, color, size: brushSize, type: 'start'
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || status !== 'playing') return;
    const { x, y } = getCoordinates(e);

    push(ref(db, `rooms/${roomCode}/canvas`), {
      x, y, color, size: brushSize, type: 'move'
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    push(ref(db, `rooms/${roomCode}/canvas`), {
      type: 'end'
    });
  };

  const clearCanvas = () => {
    if (!isDrawer) return;
    set(ref(db, `rooms/${roomCode}/canvas`), null);
  };

  return (
    <div className="relative flex-grow h-full flex flex-col">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="flex-grow cursor-crosshair bg-white"
      />
      
      {isDrawer && status === 'playing' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white p-2 rounded-2xl shadow-2xl flex gap-4 items-center">
          <div className="flex gap-2 p-1">
            {['#000000', '#ef4444', '#3b82f6', '#10b981', '#ffffff'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-indigo-400 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <input 
            type="range" min="1" max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <button 
            onClick={clearCanvas}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
          >
            전체 삭제
          </button>
        </div>
      )}

      {status === 'waiting' && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-xl font-bold text-slate-700 mb-2">대기 중...</p>
            <p className="text-slate-500 text-sm">모든 플레이어가 준비되면 호스트가 시작합니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};
