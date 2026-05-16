import {
  Component, Input, OnChanges, OnDestroy, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, signal, PLATFORM_ID, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Renders a Mux HLS live stream inside a <video> element using hls.js.
 *
 * SRP : owns only HLS playback initialisation and teardown — no business logic.
 * OCP : extend Mux playback URL format without changing consumers (pass a new playbackId).
 * DIP : consumers depend only on the [playbackId] input contract; hls.js is an implementation detail.
 *
 * Usage:
 *   <app-live-stream-player [playbackId]="order.liveStreamPlaybackId" />
 *
 * Mux HLS URL pattern:
 *   https://stream.mux.com/{playbackId}.m3u8
 */
@Component({
  selector: 'app-live-stream-player',
  templateUrl: './live-stream-player.html',
  styleUrl: './live-stream-player.scss',
  standalone: true,
})
export class LiveStreamPlayer implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) playbackId!: string;

  @ViewChild('videoEl') private videoRef!: ElementRef<HTMLVideoElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly state = signal<'loading' | 'playing' | 'offline' | 'error'>('loading');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private hls: any = null;

  ngAfterViewInit(): void {
    if (this.isBrowser) this.initPlayer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['playbackId'] && !changes['playbackId'].firstChange && this.isBrowser) {
      this.destroyPlayer();
      this.state.set('loading');
      this.initPlayer();
    }
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
  }

  private get hlsUrl(): string {
    return `https://stream.mux.com/${this.playbackId}.m3u8`;
  }

  private async initPlayer(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    if (!video || !this.playbackId) return;

    // Native HLS (Safari/iOS) — no hls.js needed
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.hlsUrl;
      video.addEventListener('loadedmetadata', () => this.state.set('playing'), { once: true });
      video.addEventListener('error', () => this.state.set('offline'), { once: true });
      video.play().catch(() => { /* autoplay blocked — user will tap play */ });
      return;
    }

    // All other browsers — use hls.js
    try {
      const Hls = (await import('hls.js')).default;

      if (!Hls.isSupported()) {
        this.state.set('error');
        return;
      }

      this.hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      this.hls.loadSource(this.hlsUrl);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.state.set('playing');
        video.play().catch(() => { /* autoplay blocked */ });
      });

      this.hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean; type: string }) => {
        if (data.fatal) {
          // Network error = stream offline / not started
          this.state.set('offline');
          this.destroyPlayer();
        }
      });
    } catch {
      this.state.set('error');
    }
  }

  private destroyPlayer(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  retry(): void {
    this.state.set('loading');
    this.destroyPlayer();
    this.initPlayer();
  }
}
