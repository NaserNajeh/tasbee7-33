import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AppRoute } from '../types';
import { useMasbaha } from '../context/MasbahaContext';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom } = useMasbaha();
  
  const [name, setName] = useState('');
  const [phrase, setPhrase] = useState('سبحان الله وبحمده');
  const [target, setTarget] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [loadingImage, setLoadingImage] = useState(false);

  // Resize and encode image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoadingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImage(dataUrl);
          setLoadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !phrase.trim()) return;
    
    const targetNum = target ? parseInt(target) : 0;
    const room = createRoom(name, phrase, targetNum, image);
    
    // Redirect to the room
    navigate(`/r/${room.code}`);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-6 h-screen flex flex-col relative z-10">
      <div className="flex items-center mb-6 shrink-0 pt-2">
        <button 
          onClick={() => navigate(AppRoute.HOME)} 
          className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 className="text-2xl font-display text-emerald-400 mr-4 drop-shadow-sm">غرفة جديدة</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
        <div className="space-y-6 bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="space-y-6">
            <Input 
              label="اسم الغرفة" 
              placeholder="مثال: ختمة رمضان، أذكار الصباح..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900/50 border-slate-700 focus:border-emerald-500/50"
            />
            
            <div className="space-y-2">
               <label className="text-slate-300 text-sm font-medium pr-1 block">صيغة الذكر</label>
               <div className="flex flex-col gap-3">
                 <input
                    className="bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
                    placeholder="اكتب الصيغة هنا..."
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                 />
                 
                 <div className="relative group">
                   <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden" 
                      id="phrase-image"
                   />
                   <label 
                      htmlFor="phrase-image"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-600 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer"
                   >
                     {loadingImage ? (
                       <span className="text-xs text-slate-400 animate-pulse">جاري المعالجة...</span>
                     ) : image ? (
                       <div className="relative w-full h-32">
                         <img src={image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                           <span className="text-white text-xs">تغيير الصورة</span>
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center gap-2 text-slate-400">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                           <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                           <circle cx="8.5" cy="8.5" r="1.5"></circle>
                           <polyline points="21 15 16 10 5 21"></polyline>
                         </svg>
                         <span className="text-xs">رفع صورة للصيغة (اختياري)</span>
                       </div>
                     )}
                   </label>
                 </div>
               </div>
            </div>
            
            <div className="space-y-2">
              <Input 
                label="الهدف (اختياري)" 
                placeholder="اتركه فارغاً للعدد المفتوح" 
                type="number" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-slate-900/50 border-slate-700"
              />
              <p className="text-xs text-slate-500 mr-1 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-emerald-500 rounded-full"></span>
                سيتم إيقاف العداد وتنبيه المشاركين عند الوصول للهدف.
              </p>
            </div>
          </div>
          
          <div className="pt-6">
            <Button 
              fullWidth 
              onClick={handleSubmit}
              disabled={!name.trim() || !phrase.trim() || loadingImage}
              className="text-lg py-4 shadow-emerald-900/40 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border-none"
            >
              إنشاء وبدء التسبيح
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};