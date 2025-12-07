import { useState, useEffect, useRef, useCallback } from 'react';
import { useMasbaha } from '../context/MasbahaContext';
import { Room, Participant } from '../types';

export const useRoomRealtime = (roomCode: string | undefined) => {
  const { 
    currentUserCmdId,
    getMyParticipantId,
    joinRoom: ctxJoinRoom, 
    incrementCount: ctxIncrementCount,
    resetRoom: ctxResetRoom,
    updateRoomTarget: ctxUpdateRoomTarget,
  } = useMasbaha();

  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  
  const prevIsCompleted = useRef<boolean>(false);
  const pollInterval = useRef<any>(null);

  // --- Helpers ---

  const playCompletionSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1 + (i * 0.05));
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3);
      });
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  const vibratePhone = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }
  }, []);

  // --- Data Fetching ---

  const fetchData = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/room?code=${roomCode}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setParticipants(data.participants.sort((a: Participant, b: Participant) => b.personalCount - a.personalCount));
        
        // Check for completion
        if (data.room.isCompleted && !prevIsCompleted.current) {
          playCompletionSound();
          vibratePhone();
        }
        prevIsCompleted.current = data.room.isCompleted;
      }
    } catch (err) {
      console.error("Polling error", err);
    }
  }, [roomCode, playCompletionSound, vibratePhone]);

  // --- Effects ---

  useEffect(() => {
    if (!roomCode) return;

    // Load local ID
    const myId = getMyParticipantId(roomCode);
    if (myId) setCurrentParticipantId(myId);

    // Initial Fetch
    fetchData();

    // Start Polling (every 2 seconds for MVP realtime)
    pollInterval.current = setInterval(fetchData, 2000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [roomCode, getMyParticipantId, fetchData]);

  // --- Actions ---

  const joinRoom = async (name: string) => {
    if (!roomCode) return null;
    const p = await ctxJoinRoom(roomCode, name);
    if (p) {
      setCurrentParticipantId(p.id);
      fetchData(); // Immediate fetch
    }
    return p;
  };

  const incrementTasbeeh = () => {
    if (!roomCode || !currentParticipantId || room?.isCompleted) return;
    
    // Optimistic Update
    setRoom(prev => prev ? { ...prev, totalCount: prev.totalCount + 1 } : undefined);
    setParticipants(prev => prev.map(p => 
      p.id === currentParticipantId ? { ...p, personalCount: p.personalCount + 1 } : p
    ).sort((a, b) => b.personalCount - a.personalCount));
    
    ctxIncrementCount(roomCode, currentParticipantId);
    
    // Local vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const resetRoomCounters = () => {
    if (!roomCode) return;
    
    // Optimistic
    setRoom(prev => prev ? { ...prev, totalCount: 0, isCompleted: false } : undefined);
    setParticipants(prev => prev.map(p => ({ ...p, personalCount: 0 })));

    ctxResetRoom(roomCode);
  };

  const updateTarget = (newTarget: number) => {
    if (!roomCode) return;
    ctxUpdateRoomTarget(roomCode, newTarget);
    setTimeout(fetchData, 500); // Sync after short delay
  };

  // Derived owner check
  const isOwner = room?.ownerId === currentUserCmdId;

  return {
    room,
    participants,
    currentParticipantId,
    joinRoom,
    incrementTasbeeh,
    isOwner,
    resetRoomCounters,
    updateTarget
  };
};
