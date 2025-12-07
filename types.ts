export interface Room {
  id: string;
  code: string;
  name: string;
  phrase: string;
  phraseImage?: string; // Base64 encoded image
  targetCount: number; // 0 means open ended
  totalCount: number;
  isCompleted: boolean;
  createdAt: number;
  ownerId: string;
}

export interface Participant {
  id: string;
  roomCode: string;
  name: string;
  personalCount: number;
  joinedAt: number;
}

export enum AppRoute {
  HOME = '/',
  CREATE = '/create',
  ROOM = '/r/:roomCode'
}

export interface MasbahaContextType {
  rooms: Room[];
  participants: Participant[];
  currentUserCmdId: string; // Simulates a device ID
  createRoom: (name: string, phrase: string, targetCount: number, phraseImage?: string) => Room;
  joinRoom: (roomCode: string, userName: string) => Participant | null;
  getRoomByCode: (code: string) => Room | undefined;
  getRoomParticipants: (code: string) => Participant[];
  incrementCount: (roomCode: string, participantId: string) => void;
  isRoomOwner: (roomCode: string) => boolean;
  getMyParticipantId: (roomCode: string) => string | null;
  resetRoom: (roomCode: string) => void;
  updateRoomTarget: (roomCode: string, newTarget: number) => void;
}