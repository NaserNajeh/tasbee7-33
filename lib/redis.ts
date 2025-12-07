import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables
// These must be set in your Vercel project settings
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export const KEYS = {
  ROOM: (code: string) => `room:${code}`,
  PARTICIPANTS: (code: string) => `room:${code}:participants`,
};
