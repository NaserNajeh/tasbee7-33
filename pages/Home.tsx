import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppRoute } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    navigate(AppRoute.CREATE);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/r/${roomCode}`);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] relative">
      
      {/* القسم العلوي: الإلهام والشعار - يأخذ المساحة المتبقية */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 space-y-8 mt-4 md:mt-0">
        
        {/* الشعار */}
        <div className="relative animate-float">
           <div className="text-8xl drop-shadow-[0_0_25px_rgba(16,185,129,0.3)] filter grayscale-[0.2]">📿</div>
           <div className="absolute -inset-8 bg-emerald-500/5 blur-3xl rounded-full -z-10 animate-pulse-slow"></div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
            المسبحة
            <span className="text-emerald-400 font-light block mt-1 text-4xl md:text-5xl">الجماعية</span>
          </h1>
        </div>

        {/* الآية الكريمة - التصميم الجديد */}
        <div className="relative py-6 px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          <p className="text-amber-400 text-3xl md:text-4xl font-calligraphy leading-loose drop-shadow-md animate-fade-in" style={{ lineHeight: '1.8' }}>
            "وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ"
          </p>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        </div>
      </div>

      {/* القسم السفلي: التفاعل - تصميم البطاقة العائمة */}
      <div className="w-full z-20 p-6 animate-slide-up">
        <div className="max-w-md mx-auto bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-6 space-y-6">
          
          {/* زر الإنشاء - مميز */}
          <button 
            onClick={handleCreateRoom}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/20 group transition-all duration-300 transform active:scale-[0.98] flex items-center justify-between px-6"
          >
             <span className="flex flex-col items-start">
               <span className="text-xl font-bold">إنشاء غرفة جديدة</span>
               <span className="text-xs text-emerald-100/80 font-normal mt-1">ابدأ حلقة ذكر خاصة بك</span>
             </span>
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             </div>
          </button>

          {/* فاصل جمالي */}
          <div className="flex items-center gap-4">
             <div className="h-px flex-1 bg-slate-700/50"></div>
             <span className="text-slate-500 text-xs font-medium">الانضمام السريع</span>
             <div className="h-px flex-1 bg-slate-700/50"></div>
          </div>

          {/* الانضمام */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input 
                placeholder="كود الغرفة.." 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-center text-slate-100 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono text-lg placeholder:text-slate-600"
              />
            </div>
            <button 
               onClick={handleJoinRoom}
               disabled={!roomCode.trim()}
               className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-6 font-bold transition-all border border-slate-600/50 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            </button>
          </div>
          
        </div>

        {/* تذييل */}
        <p className="text-center text-slate-600 text-[10px] font-medium mt-6 opacity-60">
           وقف لله تعالى
        </p>
      </div>
    </div>
  );
};