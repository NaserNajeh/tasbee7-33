import { redis, KEYS } from '../lib/redis';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await request.json();
    const { action, roomCode, payload } = body;

    if (!roomCode) return new Response('Room code required', { status: 400 });

    const roomKey = KEYS.ROOM(roomCode);
    const participantsKey = KEYS.PARTICIPANTS(roomCode);

    // Fetch current room state first
    const roomData = await redis.get(roomKey) as any;
    if (!roomData) return new Response('Room not found', { status: 404 });

    let updatedRoom = { ...roomData };

    if (action === 'JOIN') {
      const { participant } = payload;
      // Add participant to the list
      await redis.rpush(participantsKey, JSON.stringify(participant));
      // Reset expiry on interaction
      await redis.expire(roomKey, 60 * 60 * 24 * 30);
      await redis.expire(participantsKey, 60 * 60 * 24 * 30);
      
      return new Response(JSON.stringify({ success: true }));
    }

    if (action === 'TAP') {
      const { participantId } = payload;

      if (updatedRoom.isCompleted) {
        return new Response(JSON.stringify({ success: false, message: 'Completed' }));
      }

      // Update total count
      updatedRoom.totalCount += 1;
      
      // Check completion
      if (updatedRoom.targetCount > 0 && updatedRoom.totalCount >= updatedRoom.targetCount) {
        updatedRoom.isCompleted = true;
      }

      // Update room data
      await redis.set(roomKey, JSON.stringify(updatedRoom));

      // Update participant score efficiently:
      // Since Redis lists don't support updating a specific item by ID easily without fetching all,
      // We will fetch, update in memory, and rewrite. 
      // Note: For high concurrency, a Hash structure `room:participants:{id}` would be better, 
      // but keeping it simple for this structure.
      const participantsList = await redis.lrange(participantsKey, 0, -1);
      const participants = participantsList.map((p: any) => JSON.parse(p));
      
      const pIndex = participants.findIndex((p: any) => p.id === participantId);
      if (pIndex !== -1) {
        participants[pIndex].personalCount += 1;
        // Rewrite the specific index is harder in raw Redis REST without LSET which needs index
        // We will just replace the specific item using LSET
        await redis.lset(participantsKey, pIndex, JSON.stringify(participants[pIndex]));
      }
    }

    if (action === 'RESET') {
      updatedRoom.totalCount = 0;
      updatedRoom.isCompleted = false;
      await redis.set(roomKey, JSON.stringify(updatedRoom));

      // Reset all participants
      const participantsList = await redis.lrange(participantsKey, 0, -1);
      const participants = participantsList.map((p: any) => JSON.parse(p));
      const resetParticipants = participants.map((p: any) => ({ ...p, personalCount: 0 }));
      
      // Delete old list and push new one
      await redis.del(participantsKey);
      // Upstash REST doesn't support RPUSH with array, loop needed or multiple args
      // For safety, we just push them back
      for (const p of resetParticipants) {
        await redis.rpush(participantsKey, JSON.stringify(p));
      }
    }

    if (action === 'UPDATE_TARGET') {
      const { newTarget } = payload;
      updatedRoom.targetCount = newTarget;
      if (newTarget > 0 && updatedRoom.totalCount >= newTarget) {
        updatedRoom.isCompleted = true;
      } else {
        updatedRoom.isCompleted = false;
      }
      await redis.set(roomKey, JSON.stringify(updatedRoom));
    }

    return new Response(JSON.stringify({ success: true, room: updatedRoom }));

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Action failed' }), { status: 500 });
  }
}
