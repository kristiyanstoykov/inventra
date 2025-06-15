import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secret = process.env.ENCRYPT_SECRET || 'default_key';

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

export function encryptId(id: number): string {
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(id)), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64url'); // URL safe
}

export function decryptId(encrypted: string): number {
  const buffer = Buffer.from(encrypted, 'base64url');
  const iv = buffer.subarray(0, 16);
  const encryptedText = buffer.subarray(16);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return parseInt(decrypted.toString('utf-8'), 10);
}

export function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function buildUrl(
  options: { page?: number; sortKey?: string; sortDir?: 'asc' | 'desc' },
  params: string | Record<string, string> = ''
) {
  const urlSearchParams = new URLSearchParams(
    typeof params === 'string' ? params : Object.entries(params).map(([k, v]) => [k, v])
  );
  if (options.page !== undefined) urlSearchParams.set('page', String(options.page));
  if (options.sortKey) urlSearchParams.set('sortKey', options.sortKey);
  if (options.sortDir) urlSearchParams.set('sortDir', options.sortDir);
  return `?${urlSearchParams.toString()}`;
}
