import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getIpAndUserAgent() {
  const [ipRes] = await Promise.all([fetch('https://api.ipify.org?format=json')]);
  const ipData = await ipRes.json();
  const userAgent = navigator.userAgent;

  return {
    ip: ipData.ip,
    userAgent,
  };
}
