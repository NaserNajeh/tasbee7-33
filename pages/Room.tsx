import React, { useState } from 'react';
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
    bulkAdd,
    leaveRoom,
    isOwner,
    resetRoomCounters,
    updateTarget,
    isVibrationEnabled,
    toggleVibration,
    sendRoomMessage,
    incomingMessage,
    dismissMessage
  } = useRoomRealtime(roomCode);

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // For Owner
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false); // For User Preferences
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Image Scale State
  const [imageScale, setImageScale] = useState(1);
  const [showImageControls, setShowImageControls] = useState(false);

  // Masbaha Visual State
  const [masbahaScale, setMasbahaScale] = useState(1);
  const [isMasbahaLocked, setIsMasbahaLocked] = useState(false);

  // Edit Target State
  const [newTargetVal, setNewTargetVal] = useState('');
  const [bulkAddVal, setBulkAddVal] = useState('');
  
  // Broadcast Message State
  const [broadcastMsgVal, setBroadcastMsgVal] = useState('');

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

  const handleLeaveRoom = () => {
    if (window.confirm('هل تريد مغادرة الغرفة؟')) {
       leaveRoom();
       setIsUserSettingsOpen(false);
       navigate(AppRoute.HOME);
    }
  }

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

  const handleBulkAdd = () => {
     const val = parseInt(bulkAddVal);
     // Allow negative values for deduction, but not 0
     if (!isNaN(val) && val !== 0) {
        const action = val > 0 ? "إضافة" : "خصم";
        const absVal = Math.abs(val);
        if(window.confirm(`هل أنت متأكد من ${action} ${absVal} تسبيحة؟`)) {
            bulkAdd(val);
            setBulkAddVal('');
            setIsSettingsOpen(false);
        }
     }
  }

  const handleSendMessage = () => {
      if(broadcastMsgVal.trim()) {
          sendRoomMessage(broadcastMsgVal.trim());
          setBroadcastMsgVal('');
          setIsSettingsOpen(false);
          // Alert is now handled inside sendRoomMessage to show self-notification
      }
  }

  // --- Render Functions ---

  // 1. Loading / Not Found
  if (!roomCode) return <div className="flex h-screen items-center justify-center text-emerald-500 font-display text-xl animate-pulse">جاري الاتصال...</div>;
  if (!room && roomCode) return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center p-6 space-y-6">
      <div className="text-8xl mb-4 opacity-50 grayscale">📿</div>
      <h2 className="text-3xl text-slate-300 font-display">الغرفة غير موجودة أو انتهت</h2>
      <p className="text-slate-500">يتم حذف الغرف تلقائياً بعد 48 ساعة من عدم النشاط أو 10 ساعات من الاكتمال.</p>
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
      
      {/* Alert Message Overlay */}
      {incomingMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl p-6 border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-4 animate-bounce-slow">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h3 className="text-2xl font-display text-white">تنبيه إداري</h3>
              <p className="text-lg text-slate-300 leading-relaxed font-serif">
                 {incomingMessage}
              </p>
              <Button fullWidth onClick={dismissMessage} className="bg-amber-600 hover:bg-amber-500 mt-4">
                 علم
              </Button>
           </div>
        </div>
      )}

      {/* --- Top Bar: Navigation & Info --- */}
      <header className="px-5 pt-4 pb-2 shrink-0 z-30">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-4 bg-slate-800/30 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex gap-2">
            {/* User Settings Button (Gear) */}
            <button
               onClick={() => setIsUserSettingsOpen(true)}
               className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-colors border border-white/10"
               title="خيارات العرض"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            {/* Owner Settings Button */}
            {isOwner && (
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-900/30 hover:bg-amber-900/50 text-amber-500 transition-colors border border-amber-500/20"
                    title="إدارة الغرفة"
                >
                     <span className="text-xs font-bold hidden sm:inline">الإدارة</span>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
            )}

            {/* Stats Button */}
            <button 
                onClick={() => setIsStatsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors border border-emerald-500/20 relative"
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
          scale={masbahaScale}
          isLocked={isMasbahaLocked}
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

      {/* --- User Settings Sheet --- */}
      {isUserSettingsOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsUserSettingsOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e293b] rounded-t-3xl border-t border-slate-700 p-6 animate-fade-in-up">
                 <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-6"></div>
                 <h3 className="text-xl font-display text-slate-200 mb-6 text-center">الإعدادات</h3>
                 
                 <div className="space-y-6">
                    {/* Vibration Toggle */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300">اهتزاز الهاتف</span>
                        <button 
                            onClick={toggleVibration}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${isVibrationEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isVibrationEnabled ? 'translate-x-0' : '-translate-x-6'}`}></div>
                        </button>
                    </div>

                    {/* Lock Toggle */}
                     <div className="flex justify-between items-center">
                        <span className="text-slate-300">تثبيت الدائرة (منع السحب)</span>
                        <button 
                            onClick={() => setIsMasbahaLocked(!isMasbahaLocked)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${isMasbahaLocked ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isMasbahaLocked ? 'translate-x-0' : '-translate-x-6'}`}></div>
                        </button>
                    </div>

                    {/* Scale Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-400">
                             <span>حجم الدائرة</span>
                             <span>{(masbahaScale * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.6" 
                            max="1.5" 
                            step="0.1" 
                            value={masbahaScale} 
                            onChange={(e) => setMasbahaScale(parseFloat(e.target.value))}
                            className="w-full accent-emerald-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                     <div className="border-t border-slate-700/50 my-2"></div>

                     {/* Leave Room */}
                     <Button variant="secondary" fullWidth onClick={handleLeaveRoom} className="border-slate-600 text-slate-300">
                         مغادرة الغرفة
                     </Button>
                 </div>
            </div>
          </>
      )}

      {/* --- Owner Settings Sheet --- */}
      {isSettingsOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsSettingsOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e293b] rounded-t-3xl border-t border-slate-700 p-6 animate-fade-in-up">
                 <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-6"></div>
                 <h3 className="text-xl font-display text-amber-400 mb-6 text-center">إدارة الغرفة (المالك)</h3>
                 
                 <div className="space-y-6">
                     {/* Send Broadcast Message */}
                     <div className="space-y-2">
                        <label className="text-slate-300 text-sm">إرسال تنبيه للمشاركين</label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="اكتب رسالتك هنا..." 
                                value={broadcastMsgVal}
                                onChange={(e) => setBroadcastMsgVal(e.target.value)}
                            />
                            <Button onClick={handleSendMessage} disabled={!broadcastMsgVal} className="whitespace-nowrap px-4 bg-amber-600 hover:bg-amber-500">
                                إرسال
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-500">سيظهر التنبيه كنافذة منبثقة مع قراءة صوتية للجميع.</p>
                     </div>

                     <div className="border-t border-slate-700/50"></div>

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

                     <div className="space-y-2">
                         <label className="text-slate-300 text-sm">إضافة يدوي / خصم (رقم سالب)</label>
                         <div className="flex gap-2">
                             <Input 
                                type="number" 
                                placeholder="العدد (مثال: 50 أو -10)" 
                                value={bulkAddVal}
                                onChange={(e) => setBulkAddVal(e.target.value)}
                                className="text-center"
                             />
                             <Button variant="secondary" onClick={handleBulkAdd} disabled={!bulkAddVal || bulkAddVal === '0'} className="whitespace-nowrap px-6 text-emerald-400 border-emerald-500/30">
                                 تنفيذ
                             </Button>
                         </div>
                         <p className="text-[10px] text-slate-500">لإضافة عدد اكتب الرقم مباشرة، ولخصم عدد اكتب رقماً سالباً (مثلاً -10).</p>
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