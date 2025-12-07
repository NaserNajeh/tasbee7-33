import { redis, KEYS } from '../lib/redis';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await request.json();
    const { id, code, name, phrase, phraseImage, targetCount, ownerId, createdAt } = body;

    const room = {
      id,
      code,
      name,
      phrase,
      phraseImage,
      targetCount,
      totalCount: 0,
      isCompleted: false,
      createdAt,
      ownerId
    };

    // Save room metadata
    await redis.set(KEYS.ROOM(code), JSON.stringify(room));
    // Set expiry (optional: e.g., 30 days)
    await redis.expire(KEYS.ROOM(code), 60 * 60 * 24 * 30);

    return new Response(JSON.stringify(room), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create room' }), { status: 500 });
  }
}
