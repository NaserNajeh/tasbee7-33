import React, { createContext, useContext, useEffect, useState } from 'react';
import { Room, Participant, MasbahaContextType } from '../types';

const MasbahaContext = createContext<MasbahaContextType | undefined>(undefined);

const LS_KEYS = {
  ROOMS: 'masbaha_rooms_v1',
  PARTICIPANTS: 'masbaha_participants_v1',
  CMD_ID: 'masbaha_cmd_id', // Unique ID for this browser
  MY_PARTICIPATIONS: 'masbaha_my_participations', // Map roomCode -> participantId
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit number

export const MasbahaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUserCmdId, setCurrentUserCmdId] = useState<string>('');

  // 1. Initialize / Load Data / Cleanup
  useEffect(() => {
    let savedRooms: Room[] = JSON.parse(localStorage.getItem(LS_KEYS.ROOMS) || '[]');
    const savedParticipants: Participant[] = JSON.parse(localStorage.getItem(LS_KEYS.PARTICIPANTS) || '[]');
    let cmdId = localStorage.getItem(LS_KEYS.CMD_ID);
    
    if (!cmdId) {
      cmdId = generateId();
      localStorage.setItem(LS_KEYS.CMD_ID, cmdId);
    }

    // --- Auto Cleanup Logic ---
    const now = Date.now();
    const INACTIVITY_LIMIT = 48 * 60 * 60 * 1000; // 48 Hours
    const COMPLETION_LIMIT = 10 * 60 * 60 * 1000; // 10 Hours after completion

    const filteredRooms = savedRooms.filter(room => {
      // Rule 1: Delete if inactive for 48h
      // Use lastActiveAt or fallback to createdAt for old rooms
      const lastActive = room.lastActiveAt || room.createdAt;
      const isInactive = (now - lastActive) > INACTIVITY_LIMIT;

      // Rule 2: Delete if completed > 10h ago
      const isExpiredCompletion = room.isCompleted && room.completedAt && (now - room.completedAt) > COMPLETION_LIMIT;

      return !isInactive && !isExpiredCompletion;
    });

    // Filter participants for keeping rooms only
    const validRoomCodes = new Set(filteredRooms.map(r => r.code));
    const filteredParticipants = savedParticipants.filter(p => validRoomCodes.has(p.roomCode));

    // Save cleaned up data if changes occurred
    if (filteredRooms.length !== savedRooms.length) {
       localStorage.setItem(LS_KEYS.ROOMS, JSON.stringify(filteredRooms));
       localStorage.setItem(LS_KEYS.PARTICIPANTS, JSON.stringify(filteredParticipants));
    }

    setRooms(filteredRooms);
    setParticipants(filteredParticipants);
    setCurrentUserCmdId(cmdId);
  }, []);

  // 2. Persist Data changes
  useEffect(() => {
    if (rooms.length > 0) localStorage.setItem(LS_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (participants.length > 0) localStorage.setItem(LS_KEYS.PARTICIPANTS, JSON.stringify(participants));
  }, [participants]);

  // --- Actions ---

  const createRoom = (name: string, phrase: string, targetCount: number, phraseImage?: string) => {
    const now = Date.now();
    const newRoom: Room = {
      id: generateId(),
      code: generateCode(),
      name,
      phrase: phrase || 'سبحان الله',
      phraseImage,
      targetCount: targetCount || 0,
      totalCount: 0,
      isCompleted: false,
      createdAt: now,
      lastActiveAt: now,
      ownerId: currentUserCmdId,
    };

    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const getRoomByCode = (code: string) => {
    return rooms.find(r => r.code === code);
  };

  const getRoomParticipants = (code: string) => {
    return participants.filter(p => p.roomCode === code).sort((a, b) => b.personalCount - a.personalCount);
  };

  const isRoomOwner = (roomCode: string) => {
    const room = getRoomByCode(roomCode);
    return room?.ownerId === currentUserCmdId;
  };

  const getMyParticipantId = (roomCode: string) => {
    const map = JSON.parse(localStorage.getItem(LS_KEYS.MY_PARTICIPATIONS) || '{}');
    return map[roomCode] || null;
  };

  const joinRoom = (roomCode: string, userName: string) => {
    const room = getRoomByCode(roomCode);
    if (!room) return null;

    // Update Room activity
    setRooms(prev => prev.map(r => r.code === roomCode ? { ...r, lastActiveAt: Date.now() } : r));

    const newParticipant: Participant = {
      id: generateId(),
      roomCode,
      name: userName,
      personalCount: 0,
      joinedAt: Date.now(),
    };

    setParticipants(prev => [...prev, newParticipant]);

    const map = JSON.parse(localStorage.getItem(LS_KEYS.MY_PARTICIPATIONS) || '{}');
    map[roomCode] = newParticipant.id;
    localStorage.setItem(LS_KEYS.MY_PARTICIPATIONS, JSON.stringify(map));

    return newParticipant;
  };

  const incrementCount = (roomCode: string, participantId: string) => {
    const now = Date.now();
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.code !== roomCode || room.isCompleted) return room;
      
      const newTotal = room.totalCount + 1;
      const isCompleted = room.targetCount > 0 && newTotal >= room.targetCount;
      
      return { 
        ...room, 
        totalCount: newTotal, 
        isCompleted, 
        lastActiveAt: now,
        completedAt: isCompleted ? now : undefined 
      };
    }));

    setParticipants(prevPart => prevPart.map(p => {
      if (p.id !== participantId) return p;
      return { ...p, personalCount: p.personalCount + 1 };
    }));
  };

  const bulkAddCount = (roomCode: string, participantId: string, amount: number) => {
     if (amount === 0) return; // Allow negative for deduction
     const now = Date.now();

     // Update Room Total
     setRooms(prevRooms => prevRooms.map(room => {
      if (room.code !== roomCode) return room;
      // Note: We typically allow bulk add even if it goes over target, then mark complete
      // If subtracting, we must check isCompleted state update (if it goes below target)
      
      const newTotal = Math.max(0, room.totalCount + amount); // Ensure we don't go below 0
      
      // Re-evaluate completion status
      const isCompleted = room.targetCount > 0 && newTotal >= room.targetCount;
      
      return { 
        ...room, 
        totalCount: newTotal, 
        isCompleted,
        lastActiveAt: now,
        completedAt: isCompleted ? now : undefined
      };
    }));

    // Update Participant Personal Count
    setParticipants(prevPart => prevPart.map(p => {
      if (p.id !== participantId) return p;
      return { ...p, personalCount: Math.max(0, p.personalCount + amount) };
    }));
  };

  const leaveRoom = (roomCode: string, participantId: string) => {
    // Remove from participants list
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    
    // Remove from local mapping
    const map = JSON.parse(localStorage.getItem(LS_KEYS.MY_PARTICIPATIONS) || '{}');
    delete map[roomCode];
    localStorage.setItem(LS_KEYS.MY_PARTICIPATIONS, JSON.stringify(map));
  };

  // --- Reset & Updates ---

  const resetRoom = (roomCode: string) => {
    const now = Date.now();
    // Reset Room Total
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.code !== roomCode) return room;
      return { 
        ...room, 
        totalCount: 0, 
        isCompleted: false, 
        lastActiveAt: now, 
        completedAt: undefined 
      };
    }));

    // Reset All Participants in that room
    setParticipants(prevPart => prevPart.map(p => {
      if (p.roomCode !== roomCode) return p;
      return { ...p, personalCount: 0 };
    }));
  };

  const updateRoomTarget = (roomCode: string, newTarget: number) => {
    const now = Date.now();
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.code !== roomCode) return room;
      const isCompleted = newTarget > 0 && room.totalCount >= newTarget;
      return { 
        ...room, 
        targetCount: newTarget, 
        isCompleted,
        lastActiveAt: now,
        completedAt: isCompleted ? now : undefined
      };
    }));
  };

  return (
    <MasbahaContext.Provider value={{
      rooms,
      participants,
      currentUserCmdId,
      createRoom,
      joinRoom,
      getRoomByCode,
      getRoomParticipants,
      incrementCount,
      bulkAddCount,
      isRoomOwner,
      getMyParticipantId,
      resetRoom,
      updateRoomTarget,
      leaveRoom
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