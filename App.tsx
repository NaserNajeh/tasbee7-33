import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { Room } from './pages/Room';
import { AppRoute } from './types';
import { MasbahaProvider } from './context/MasbahaContext';

const App: React.FC = () => {
  
  // Install prompt logic placeholder (PWA)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('Install prompt fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <MasbahaProvider>
      {/* خلفية التطبيق العامة - تدرج لوني عميق مستوحى من الليل والزخارف */}
      <div className="bg-[#0b1221] min-h-[100dvh] text-slate-50 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
        
        {/* تأثيرات إضاءة خلفية */}
        <div className="fixed top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        {/* نقشة الزخرفة */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03] pointer-events-none fixed z-0"></div>
        
        <div className="relative z-10 h-full">
          <HashRouter>
            <Routes>
              <Route path={AppRoute.HOME} element={<Home />} />
              <Route path={AppRoute.CREATE} element={<CreateRoom />} />
              <Route path={AppRoute.ROOM} element={<Room />} />
            </Routes>
          </HashRouter>
        </div>
      </div>
    </MasbahaProvider>
  );
};

export default App;