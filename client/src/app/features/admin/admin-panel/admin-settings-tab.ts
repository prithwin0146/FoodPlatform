import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformSettingsService } from '../../../core/services/platform-settings.service';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';

/**
 * Admin panel tab for managing platform-wide settings.
 * Currently exposes the homepage demo video URL (shown in the "Watch it cook" step).
 * (SRP: settings management UI only)
 * (DIP: depends on PlatformSettingsService, not HttpClient)
 */
@Component({
  selector: 'app-admin-settings-tab',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTooltipModule, SafeUrlPipe],
  template: `
    <div class="settings-tab">
      <div class="settings-section">
        <h2 class="settings-title">
          <span class="material-symbols-rounded">settings</span>
          Platform Settings
        </h2>
        <p class="settings-desc">Configure platform-wide content managed from the admin panel.</p>
      </div>

      @if (loading()) {
        <div class="settings-loading">
          <span class="material-symbols-rounded spin">progress_activity</span>
          Loading settings…
        </div>
      } @else {
        <!-- Homepage Demo Video -->
        <div class="setting-card">
          <div class="setting-header">
            <span class="setting-icon material-symbols-rounded">videocam</span>
            <div>
              <h3 class="setting-name">Homepage Demo Video</h3>
              <p class="setting-hint">
                Shown in the "Watch it cook" step on the public homepage.
                Paste a YouTube embed URL, Vimeo URL, or a direct MP4/WebM link.
              </p>
            </div>
          </div>

          <mat-form-field appearance="outline" class="setting-field">
            <mat-label>Video URL</mat-label>
            <input matInput
              [ngModel]="demoVideoUrl()"
              (ngModelChange)="demoVideoUrl.set($event)"
              placeholder="https://youtube.com/embed/… or https://cdn.example.com/kitchen.mp4">
            <mat-hint>YouTube embed URL, Vimeo, or a direct .mp4 / .webm link.</mat-hint>
          </mat-form-field>

          @if (demoVideoUrl().trim()) {
            <div class="video-preview">
              @if (isEmbed(demoVideoUrl())) {
                <iframe
                  [src]="demoVideoUrl() | safeUrl"
                  class="preview-frame"
                  frameborder="0"
                  allow="autoplay; fullscreen"
                  allowfullscreen>
                </iframe>
              } @else {
                <video class="preview-video" controls muted [src]="demoVideoUrl()">
                  Your browser does not support the video element.
                </video>
              }
            </div>
          }

          @if (saveSuccess()) {
            <div class="save-success">
              <span class="material-symbols-rounded">check_circle</span>
              Saved — homepage updated.
            </div>
          }

          <div class="setting-actions">
            <button mat-flat-button class="save-btn"
              [disabled]="saving()"
              (click)="saveDemoVideo()">
              <span class="material-symbols-rounded">save</span>
              {{ saving() ? 'Saving…' : 'Save' }}
            </button>
            @if (demoVideoUrl().trim()) {
              <button mat-stroked-button class="clear-btn"
                [disabled]="saving()"
                (click)="demoVideoUrl.set(''); saveDemoVideo()"
                matTooltip="Remove the video from the homepage">
                <span class="material-symbols-rounded">delete</span>
                Remove
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-tab { max-width: 720px; }
    .settings-section { margin-bottom: 24px; }
    .settings-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.1rem; font-weight: 700; color: #0f0f13; margin: 0 0 6px;
      .material-symbols-rounded { font-size: 20px; color: #9ca3af; }
    }
    .settings-desc { font-size: .88rem; color: #6b7280; margin: 0; }
    .settings-loading {
      display: flex; align-items: center; gap: 8px;
      color: #9ca3af; font-size: .9rem;
      .material-symbols-rounded { font-size: 18px; }
    }
    .setting-card {
      background: #fff; border: 1px solid #e5e7eb;
      border-radius: 14px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .setting-header {
      display: flex; align-items: flex-start; gap: 14px;
    }
    .setting-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(255,107,26,.08); color: #c2410c;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .setting-name { font-size: 1rem; font-weight: 700; color: #0f0f13; margin: 0 0 4px; }
    .setting-hint { font-size: .82rem; color: #6b7280; margin: 0; line-height: 1.5; }
    .setting-field { width: 100%; }
    .video-preview {
      border-radius: 10px; overflow: hidden;
      background: #000; aspect-ratio: 16/9;
    }
    .preview-frame, .preview-video { width: 100%; height: 100%; border: none; display: block; }
    .setting-actions { display: flex; align-items: center; gap: 10px; }
    .save-btn {
      background: #ff6b1a !important; color: #fff !important;
      border-radius: 8px !important;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .clear-btn { border-radius: 8px !important; display: inline-flex; align-items: center; gap: 6px; }
    .save-success {
      display: flex; align-items: center; gap: 8px;
      background: #ecfdf5; border: 1px solid #a7f3d0;
      color: #065f46; padding: 10px 14px; border-radius: 8px;
      font-size: .85rem; font-weight: 600;
      .material-symbols-rounded { font-size: 18px; }
    }
    .spin { animation: spin .9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AdminSettingsTab implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly demoVideoUrl = signal('');

  constructor(private readonly settings: PlatformSettingsService) {}

  ngOnInit(): void {
    this.settings.getAdminSettings().subscribe({
      next: (s) => {
        this.demoVideoUrl.set(s['homepage_demo_video'] ?? '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveDemoVideo(): void {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.settings.upsertSetting('homepage_demo_video', this.demoVideoUrl()).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => this.saving.set(false),
    });
  }

  isEmbed(url: string): boolean {
    return url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');
  }
}
