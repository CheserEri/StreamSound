/**
 * 定时任务调度器
 * 使用 cron 表达式定期执行音乐扫描任务
 */
import cron from 'node-cron';
import { config } from '../config.js';
import { startScan } from './scanner.js';

// 定时任务实例
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * 启动定时调度器
 * 根据配置的 CRON 表达式定期执行音乐扫描
 */
export function startScheduler(): void {
  // 如果已经启动，直接返回
  if (scheduledTask) {
    return;
  }

  // 创建定时任务
  scheduledTask = cron.schedule(config.SCAN_CRON, async () => {
    console.log('[Scheduler] Starting scheduled scan...');
    await startScan();
    console.log('[Scheduler] Scan completed.');
  });

  console.log(`[Scheduler] Cron scheduled: ${config.SCAN_CRON}`);
}

/**
 * 停止定时调度器
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}
