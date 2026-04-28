import { readFile, readdir } from 'fs/promises';
import { dirname, join, basename } from 'path';

export function parseLRC(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      result.push(`[${formatTime(time)}]${text}`);
    }
  }

  return result.join('\n');
}

export function syncTextToLRC(syncText: { timestamp: number; text: string }[]): string {
  const result: string[] = [];
  for (const item of syncText) {
    if (!item.text) continue;
    const seconds = item.timestamp / 1000;
    result.push(`[${formatTime(seconds)}]${item.text}`);
  }
  return result.join('\n');
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export async function findLRCFile(audioPath: string): Promise<string | null> {
  const dir = dirname(audioPath);
  const name = basename(audioPath).replace(/\.[^.]+$/, '');

  try {
    const files = await readdir(dir);
    const lrcFile = files.find(
      (f) => f.toLowerCase().endsWith('.lrc') && basename(f).replace(/\.[^.]+$/, '') === name,
    );

    if (lrcFile) {
      return join(dir, lrcFile);
    }
  } catch {
    // Directory read failed
  }

  return null;
}

export async function readLRCFile(lrcPath: string): Promise<string | null> {
  try {
    const content = await readFile(lrcPath, 'utf-8');
    return parseLRC(content);
  } catch {
    return null;
  }
}
