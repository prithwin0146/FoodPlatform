import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { AdminRestaurantService, CreateRestaurantPayload } from '../../../core/services/admin-restaurant.service';
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
}

/**
 * Responsible only for displaying and managing restaurants (CRUD).
 * (SRP: split from AdminPanel god component; OCP: new fields can be added to form without changing card grid)
 */
@Component({
  selector: 'app-admin-restaurants-tab',
  standalone: true,
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
              (click)="toggle(r.id)">
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
      button .material-symbols-rounded { font-size: 18px; vertical-align: middle; margin-right: 4px; }
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
  `]
})
export class AdminRestaurantsTab implements OnInit {
  readonly restaurants = signal<Restaurant[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly deleteTarget = signal<Restaurant | null>(null);

  form: RestaurantForm = this.emptyForm();

  readonly formValid = computed(() =>
    this.form.name.trim().length > 0 &&
    this.form.address.trim().length > 0 &&
    this.form.basePostcode.trim().length > 0 &&
    this.form.deliveryRadiusMiles > 0 &&
    this.form.hygieneRating >= 1 && this.form.hygieneRating <= 5
  );

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
    this.editingId.set(r.id);
    this.form = { name: r.name, address: r.address, basePostcode: r.basePostcode, deliveryRadiusMiles: r.deliveryRadiusMiles, hygieneRating: r.hygieneRating, imageUrl: r.imageUrl ?? '' };
    this.formOpen.set(true);
  }

  closeForm(): void { this.formOpen.set(false); this.editingId.set(null); }

  save(): void {
    if (!this.formValid()) return;
    this.saving.set(true);
    const payload: CreateRestaurantPayload = { ...this.form };
    const id = this.editingId();
    const req = id
      ? this.adminRestaurantService.update(id, payload)
      : this.adminRestaurantService.create(payload);

    req.subscribe({
      next: () => {
        this.toast.success(id ? 'Restaurant updated' : 'Restaurant created');
        this.closeForm();
        this.saving.set(false);
        this.ngOnInit();
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Failed to save');
        this.saving.set(false);
      },
    });
  }

  toggle(id: number): void {
    this.adminRestaurantService.toggleActive(id).subscribe({
      next: () => { this.toast.success('Restaurant updated'); this.ngOnInit(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  confirmDelete(r: Restaurant): void { this.deleteTarget.set(r); }

  deleteConfirmed(): void {
    const r = this.deleteTarget();
    if (!r) return;
    this.saving.set(true);
    this.adminRestaurantService.delete(r.id).subscribe({
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
    return { name: '', address: '', basePostcode: '', deliveryRadiusMiles: 3, hygieneRating: 5, imageUrl: '' };
  }
}

