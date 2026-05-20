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
 *   <app-live-stream-player [playbackId]="order.angelcamCameraId" />
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

    // Native HLS (Safari / iOS Chrome / all iOS browsers) — no hls.js needed.
    // Use loadedmetadata (not 'playing') so we show the video even when autoplay
    // is blocked — the controls will be visible and the user can tap play.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        this._clearPlayingTimeout();
        this.state.set('playing');
        video.play().catch(() => { /* autoplay blocked — controls visible, user taps */ });
      }, { once: true });
      video.addEventListener('error', () => {
        this._clearPlayingTimeout();
        this.state.set('offline');
      }, { once: true });
      this._playingTimeout = setTimeout(() => {
        if (this.state() !== 'playing') this.state.set('offline');
      }, 12000);
      video.load();
      return;
    }

    // All other browsers — use hls.js
    try {
      const Hls = (await import('hls.js')).default;

      if (!Hls.isSupported()) {
        // Last-ditch: a few mobile browsers support HLS natively even without Safari
        video.src = this.hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          this.state.set('playing');
          video.play().catch(() => { /* autoplay blocked */ });
        }, { once: true });
        video.addEventListener('error', () => this.state.set('error'), { once: true });
        this._playingTimeout = setTimeout(() => {
          if (this.state() !== 'playing') this.state.set('error');
        }, 12000);
        video.load();
        return;
      }

      this.hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      this.hls.loadSource(this.hlsUrl);
      this.hls.attachMedia(video);

      // Show the video immediately when the manifest is available —
      // don't wait for 'playing' which requires autoplay to succeed.
      // If autoplay is blocked the controls are visible and the user taps play.
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this._clearPlayingTimeout();
        this.state.set('playing');
        video.play().catch(() => { /* autoplay blocked — user will tap play */ });
      });

      // Start a timeout only to detect when the manifest itself never arrives
      // (e.g. camera offline, DNS error, token expired).
      this._playingTimeout = setTimeout(() => {
        if (this.state() === 'loading') {
          this.state.set('offline');
          this.destroyPlayer();
        }
      }, 12000);

      this.hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean; type: string }) => {
        if (data.fatal) {
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
