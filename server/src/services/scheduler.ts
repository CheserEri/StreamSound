import cron from 'node-cron';
import { config } from '../config.js';
import { startScan } from './scanner.js';

let scheduledTask: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  if (scheduledTask) {
    return;
  }

  scheduledTask = cron.schedule(config.SCAN_CRON, async () => {
    console.log('[Scheduler] Starting scheduled scan...');
    await startScan();
    console.log('[Scheduler] Scan completed.');
  });

  console.log(`[Scheduler] Cron scheduled: ${config.SCAN_CRON}`);
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}
