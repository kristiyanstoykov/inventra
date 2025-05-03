// lib/getClientInfo.ts
import { headers } from 'next/headers';

export async function getClientInfo() {
  const headersList = await headers();

  // Try to extract real client IP
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp =
    forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip')?.trim() || null;

  // Get User-Agent
  const userAgent = headersList.get('user-agent') || 'unknown';

  return {
    ip: realIp,
    userAgent,
  };
}
