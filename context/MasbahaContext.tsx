import React, { createContext, useContext, useEffect, useState } from 'react';
import { Room, Participant, MasbahaContextType } from '../types';

const MasbahaContext = createContext<MasbahaContextType | undefined>(undefined);

const LS_KEYS = {
  CMD_ID: 'masbaha_cmd_id', // Unique ID for this browser
  MY_PARTICIPATIONS: 'masbaha_my_participations_v2', // Map roomCode -> participantId
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const MasbahaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We keep track of basic user session locally
  const [currentUserCmdId, setCurrentUserCmdId] = useState<string>('');
  
  // These are now mainly for initial loading or fallback, actual data comes via hooks
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    let cmdId = localStorage.getItem(LS_KEYS.CMD_ID);
    if (!cmdId) {
      cmdId = generateId();
      localStorage.setItem(LS_KEYS.CMD_ID, cmdId);
    }
    setCurrentUserCmdId(cmdId);
  }, []);

  // --- API Helpers ---

  const createRoom = async (name: string, phrase: string, targetCount: number, phraseImage?: string) => {
    const newRoom: Room = {
      id: generateId(),
      code: generateCode(),
      name,
      phrase: phrase || 'سبحان الله',
      phraseImage,
      targetCount: targetCount || 0,
      totalCount: 0,
      isCompleted: false,
      createdAt: Date.now(),
      ownerId: currentUserCmdId,
    };

    try {
      await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      return newRoom;
    } catch (e) {
      console.error("Failed to create room", e);
      throw e;
    }
  };

  const joinRoom = async (roomCode: string, userName: string) => {
    const newParticipant: Participant = {
      id: generateId(),
      roomCode,
      name: userName,
      personalCount: 0,
      joinedAt: Date.now(),
    };

    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          roomCode,
          payload: { participant: newParticipant }
        }),
      });

      // Save locally to remember I joined
      const map = JSON.parse(localStorage.getItem(LS_KEYS.MY_PARTICIPATIONS) || '{}');
      map[roomCode] = newParticipant.id;
      localStorage.setItem(LS_KEYS.MY_PARTICIPATIONS, JSON.stringify(map));

      return newParticipant;
    } catch (e) {
      console.error("Failed to join", e);
      return null;
    }
  };

  const incrementCount = async (roomCode: string, participantId: string) => {
    // Fire and forget (Optimistic update is handled in hook)
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TAP',
        roomCode,
        payload: { participantId }
      }),
    }).catch(e => console.error(e));
  };

  const resetRoom = async (roomCode: string) => {
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'RESET',
        roomCode,
        payload: {}
      }),
    }).catch(e => console.error(e));
  };

  const updateRoomTarget = async (roomCode: string, newTarget: number) => {
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_TARGET',
        roomCode,
        payload: { newTarget }
      }),
    }).catch(e => console.error(e));
  };

  // --- Local Getters (Synchronous) ---
  const getMyParticipantId = (roomCode: string) => {
    const map = JSON.parse(localStorage.getItem(LS_KEYS.MY_PARTICIPATIONS) || '{}');
    return map[roomCode] || null;
  };

  // Note: getRoomByCode and others are now less useful synchronously, 
  // the specific room page will fetch its own data.
  // We keep them as placeholders to satisfy the interface if needed, or return null.
  const getRoomByCode = (code: string) => rooms.find(r => r.code === code);
  const getRoomParticipants = (code: string) => participants.filter(p => p.roomCode === code);
  
  const isRoomOwner = (roomCode: string) => {
    // This needs the room data to be present. 
    // In the new architecture, the hook provides the room data. 
    // This helper checks against the loaded room in context or we check logic in component.
    // For now, we return true if the current command ID matches the room's owner ID
    // but the component needs to pass the room object or we fetch it.
    // To keep it simple, we will return false here and let the hook handle it with real data.
    return false; 
  };

  return (
    <MasbahaContext.Provider value={{
      rooms,
      participants,
      currentUserCmdId,
      createRoom: createRoom as any,
      joinRoom: joinRoom as any,
      getRoomByCode,
      getRoomParticipants,
      incrementCount,
      isRoomOwner,
      getMyParticipantId,
      resetRoom,
      updateRoomTarget
    }}>
      {children}
    </MasbahaContext.Provider>
  );
};

export const useMasbaha = () => {
  const context = useContext(MasbahaContext);
  if (!context) {
    throw new Error('useMasbaha must be used within a MasbahaProvider');
  }
  return context;
};
