import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DraggableMasbaha } from '../components/DraggableMasbaha';
import { StatsSheet } from '../components/StatsSheet';
import { AppRoute } from '../types';
import { useRoomRealtime } from '../hooks/useRoomRealtime';

export const Room: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  
  // Use the new Realtime Hook
  const { 
    room, 
    participants, 
    currentParticipantId, 
    joinRoom, 
    incrementTasbeeh,
    isOwner,
    resetRoomCounters,
    updateTarget
  } = useRoomRealtime(roomCode);

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // For Owner
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Image Scale State
  const [imageScale, setImageScale] = useState(1);
  const [showImageControls, setShowImageControls] = useState(false);

  // Edit Target State
  const [newTargetVal, setNewTargetVal] = useState('');

  // Copy Code State
  const [copied, setCopied] = useState(false);

  const handleJoin = () => {
    if (!joinName.trim()) {
      setJoinError('الرجاء إدخال الاسم');
      return;
    }
    const p = joinRoom(joinName);
    if (p) {
      setJoinError('');
    }
  };

  const handleTap = () => {
    incrementTasbeeh();
  };

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Actions for Owner ---
  const handleReset = () => {
    if(window.confirm('هل أنت متأكد من تصفير العداد للجميع؟ لا يمكن التراجع عن هذا الإجراء.')) {
        resetRoomCounters();
        setIsSettingsOpen(false);
    }
  };

  const handleUpdateTarget = () => {
      const val = parseInt(newTargetVal);
      if (!isNaN(val) && val >= 0) {
          updateTarget(val);
          setIsSettingsOpen(false);
          setNewTargetVal('');
      }
  };

  // --- Render Functions ---

  // 1. Loading / Not Found
  if (!roomCode) return <div className="flex h-screen items-center justify-center text-emerald-500 font-display text-xl animate-pulse">جاري الاتصال...</div>;
  if (!room && roomCode) return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center p-6 space-y-6">
      <div className="text-8xl mb-4 opacity-50 grayscale">📿</div>
      <h2 className="text-3xl text-slate-300 font-display">الغرفة غير موجودة</h2>
      <Button variant="secondary" onClick={() => navigate(AppRoute.HOME)}>العودة للرئيسية</Button>
    </div>
  );

  // 2. Join Screen
  if (!currentParticipantId && room) {
    return (
      <div className="max-w-md mx-auto px-6 flex flex-col justify-center min-h-[100dvh] relative z-20">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm -z-10"></div>
        
        {/* Navigation for new users */}
        <div className="absolute top-6 left-6 right-6 flex justify-between">
           <button onClick={() => navigate(AppRoute.HOME)} className="text-slate-400 hover:text-white transition p-2 bg-slate-800/50 rounded-full">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
           </button>
        </div>

        <div className="text-center mb-10 space-y-3">
          <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4 font-mono">
             #{room.code}
          </div>
          <h1 className="text-5xl font-calligraphy text-transparent bg-clip-text bg-gradient-to-br from-gold-400 to-amber-600 leading-tight drop-shadow-sm pb-2">
            {room.name}
          </h1>
          <p className="text-slate-400 font-serif text-lg">أنت على وشك الانضمام لحلقة ذكر</p>
        </div>
        
        <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-2xl space-y-8 animate-fade-in-up">
          <Input 
            label="الاسم الكريم" 
            placeholder="اكتب اسمك للمشاركة" 
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            error={joinError}
            className="bg-slate-900/50 border-slate-700 text-lg py-3"
          />
          <Button fullWidth onClick={handleJoin} className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border-none shadow-amber-900/20 text-2xl py-3 font-calligraphy tracking-wider">
            دخول المجلس
          </Button>
          
          <div className="text-center pt-2">
             <button onClick={() => navigate(AppRoute.CREATE)} className="text-slate-500 text-sm hover:text-emerald-400 transition underline underline-offset-4 decoration-slate-700">
               أو أنشئ غرفتك الخاصة
             </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Interface
  const myStats = participants.find(p => p.id === currentParticipantId);
  const hasTarget = room!.targetCount > 0;
  const progressPercent = hasTarget 
    ? Math.min(100, (room!.totalCount / room!.targetCount) * 100) 
    : 0;
  const remaining = hasTarget ? Math.max(0, room!.targetCount - room!.totalCount) : 0;

  return (
    <div className="fixed inset-0 flex flex-col h-[100dvh] max-w-lg mx-auto overflow-hidden">
      
      {/* --- Top Bar: Navigation & Info --- */}
      <header className="px-5 pt-4 pb-2 shrink-0 z-30">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-4 bg-slate-800/30 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex gap-2">
            {/* Home Button */}
            <button 
              onClick={() => navigate(AppRoute.HOME)} 
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-white transition-all border border-transparent hover:border-emerald-500/30"
              title="الرئيسية"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </button>

             {/* Create Button */}
             <button 
              onClick={() => navigate(AppRoute.CREATE)} 
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-white transition-all border border-transparent hover:border-emerald-500/30"
              title="أنشئ غرفتك"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            {/* Owner Settings Button */}
            {isOwner && (
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-colors border border-white/10"
                    title="إعدادات الغرفة"
                >
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            )}

            {/* Stats Button */}
            <button 
                onClick={() => setIsStatsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gold-400 transition-colors border border-gold-500/20 relative"
            >
                <span className="text-xs font-bold hidden sm:inline">المشاركين</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {participants.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                )}
            </button>
          </div>
        </div>

        {/* Room Info */}
        <div className="text-center space-y-1 relative">
          <h1 className="text-slate-400 font-calligraphy text-2xl tracking-wide opacity-80">{room!.name}</h1>
          
          {/* Room Code - Copyable */}
          <button
             onClick={handleCopyCode}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group mb-2"
          >
             <span className="text-[10px] text-slate-400">رقم الغرفة</span>
             <span className="font-mono text-emerald-400 font-bold tracking-wider text-sm">{room!.code}</span>
             <div className="w-px h-3 bg-slate-700"></div>
             {copied ? (
               <span className="text-[10px] text-emerald-400 font-bold animate-fade-in">تم النسخ</span>
             ) : (
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-white transition-colors">
                 <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                 <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
               </svg>
             )}
          </button>
          
          {/* Phrase Display (Image or Text) */}
          <div className="min-h-[60px] flex flex-col items-center justify-center relative mt-2">
            {room!.phraseImage ? (
                <>
                <div 
                    className="relative rounded-2xl overflow-hidden border-2 border-gold-500/30 shadow-[0_0_20px_rgba(251,191,36,0.1)] transition-transform duration-300 ease-out cursor-zoom-in"
                    onClick={() => setShowImageControls(!showImageControls)}
                    style={{ transform: `scale(${imageScale})`, zIndex: showImageControls ? 40 : 10 }}
                >
                    <img src={room!.phraseImage} alt="ذكر" className="object-contain max-h-32 w-auto" />
                </div>
                
                {/* Scale Control */}
                {showImageControls && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/90 rounded-full px-4 py-1 z-50 flex items-center gap-2 border border-slate-600">
                        <span className="text-xs text-slate-400">🔍</span>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2.5" 
                            step="0.1" 
                            value={imageScale} 
                            onChange={(e) => setImageScale(parseFloat(e.target.value))}
                            className="w-24 accent-emerald-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}
              </>
            ) : (
              <p className="text-2xl md:text-3xl text-white font-serif font-bold leading-relaxed drop-shadow-md px-2">
                {room!.phrase}
              </p>
            )}
          </div>
          
          {/* Progress Bar */}
          {hasTarget && (
            <div className="mx-4 pt-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                <span>{room!.totalCount}</span>
                <span>{room!.targetCount}</span>
              </div>
              <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- Middle: Draggable Area --- */}
      <main className="flex-1 relative z-10 w-full overflow-hidden flex flex-col justify-center items-center py-4">
        <DraggableMasbaha 
          totalCount={room!.totalCount}
          personalCount={myStats?.personalCount || 0}
          isCompleted={room!.isCompleted}
          onTap={handleTap}
        />
      </main>

      {/* --- Bottom: Footer Info --- */}
      <footer className="px-6 pb-8 pt-2 shrink-0 text-center z-20">
        {room!.isCompleted ? (
          <div className="bg-gradient-to-br from-emerald-900/90 to-slate-900/90 backdrop-blur-md border border-emerald-500/30 p-6 rounded-2xl animate-fade-in shadow-2xl transform transition-all hover:scale-105">
             <div className="text-5xl mb-3 animate-bounce-slow">✨</div>
             <p className="text-emerald-300 font-calligraphy text-2xl mb-2">تقبل الله طاعتكم</p>
             <p className="text-white/90 text-sm font-serif">تم تحقيق العدد المطلوب بنجاح ولله الحمد</p>
             <div className="mt-5 flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate(AppRoute.CREATE)} className="text-xs py-2 px-4">
                  غرفة جديدة
                </Button>
                {isOwner && (
                    <Button variant="secondary" onClick={handleReset} className="text-xs py-2 px-4 border-amber-500/30 text-amber-400 hover:text-amber-300">
                        تكرار / تصفير
                    </Button>
                )}
                <Button variant="primary" onClick={() => navigate(AppRoute.HOME)} className="text-xs py-2 px-4 bg-emerald-600">
                  الرئيسية
                </Button>
             </div>
          </div>
        ) : hasTarget ? (
          <div className="flex flex-col items-center space-y-2 bg-slate-800/30 p-3 rounded-xl border border-white/5 backdrop-blur-sm mx-auto max-w-xs hover:bg-slate-800/50 transition-colors">
             <span className="text-slate-400 text-xs font-bold tracking-wide font-display">المتبقي للإتمام</span>
             <span className="text-3xl font-mono text-white font-bold tracking-tight drop-shadow-sm">{remaining.toLocaleString()}</span>
          </div>
        ) : (
          <p className="text-slate-500 text-xs font-medium bg-slate-900/50 py-2 px-4 rounded-full inline-block border border-slate-800">عدد مفتوح - تقبل الله منكم</p>
        )}
        
        <div className="mt-4 text-[10px] text-slate-600 font-serif opacity-70">
            وقف لله تعالى
        </div>
      </footer>

      {/* --- Stats Sheet --- */}
      <StatsSheet 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        participants={participants}
        currentParticipantId={currentParticipantId}
      />

      {/* --- Settings Sheet (Owner Only) --- */}
      {isSettingsOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsSettingsOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e293b] rounded-t-3xl border-t border-slate-700 p-6 animate-fade-in-up">
                 <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-6"></div>
                 <h3 className="text-xl font-display text-amber-400 mb-6 text-center">إعدادات الغرفة</h3>
                 
                 <div className="space-y-6">
                     <div className="space-y-2">
                         <label className="text-slate-300 text-sm">تعديل الهدف المطلوب</label>
                         <div className="flex gap-2">
                             <Input 
                                type="number" 
                                placeholder="الهدف الجديد" 
                                value={newTargetVal}
                                onChange={(e) => setNewTargetVal(e.target.value)}
                                className="text-center"
                             />
                             <Button onClick={handleUpdateTarget} disabled={!newTargetVal} className="whitespace-nowrap px-6">
                                 حفظ
                             </Button>
                         </div>
                     </div>
                     
                     <div className="border-t border-slate-700/50 my-4"></div>
                     
                     <Button variant="secondary" fullWidth onClick={handleReset} className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                         تصفير العداد والبدء من جديد ↻
                     </Button>
                 </div>
            </div>
          </>
      )}
    </div>
  );
};