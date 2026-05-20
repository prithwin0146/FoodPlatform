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
  /** Full HLS playlist URL (e.g. from Angelcam or any CORS-accessible m3u8 endpoint). */
  @Input({ required: true }) hlsUrl!: string;

  @ViewChild('videoEl') private videoRef!: ElementRef<HTMLVideoElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly state = signal<'loading' | 'playing' | 'offline' | 'error'>('loading');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private hls: any = null;
  private _playingTimeout: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    if (this.isBrowser) this.initPlayer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hlsUrl'] && !changes['hlsUrl'].firstChange && this.isBrowser) {
      this._clearPlayingTimeout();
      this.destroyPlayer();
      this.state.set('loading');
      this.initPlayer();
    }
  }

  ngOnDestroy(): void {
    this._clearPlayingTimeout();
    this.destroyPlayer();
  }

  private async initPlayer(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    if (!video || !this.hlsUrl) return;

    // Native HLS (Safari/iOS) — no hls.js needed
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.hlsUrl;
      video.addEventListener('playing', () => {
        this._clearPlayingTimeout();
        this.state.set('playing');
      }, { once: true });
      video.addEventListener('error', () => {
        this._clearPlayingTimeout();
        this.state.set('offline');
      }, { once: true });
      // Start a timeout — if no real frames within 8s, treat as offline
      this._playingTimeout = setTimeout(() => {
        if (this.state() !== 'playing') this.state.set('offline');
      }, 8000);
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
        // Don't mark playing yet — wait for actual video frames via the 'playing' event.
        // Start a timeout: if no real playback starts within 8s, the stream is idle/offline.
        this._playingTimeout = setTimeout(() => {
          if (this.state() !== 'playing') {
            this.state.set('offline');
            this.destroyPlayer();
          }
        }, 8000);
        video.play().catch(() => { /* autoplay blocked */ });
      });

      // Actual frames are rendering — stream is genuinely live.
      video.addEventListener('playing', () => {
        this._clearPlayingTimeout();
        this.state.set('playing');
      }, { once: true });

      this.hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean; type: string }) => {
        if (data.fatal) {
          // Network error = stream offline / not started
          this._clearPlayingTimeout();
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

  private _clearPlayingTimeout(): void {
    if (this._playingTimeout !== null) {
      clearTimeout(this._playingTimeout);
      this._playingTimeout = null;
    }
  }

  retry(): void {
    this.state.set('loading');
    this._clearPlayingTimeout();
    this.destroyPlayer();
    this.initPlayer();
  }
}
