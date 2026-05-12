import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Generates a two-tone notification beep using the Web Audio API.
 * No audio files required — tone is synthesised in the browser.
 * (SRP: audio concern isolated; Dashboard only calls notify())
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private ctx: AudioContext | null = null;

  /** Play a distinctive double-beep. Call when a new Pending order arrives. */
  newOrderAlert(): void {
    if (!this.isBrowser) return;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      this.beep(880, 0, 0.12);   // first beep: A5
      this.beep(1100, 0.18, 0.12); // second beep: C#6
    } catch {
      // Audio not available (blocked by browser policy) — silent fail
    }
  }

  private beep(frequency: number, startOffset: number, duration: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startOffset + duration);

    osc.start(this.ctx.currentTime + startOffset);
    osc.stop(this.ctx.currentTime + startOffset + duration + 0.05);
  }
}
