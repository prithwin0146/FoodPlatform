import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a remaining-seconds value into a human-readable ETA string.
 * (SRP: display-only — no business logic)
 *
 * Examples:
 *   3750 → "1h 2m"
 *   95   → "1m 35s"
 *   45   → "45s"
 *   0    → "Now"
 */
@Pipe({ name: 'etaCountdown', standalone: true, pure: true })
export class EtaCountdownPipe implements PipeTransform {
  transform(totalSeconds: number | null): string {
    if (totalSeconds === null || totalSeconds <= 0) return 'Now';
    const s = Math.floor(totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)  return `${h}h ${m}m`;
    if (m > 0)  return `${m}m ${sec}s`;
    return `${sec}s`;
  }
}
