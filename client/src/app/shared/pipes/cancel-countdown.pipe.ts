import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a remaining-seconds value into M:SS display.
 * (SRP: display-only — no business logic)
 * Example: 95 → "1:35"
 */
@Pipe({ name: 'cancelCountdown', standalone: true, pure: true })
export class CancelCountdownPipe implements PipeTransform {
  transform(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
