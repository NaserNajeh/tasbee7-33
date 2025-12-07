import React from 'react';
import { Participant } from '../types';

interface StatsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentParticipantId: string | null;
}

export const StatsSheet: React.FC<StatsSheetProps> = ({ 
  isOpen, 
  onClose, 
  participants,
  currentParticipantId 
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#1e293b] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-slate-700 transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Drag Handle */}
        <div className="w-full h-8 flex items-center justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        <div className="px-6 pb-8 overflow-y-auto max-h-[calc(70vh-2rem)]">
          <div className="flex justify-between items-end mb-6 border-b border-slate-700/50 pb-4">
            <h3 className="text-xl font-display text-amber-400">المشاركون في الأجر</h3>
            <span className="text-sm text-slate-400 font-mono">({participants.length})</span>
          </div>

          <div className="space-y-3">
            {participants.map((p, index) => {
              const isMe = p.id === currentParticipantId;
              const isTop = index === 0 && p.personalCount > 0;

              return (
                <div 
                  key={p.id} 
                  className={`
                    flex justify-between items-center p-4 rounded-xl border
                    ${isMe ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50'}
                    ${isTop ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${isTop ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isMe ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {p.name} {isMe && '(أنت)'}
                      </p>
                      {isTop && <span className="text-[10px] text-amber-400">الأكثر تسبيحاً</span>}
                    </div>
                  </div>
                  
                  <span className="font-mono text-lg font-bold text-slate-100">
                    {p.personalCount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};