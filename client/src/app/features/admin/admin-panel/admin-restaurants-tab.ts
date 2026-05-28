import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { AdminRestaurantService, CreateRestaurantPayload, CreateRestaurantResponse } from '../../../core/services/admin-restaurant.service';
import { ToastService } from '../../../core/services/toast.service';
import { Restaurant } from '../../../core/models';
import { HygieneStarsPipe } from '../../../shared/pipes/hygiene-stars.pipe';

interface RestaurantForm {
  name: string;
  address: string;
  basePostcode: string;
  deliveryRadiusMiles: number;
  hygieneRating: number;
  imageUrl: string;
  kitchenVideoUrl: string;
  cuisineType: string;
  estimatedDeliveryMinutes: number;
  staffName: string;
  staffEmail: string;
  staffPassword: string;
}

/**
 * Responsible only for displaying and managing restaurants (CRUD).
 * (SRP: split from AdminPanel god component; OCP: new fields can be added to form without changing card grid)
 */
@Component({
  selector: 'app-admin-restaurants-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatChipsModule,
    MatTooltipModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatDividerModule,
    HygieneStarsPipe,
  ],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <!-- ── Toolbar ── -->
    <div class="tab-toolbar">
      <span class="tab-count">{{ restaurants().length }} restaurant{{ restaurants().length !== 1 ? 's' : '' }}</span>
      <button mat-flat-button color="primary" (click)="openAdd()">
        <span class="material-symbols-rounded">add</span> Add Restaurant
      </button>
    </div>

    <!-- ── Add / Edit Form Panel ── -->
    @if (formOpen()) {
      <div class="form-panel">
        <h3 class="form-title">{{ editingId() ? 'Edit Restaurant' : 'New Restaurant' }}</h3>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput [(ngModel)]="form.name" placeholder="e.g. Spice Garden" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Address</mat-label>
            <input matInput [(ngModel)]="form.address" placeholder="42 High Street, London" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Base Postcode</mat-label>
            <input matInput [(ngModel)]="form.basePostcode" placeholder="SW1A 1AA" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Delivery Radius (miles)</mat-label>
            <input matInput type="number" min="0.5" max="20" step="0.5" [(ngModel)]="form.deliveryRadiusMiles" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hygiene Rating (1–5)</mat-label>
            <input matInput type="number" min="1" max="5" [(ngModel)]="form.hygieneRating" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="grid-column: span 2">
            <mat-label>Image URL (optional)</mat-label>
            <input matInput [(ngModel)]="form.imageUrl" placeholder="https://…" />
            <mat-hint>Paste an external image link (Cloudinary, Imgur, etc.)</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline" style="grid-column: span 2">
            <mat-label>Kitchen Video URL (optional)</mat-label>
            <input matInput [(ngModel)]="form.kitchenVideoUrl" placeholder="https://youtube.com/embed/… or direct MP4 link" />
            <mat-hint>YouTube embed, Vimeo, or direct video file link shown on order-tracking page.</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cuisine Type</mat-label>
            <input matInput [(ngModel)]="form.cuisineType" placeholder="e.g. Indian, Italian, Burgers" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Est. Delivery Time (minutes)</mat-label>
            <input matInput type="number" min="5" max="180" [(ngModel)]="form.estimatedDeliveryMinutes" />
          </mat-form-field>
          @if (!editingId()) {
            <div style="grid-column: span 2; margin: 4px 0 0; padding: 14px 16px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px;">
              <div style="font-size:.8rem;font-weight:700;color:#0369a1;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-rounded" style="font-size:1rem">manage_accounts</span>
                Staff Account Credentials
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                <mat-form-field appearance="outline">
                  <mat-label>Staff Display Name</mat-label>
                  <input matInput [(ngModel)]="form.staffName" placeholder="e.g. Spice Garden Staff" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Staff Email</mat-label>
                  <input matInput type="email" [(ngModel)]="form.staffEmail" placeholder="staff@restaurant.com" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Staff Password</mat-label>
                  <input matInput type="password" [(ngModel)]="form.staffPassword" placeholder="Min. 8 characters" />
                  <mat-hint>Staff uses this to log in at seetheprep.com/login</mat-hint>
                </mat-form-field>
              </div>
            </div>
          }
        </div>
        <div class="form-actions">
          <button mat-stroked-button (click)="closeForm()">Cancel</button>
          <button mat-flat-button color="primary" [disabled]="!formValid() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : (editingId() ? 'Save Changes' : 'Create Restaurant') }}
          </button>
        </div>
      </div>
      <mat-divider style="margin: 24px 0" />
    }

    <!-- ── Restaurants Grid ── -->
    <div class="restaurants-grid">
      @for (r of restaurants(); track r.id) {
        <mat-card class="r-card" [class.inactive]="!r.isActive">
          <mat-card-header>
            <div class="r-avatar" mat-card-avatar>
              <span class="material-symbols-rounded">storefront</span>
            </div>
            <mat-card-title>{{ r.name }}</mat-card-title>
            <mat-card-subtitle>{{ r.address }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="r-meta">
              <div class="r-meta-item">
                <span class="material-symbols-rounded">star</span>
                <span>Hygiene: {{ r.hygieneRating | hygieneStars }}</span>
              </div>
              <div class="r-meta-item">
                <span class="material-symbols-rounded">location_on</span>
                <span>{{ r.basePostcode }}</span>
              </div>
              <div class="r-meta-item">
                <span class="material-symbols-rounded">local_shipping</span>
                <span>{{ r.deliveryRadiusMiles }} mi radius</span>
              </div>
              <div class="r-meta-item">
                <span class="material-symbols-rounded">restaurant</span>
                <span>{{ r.cuisineType || 'Other' }}</span>
              </div>
              <div class="r-meta-item">
                <span class="material-symbols-rounded">schedule</span>
                <span>~{{ r.estimatedDeliveryMinutes }} min</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <mat-chip [class]="r.isActive ? 'chip-active' : 'chip-inactive'" disableRipple>
              {{ r.isActive ? 'Active' : 'Inactive' }}
            </mat-chip>
            <button mat-icon-button matTooltip="Edit" (click)="openEdit(r)">
              <span class="material-symbols-rounded">edit</span>
            </button>
            <button mat-stroked-button
              [color]="r.isActive ? 'warn' : 'primary'"
              [matTooltip]="r.isActive ? 'Deactivate' : 'Activate'"
              (click)="toggle(r.hashId)">
              {{ r.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button mat-icon-button color="warn" matTooltip="Delete restaurant"
              (click)="confirmDelete(r)">
              <span class="material-symbols-rounded">delete</span>
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>

    <!-- ── Credentials Modal ── -->
    @if (createdCredentials()) {
      <div class="confirm-backdrop">
        <div class="confirm-dialog credentials-dialog">
          <span class="material-symbols-rounded credentials-icon">check_circle</span>
          <h3>Restaurant Created!</h3>
          <p>Share these login credentials with the restaurant staff. <strong>You won't see the password again.</strong></p>
          <div class="cred-row">
            <span class="cred-label">Staff Name</span>
            <span class="cred-value">{{ createdCredentials()!.staffName }}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Email</span>
            <span class="cred-value">{{ createdCredentials()!.staffEmail }}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Password</span>
            <span class="cred-value cred-value--password">{{ createdCredentials()!.staffPassword }}</span>
          </div>
          <p class="cred-url"><span class="material-symbols-rounded">login</span> Login at <strong>seetheprep.com/login</strong></p>
          <div class="confirm-actions">
            <button mat-flat-button color="primary" (click)="createdCredentials.set(null)">Done</button>
          </div>
        </div>
      </div>
    }
    <!-- ── Delete Confirm Dialog ── -->
    @if (deleteTarget()) {
      <div class="confirm-backdrop" (click)="deleteTarget.set(null)">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <span class="material-symbols-rounded confirm-icon">warning</span>
          <h3>Delete "{{ deleteTarget()!.name }}"?</h3>
          <p>This will permanently remove the restaurant and cannot be undone.</p>
          <div class="confirm-actions">
            <button mat-stroked-button (click)="deleteTarget.set(null)">Cancel</button>
            <button mat-flat-button color="warn" [disabled]="saving()" (click)="deleteConfirmed()">
              {{ saving() ? 'Deleting…' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tab-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
      .tab-count { font-size: .9rem; color: #6b7280; }
    }

    /* ── Form Panel ── */
    .form-panel {
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 14px; padding: 24px; margin-bottom: 4px;
    }
    .form-title { font-size: 1rem; font-weight: 700; margin: 0 0 20px; }
    .form-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
      mat-form-field { width: 100%; }
    }
    .form-actions {
      display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;
    }

    /* ── Grid ── */
    .restaurants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .r-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s;
      &.inactive { opacity: 0.65; }
      &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.10); }
      mat-card-title { font-size: 1rem; font-weight: 700; }
    }

    .r-avatar {
      width: 40px; height: 40px; background: #f3f4f6; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      .material-symbols-rounded { font-size: 20px; color: #6b7280; }
    }
    .r-meta { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .r-meta-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.875rem; color: #6b7280;
      .material-symbols-rounded { font-size: 16px; color: #9ca3af; }
    }

    mat-chip.chip-active   { background: #d1fae5 !important; color: #065f46 !important; font-size: .75rem !important; font-weight: 600 !important; height: 24px !important; }
    mat-chip.chip-inactive { background: #fee2e2 !important; color: #991b1b !important; font-size: .75rem !important; font-weight: 600 !important; height: 24px !important; }

    /* ── Delete Confirm ── */
    .confirm-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      backdrop-filter: blur(4px); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .confirm-dialog {
      background: #fff; border-radius: 16px; padding: 32px 28px;
      max-width: 400px; width: 100%; text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,.18);
    }
    .confirm-icon { font-size: 2.5rem; color: #f59e0b; display: block; margin-bottom: 12px; }
    .confirm-dialog h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; }
    .confirm-dialog p  { color: #6b7280; font-size: .9rem; margin: 0 0 24px; }
    .confirm-actions   { display: flex; gap: 10px; justify-content: center; }
    .credentials-dialog { max-width: 460px; text-align: left; }
    .credentials-icon { font-size: 2.5rem; color: #10b981; display: block; text-align: center; margin-bottom: 12px; }
    .credentials-dialog h3 { text-align: center; }
    .credentials-dialog > p { text-align: center; }
    .cred-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 8px; margin-bottom: 8px;
    }
    .cred-label { font-size: .78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
    .cred-value { font-size: .9rem; font-weight: 600; color: #111827; }
    .cred-value--password { font-family: monospace; font-size: .88rem; color: #ff6b1a; }
    .cred-url {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: .82rem; color: #6b7280; margin: 16px 0 20px;
      .material-symbols-rounded { font-size: 1rem; }
    }
  `]
})
export class AdminRestaurantsTab implements OnInit {
  readonly restaurants = signal<Restaurant[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly deleteTarget = signal<Restaurant | null>(null);
  readonly createdCredentials = signal<{ staffName: string; staffEmail: string; staffPassword: string } | null>(null);

  form: RestaurantForm = this.emptyForm();

  readonly formValid = computed(() => {
    const base = this.form.name.trim().length > 0 &&
      this.form.address.trim().length > 0 &&
      this.form.basePostcode.trim().length > 0 &&
      this.form.deliveryRadiusMiles > 0 &&
      this.form.hygieneRating >= 1 && this.form.hygieneRating <= 5;
    if (this.editingId()) return base;
    return base &&
      this.form.staffName.trim().length > 0 &&
      this.form.staffEmail.trim().length > 0 &&
      this.form.staffPassword.length >= 8;
  });

  constructor(
    private readonly adminRestaurantService: AdminRestaurantService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.adminRestaurantService.allRestaurants().subscribe({
      next: (r) => { this.restaurants.set(r); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load restaurants'); this.loading.set(false); },
    });
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.formOpen.set(true);
  }

  openEdit(r: Restaurant): void {
    this.editingId.set(r.hashId);
    this.form = { name: r.name, address: r.address, basePostcode: r.basePostcode, deliveryRadiusMiles: r.deliveryRadiusMiles, hygieneRating: r.hygieneRating, imageUrl: r.imageUrl ?? '', kitchenVideoUrl: r.kitchenVideoUrl ?? '', cuisineType: r.cuisineType ?? '', estimatedDeliveryMinutes: r.estimatedDeliveryMinutes ?? 30, staffName: '', staffEmail: '', staffPassword: '' };
    this.formOpen.set(true);
  }

  closeForm(): void { this.formOpen.set(false); this.editingId.set(null); }

  save(): void {
    if (!this.formValid()) return;
    this.saving.set(true);
    const id = this.editingId();

    if (id) {
      const payload = { name: this.form.name, address: this.form.address, basePostcode: this.form.basePostcode, deliveryRadiusMiles: this.form.deliveryRadiusMiles, hygieneRating: this.form.hygieneRating, imageUrl: this.form.imageUrl || null, kitchenVideoUrl: this.form.kitchenVideoUrl || null, cuisineType: this.form.cuisineType, estimatedDeliveryMinutes: this.form.estimatedDeliveryMinutes };
      this.adminRestaurantService.update(id, payload).subscribe({
        next: () => { this.toast.success('Restaurant updated'); this.closeForm(); this.saving.set(false); this.ngOnInit(); },
        error: (err: { error?: { message?: string; error?: string } }) => { this.toast.error(err.error?.message ?? err.error?.error ?? 'Failed to save'); this.saving.set(false); },
      });
    } else {
      const payload: CreateRestaurantPayload = { ...this.form };
      this.adminRestaurantService.create(payload).subscribe({
        next: (res) => {
          this.closeForm();
          this.saving.set(false);
          this.ngOnInit();
          this.createdCredentials.set({ staffName: res.staffName, staffEmail: res.staffEmail, staffPassword: this.form.staffPassword });
        },
        error: (err: { error?: { message?: string; error?: string } }) => { this.toast.error(err.error?.error ?? err.error?.message ?? 'Failed to save'); this.saving.set(false); },
      });
    }
  }

  toggle(hash: string): void {
    this.adminRestaurantService.toggleActive(hash).subscribe({
      next: () => { this.toast.success('Restaurant updated'); this.ngOnInit(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  confirmDelete(r: Restaurant): void { this.deleteTarget.set(r); }

  deleteConfirmed(): void {
    const r = this.deleteTarget();
    if (!r) return;
    this.saving.set(true);
    this.adminRestaurantService.delete(r.hashId).subscribe({
      next: () => {
        this.toast.success(`"${r.name}" deleted`);
        this.deleteTarget.set(null);
        this.saving.set(false);
        this.ngOnInit();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Failed to delete');
        this.saving.set(false);
      },
    });
  }

  private emptyForm(): RestaurantForm {
    return { name: '', address: '', basePostcode: '', deliveryRadiusMiles: 3, hygieneRating: 5, imageUrl: '', kitchenVideoUrl: '', cuisineType: 'Other', estimatedDeliveryMinutes: 30, staffName: '', staffEmail: '', staffPassword: '' };
  }
}

