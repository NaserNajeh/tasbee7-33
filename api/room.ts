import { redis, KEYS } from '../lib/redis';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'Code required' }), { status: 400 });
  }

  try {
    // Pipeline to fetch room info and participants in one go
    const pipe = redis.pipeline();
    pipe.get(KEYS.ROOM(code));
    pipe.lrange(KEYS.PARTICIPANTS(code), 0, -1);
    
    const [roomData, participantsList] = await pipe.exec();

    if (!roomData) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    // Parse participants if they are stored as JSON strings in the list
    const participants = (participantsList as string[]).map(p => JSON.parse(p));

    return new Response(JSON.stringify({ 
      room: roomData, 
      participants 
    }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
  }
}
