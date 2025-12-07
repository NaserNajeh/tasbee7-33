import { useState, useEffect, useRef, useCallback } from 'react';
import { useMasbaha } from '../context/MasbahaContext';
import { Room, Participant } from '../types';

export const useRoomRealtime = (roomCode: string | undefined) => {
  const { 
    getRoomByCode, 
    getRoomParticipants, 
    joinRoom: ctxJoinRoom, 
    incrementCount: ctxIncrementCount, 
    bulkAddCount: ctxBulkAddCount,
    leaveRoom: ctxLeaveRoom,
    getMyParticipantId,
    resetRoom: ctxResetRoom,
    updateRoomTarget: ctxUpdateRoomTarget,
    isRoomOwner
  } = useMasbaha();

  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  
  // Alert Message State
  const [incomingMessage, setIncomingMessage] = useState<string | null>(null);
  
  // Ref to track previous completion state to trigger effects only on transition
  const prevIsCompleted = useRef<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const isOwner = roomCode ? isRoomOwner(roomCode) : false;

  // --- Helpers ---

  // Play a pleasant chime sound using Web Audio API (no external file needed)
  const playCompletionSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Create oscillators for a chord (C Major ish)
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        // Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1 + (i * 0.05)); // Staggered attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Long release
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 3);
      });
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  // Text to Speech Alert
  const playAlertSound = useCallback(() => {
    if ('speechSynthesis' in window) {
      // Cancel any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance("لديك رسالة هامة في المسبحة");
      utterance.lang = 'ar-SA'; // Arabic
      utterance.rate = 0.9; // Slightly slower
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback beep if TTS not supported
      playCompletionSound(); 
    }
  }, [playCompletionSound]);

  // Vibrate phone
  const vibratePhone = useCallback((pattern: number[] = [500, 200, 500]) => {
    if (isVibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [isVibrationEnabled]);

  // --- Core Logic ---

  const refreshState = useCallback(() => {
    if (!roomCode) return;
    const r = getRoomByCode(roomCode);
    if (r) {
      setRoom(r);
      // Trigger effects if newly completed
      if (r.isCompleted && !prevIsCompleted.current) {
        playCompletionSound();
        vibratePhone();
      }
      prevIsCompleted.current = r.isCompleted;
    } else {
       // Room might have been deleted/cleaned up
       setRoom(undefined);
    }
    setParticipants(getRoomParticipants(roomCode));
  }, [roomCode, getRoomByCode, getRoomParticipants, playCompletionSound, vibratePhone]);

  // --- Effects ---

  useEffect(() => {
    if (!roomCode) return;

    // 1. Initial Load
    refreshState();
    const myId = getMyParticipantId(roomCode);
    if (myId) setCurrentParticipantId(myId);

    // 2. Setup BroadcastChannel for "Realtime" sync across tabs
    const channelName = `masbaha_room_${roomCode}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data.type === 'UPDATE') {
        refreshState();
      }
      // Handle Admin Message
      else if (event.data.type === 'ALERT_MESSAGE') {
         const msg = event.data.message;
         if (msg) {
            setIncomingMessage(msg);
            playAlertSound();
            vibratePhone([200, 100, 200, 100, 500]);
         }
      }
    };

    // 3. Setup Storage Listener (Fallback/Additional Sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('masbaha')) {
        refreshState();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [roomCode, getMyParticipantId, refreshState, playAlertSound, vibratePhone]);

  // --- Exposed Actions ---

  const joinRoom = (name: string) => {
    if (!roomCode) return null;
    const p = ctxJoinRoom(roomCode, name);
    if (p) {
      setCurrentParticipantId(p.id);
      refreshState();
      channelRef.current?.postMessage({ type: 'UPDATE' });
    }
    return p;
  };

  const incrementTasbeeh = () => {
    if (!roomCode || !currentParticipantId || room?.isCompleted) return;
    
    // Optimistic Update locally
    setRoom(prev => prev ? { ...prev, totalCount: prev.totalCount + 1 } : undefined);
    setParticipants(prev => prev.map(p => p.id === currentParticipantId ? { ...p, personalCount: p.personalCount + 1 } : p));
    
    // Commit to context
    ctxIncrementCount(roomCode, currentParticipantId);
    
    // Notify others
    channelRef.current?.postMessage({ type: 'UPDATE' });

    // Local vibration for click feedback (short)
    if (isVibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const bulkAdd = (amount: number) => {
    if (!roomCode || !currentParticipantId || amount === 0) return;
    
    // Optimistic Update Locally (Immediate Feedback)
    setRoom(prev => prev ? { 
      ...prev, 
      totalCount: Math.max(0, prev.totalCount + amount) // Prevent negative totals
    } : undefined);

    setParticipants(prev => prev.map(p => p.id === currentParticipantId ? { 
      ...p, 
      personalCount: Math.max(0, p.personalCount + amount) // Prevent negative personal totals
    } : p));

    // Commit to Context
    ctxBulkAddCount(roomCode, currentParticipantId, amount);
    
    // Notify broadcast channel
    channelRef.current?.postMessage({ type: 'UPDATE' });
  };

  const leaveRoom = () => {
    if (!roomCode || !currentParticipantId) return;
    ctxLeaveRoom(roomCode, currentParticipantId);
    setCurrentParticipantId(null);
    refreshState();
    channelRef.current?.postMessage({ type: 'UPDATE' });
  };

  const resetRoomCounters = () => {
    if (!roomCode) return;
    ctxResetRoom(roomCode);
    refreshState();
    channelRef.current?.postMessage({ type: 'UPDATE' });
  };

  const updateTarget = (newTarget: number) => {
    if (!roomCode) return;
    ctxUpdateRoomTarget(roomCode, newTarget);
    refreshState();
    channelRef.current?.postMessage({ type: 'UPDATE' });
  };

  const toggleVibration = () => {
    setIsVibrationEnabled(prev => !prev);
  }

  // New: Send Message Function (Owner only)
  const sendRoomMessage = (text: string) => {
    if (!roomCode || !text) return;
    
    // Broadcast to others
    channelRef.current?.postMessage({ 
      type: 'ALERT_MESSAGE', 
      message: text 
    });
    
    // Show to self (Admin) immediately
    setIncomingMessage(text);
    playAlertSound();
    vibratePhone([200, 100, 200, 100, 500]);
  };
  
  const dismissMessage = () => {
    setIncomingMessage(null);
  };

  return {
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
  };
};