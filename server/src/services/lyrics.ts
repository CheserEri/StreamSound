/**
 * 歌词服务
 * 提供 LRC 歌词文件的解析、查找和读取功能
 */
import { readFile, readdir } from 'fs/promises';
import { dirname, join, basename } from 'path';

/**
 * 解析 LRC 格式歌词内容
 * 将原始 LRC 内容解析为统一格式，处理不同格式的时间戳
 * @param content LRC 文件内容
 * @returns 标准化后的 LRC 字符串
 */
export function parseLRC(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    // 匹配 LRC 时间戳格式 [mm:ss.ms]
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

/**
 * 将同步歌词数组转换为 LRC 格式
 * @param syncText 同步歌词数组，包含时间戳和歌词文本
 * @returns LRC 格式字符串
 */
export function syncTextToLRC(syncText: { timestamp: number; text: string }[]): string {
  const result: string[] = [];
  for (const item of syncText) {
    if (!item.text) continue;
    const seconds = item.timestamp / 1000;
    result.push(`[${formatTime(seconds)}]${item.text}`);
  }
  return result.join('\n');
}

/**
 * 将秒数格式化为 LRC 时间戳格式
 * @param seconds 时间（秒）
 * @returns 格式化的时间字符串 [mm:ss.ms]
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * 查找音频文件对应的 LRC 歌词文件
 * 在音频文件所在目录查找同名的 .lrc 文件
 * @param audioPath 音频文件路径
 * @returns LRC 文件路径，如果未找到返回 null
 */
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
    // 目录读取失败，返回 null
  }

  return null;
}

/**
 * 读取并解析 LRC 文件
 * @param lrcPath LRC 文件路径
 * @returns 解析后的 LRC 字符串，如果读取失败返回 null
 */
export async function readLRCFile(lrcPath: string): Promise<string | null> {
  try {
    const content = await readFile(lrcPath, 'utf-8');
    return parseLRC(content);
  } catch {
    return null;
  }
}
