import React, { useState, useRef, useEffect } from 'react';

interface DraggableMasbahaProps {
  totalCount: number;
  personalCount: number;
  isCompleted: boolean;
  onTap: () => void;
}

export const DraggableMasbaha: React.FC<DraggableMasbahaProps> = ({
  totalCount,
  personalCount,
  isCompleted,
  onTap
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // State for dragging physics
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs to track gestures without re-rendering
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialElementPos = useRef({ x: 0, y: 0 });
  const isPointerDown = useRef(false);

  // Reset position when component mounts or window resizes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCompleted) return;
    
    // Capture pointer to track movement even if it leaves the element
    (e.target as Element).setPointerCapture(e.pointerId);
    
    isPointerDown.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialElementPos.current = { ...position };
    
    // Visual feedback immediately
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    // Update position
    setPosition({
      x: initialElementPos.current.x + dx,
      y: initialElementPos.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    
    isPointerDown.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If movement is small (less than 10px), consider it a TAP
    if (distance < 10) {
      onTap();
      // Reset position to snap back slightly just for feel, or keep it there?
      // Let's keep it where it is to feel "physical".
    }
    
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none pointer-events-none">
      {/* The Container is pointer-events-none to let clicks pass through to background if needed, 
          but the button itself will capture events */}
      
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        disabled={isCompleted}
        className={`
          pointer-events-auto touch-none
          w-64 h-64 rounded-full
          flex flex-col items-center justify-center
          transition-shadow duration-300
          focus:outline-none
          ${isDragging ? 'scale-105 cursor-grabbing' : 'scale-100 cursor-grab'}
          ${isCompleted 
            ? 'bg-emerald-900/20 border-4 border-emerald-500/50 cursor-default' 
            : 'bg-gradient-to-br from-slate-800 to-[#0f172a] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-[6px] border-slate-700/50 hover:border-amber-500/30 active:border-amber-400 active:shadow-[0_0_30px_rgba(245,158,11,0.2)]'}
        `}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          // Important: hardware acceleration
          willChange: 'transform'
        }}
      >
        {/* Inner Ring Decoration */}
        {!isCompleted && (
          <div className="absolute inset-2 rounded-full border border-slate-600/30 pointer-events-none"></div>
        )}

        {isCompleted ? (
          <div className="flex flex-col items-center animate-fade-in text-emerald-400">
            <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl font-bold font-display">مبارك!</span>
          </div>
        ) : (
          <div className="pointer-events-none select-none flex flex-col items-center space-y-1">
            <span className="text-xs text-slate-400 font-medium">المجموع</span>
            <span className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 tracking-tight">
              {totalCount.toLocaleString()}
            </span>
            
            <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/5 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-xs text-amber-100/80 dir-rtl">
                 رصيدك: <span className="font-mono font-bold text-amber-400 text-sm">{personalCount}</span>
              </span>
            </div>
          </div>
        )}
      </button>

      {/* Ripple/Shadow hint underneath if needed */}
      {!isCompleted && (
        <div 
          className="absolute w-60 h-60 rounded-full bg-amber-500/5 blur-3xl -z-10 transition-transform duration-75"
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        />
      )}
    </div>
  );
};