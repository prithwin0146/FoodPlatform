import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CurrencyPipe } from '@angular/common';
import { AdminMenuService, AdminCreateItemPayload, AdminUpdateItemPayload } from '../../../core/services/admin-menu.service';
import { AdminRestaurantService } from '../../../core/services/admin-restaurant.service';
import { ToastService } from '../../../core/services/toast.service';
import { Restaurant, MenuCategory, MenuItem } from '../../../core/models';

interface ItemForm {
  categoryId: number | null;
  name: string;
  description: string;
  price: number | null;
  allergens: string;
  dietaryTags: string;
  imageUrl: string;
  isAvailable: boolean;
}

/**
 * Admin menu CRUD tab — manages categories and items for any restaurant.
 * (SRP: menu management isolated from restaurant and order tabs)
 */
@Component({
  selector: 'app-admin-menu-tab',
  standalone: true,
  imports: [
    FormsModule, CurrencyPipe,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressBarModule, MatDividerModule, MatSlideToggleModule,
  ],
  template: `
    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

    <!-- ── Restaurant Picker ── -->
    <div class="tab-toolbar">
      <mat-form-field appearance="outline" class="restaurant-picker">
        <mat-label>Select Restaurant</mat-label>
        <mat-select [ngModel]="selectedRestaurant()" (ngModelChange)="selectRestaurant($event)">
          @for (r of restaurants(); track r.id) {
            <mat-option [value]="r">{{ r.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      @if (selectedRestaurant()) {
        <button mat-stroked-button (click)="openAddCategory()">
          <span class="material-symbols-rounded">create_new_folder</span> Add Category
        </button>
      }
    </div>

    <!-- ── Add Category form ── -->
    @if (catFormOpen()) {
      <div class="form-panel">
        <h3 class="form-title">New Category</h3>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Category Name</mat-label>
            <input matInput [(ngModel)]="newCatName" placeholder="e.g. Starters" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Sort Order</mat-label>
            <input matInput type="number" [(ngModel)]="newCatSort" />
          </mat-form-field>
        </div>
        <div class="form-actions">
          <button mat-flat-button color="primary" (click)="saveCategory()" [disabled]="!newCatName.trim()">Save</button>
          <button mat-stroked-button (click)="catFormOpen.set(false)">Cancel</button>
        </div>
      </div>
    }

    <!-- ── Categories + Items ── -->
    @if (selectedRestaurant() && !loading()) {
      @if (categories().length === 0) {
        <p class="empty-hint">No menu yet. Add a category to get started.</p>
      }
      @for (cat of categories(); track cat.id) {
        <div class="cat-block">
          <div class="cat-header">
            <h3 class="cat-name">{{ cat.name }}</h3>
            <div class="cat-actions">
              <button mat-stroked-button color="warn" (click)="deleteCategory(cat.id)"
                matTooltip="Delete category (and all its items)">
                <span class="material-symbols-rounded">delete</span>
              </button>
              <button mat-flat-button color="primary" (click)="openAddItem(cat.id)">
                <span class="material-symbols-rounded">add</span> Add Item
              </button>
            </div>
          </div>

          <!-- Item form (add or edit) -->
          @if (itemFormCatId() === cat.id) {
            <div class="form-panel form-panel--item">
              <h4 class="form-title">{{ editingItemId() ? 'Edit' : 'New' }} Item in "{{ cat.name }}"</h4>
              <div class="form-grid form-grid--items">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput [(ngModel)]="itemForm.name" placeholder="e.g. Chicken Tikka" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Price (£)</mat-label>
                  <input matInput type="number" step="0.01" [(ngModel)]="itemForm.price" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Description</mat-label>
                  <textarea matInput rows="2" [(ngModel)]="itemForm.description"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Image URL</mat-label>
                  <input matInput [(ngModel)]="itemForm.imageUrl" placeholder="https://…" />
                  <mat-hint>Paste an image link (Cloudinary, Imgur, etc.)</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Allergens (comma-separated)</mat-label>
                  <input matInput [(ngModel)]="itemForm.allergens" placeholder="gluten, milk" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Dietary Tags (comma-separated)</mat-label>
                  <input matInput [(ngModel)]="itemForm.dietaryTags" placeholder="vegan, gluten-free" />
                </mat-form-field>
                @if (editingItemId()) {
                  <div class="toggle-row">
                    <mat-slide-toggle [(ngModel)]="itemForm.isAvailable">Available</mat-slide-toggle>
                  </div>
                }
              </div>
              <div class="form-actions">
                <button mat-flat-button color="primary" (click)="saveItem()" [disabled]="savingItem() || !itemForm.name.trim() || !itemForm.price">
                  {{ savingItem() ? 'Saving…' : (editingItemId() ? 'Update Item' : 'Add Item') }}
                </button>
                <button mat-stroked-button (click)="closeItemForm()">Cancel</button>
              </div>
            </div>
          }

          <!-- Items list -->
          @if (cat.items.length === 0) {
            <p class="empty-hint empty-hint--sm">No items yet.</p>
          }
          @for (item of cat.items; track item.id) {
            <div class="item-row">
              @if (item.imageUrl) {
                <img class="item-thumb" [src]="item.imageUrl" [alt]="item.name" />
              } @else {
                <div class="item-thumb item-thumb--empty">🍽️</div>
              }
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">{{ item.price | currency:'GBP' }}</span>
                @if (!item.isAvailable) { <span class="unavailable-badge">Unavailable</span> }
              </div>
              <div class="item-actions">
                <button mat-icon-button (click)="openEditItem(item, cat.id)" matTooltip="Edit">
                  <span class="material-symbols-rounded">edit</span>
                </button>
                <button mat-icon-button color="warn" (click)="deleteItem(item.id)" matTooltip="Delete">
                  <span class="material-symbols-rounded">delete</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    .tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .restaurant-picker { min-width: 260px; }
    .form-panel {
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;
    }
    .form-panel--item { margin-left: 0; border-color: rgba(255,107,53,.25); }
    .form-title { font-size: .95rem; font-weight: 700; color: #ffb59d; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid--items { grid-template-columns: 1fr 1fr; }
    .span-2 { grid-column: span 2; }
    .form-actions { display: flex; gap: 10px; margin-top: 12px; }
    .toggle-row { grid-column: span 2; display: flex; align-items: center; padding: 4px 0; }
    .cat-block {
      border: 1px solid rgba(255,255,255,.08); border-radius: 12px;
      padding: 16px 20px; margin-bottom: 20px;
      background: rgba(255,255,255,.02);
    }
    .cat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .cat-name { margin: 0; font-size: 1rem; font-weight: 700; color: #f7ddd5; }
    .cat-actions { display: flex; gap: 8px; }
    .item-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .item-row:last-child { border-bottom: none; }
    .item-thumb {
      width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
    }
    .item-thumb--empty {
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,107,53,.08); font-size: 1.4rem;
    }
    .item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .item-name { font-size: .9rem; font-weight: 600; color: #f7ddd5; }
    .item-price { font-size: .8rem; color: #ff6b35; }
    .item-actions { display: flex; gap: 4px; }
    .unavailable-badge {
      display: inline-block; font-size: .7rem; padding: 2px 8px; border-radius: 100px;
      background: rgba(255,80,80,.15); color: #ff8080; border: 1px solid rgba(255,80,80,.3);
    }
    .empty-hint { color: rgba(255,255,255,.4); font-size: .9rem; padding: 16px 0; }
    .empty-hint--sm { padding: 8px 0; font-size: .82rem; }
  `],
})
export class AdminMenuTab implements OnInit {
  readonly loading = signal(false);
  readonly savingItem = signal(false);

  readonly restaurants = signal<Restaurant[]>([]);
  readonly categories = signal<MenuCategory[]>([]);
  readonly selectedRestaurant = signal<Restaurant | null>(null);

  // Category form
  readonly catFormOpen = signal(false);
  newCatName = '';
  newCatSort = 0;

  // Item form
  readonly itemFormCatId = signal<number | null>(null);
  readonly editingItemId = signal<number | null>(null);
  itemForm: ItemForm = this.blankItemForm();

  constructor(
    private readonly menuSvc: AdminMenuService,
    private readonly restaurantSvc: AdminRestaurantService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.restaurantSvc.allRestaurants().subscribe({
      next: rs => { this.restaurants.set(rs); this.loading.set(false); },
      error: () => { this.toast.show('Failed to load restaurants', 'error'); this.loading.set(false); },
    });
  }

  selectRestaurant(r: Restaurant): void {
    this.selectedRestaurant.set(r);
    this.loadMenu(r.hashId);
  }

  private loadMenu(hash: string): void {
    this.loading.set(true);
    this.menuSvc.getMenu(hash).subscribe({
      next: cats => { this.categories.set(cats); this.loading.set(false); },
      error: () => { this.toast.show('Failed to load menu', 'error'); this.loading.set(false); },
    });
  }

  // ── Category ──────────────────────────────────────────────────────────────
  openAddCategory(): void {
    this.newCatName = ''; this.newCatSort = 0;
    this.catFormOpen.set(true);
  }

  saveCategory(): void {
    const rid = this.selectedRestaurant()?.id;
    if (!rid) return;
    this.menuSvc.createCategory({ restaurantId: rid, name: this.newCatName.trim(), sortOrder: this.newCatSort }).subscribe({
      next: cat => {
        this.categories.update(cs => [...cs, { ...cat, items: [] }]);
        this.catFormOpen.set(false);
        this.toast.show(`Category "${cat.name}" added`, 'success');
      },
      error: () => this.toast.show('Failed to add category', 'error'),
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Delete this category and all its items?')) return;
    this.menuSvc.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update(cs => cs.filter(c => c.id !== id));
        this.toast.show('Category deleted', 'success');
      },
      error: () => this.toast.show('Failed to delete category', 'error'),
    });
  }

  // ── Item ──────────────────────────────────────────────────────────────────
  openAddItem(catId: number): void {
    this.editingItemId.set(null);
    this.itemForm = this.blankItemForm(catId);
    this.itemFormCatId.set(catId);
  }

  openEditItem(item: MenuItem, catId: number): void {
    this.editingItemId.set(item.id);
    this.itemForm = {
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      allergens: item.allergens ?? '',
      dietaryTags: item.dietaryTags ?? '',
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
    };
    this.itemFormCatId.set(catId);
  }

  closeItemForm(): void {
    this.itemFormCatId.set(null);
    this.editingItemId.set(null);
  }

  saveItem(): void {
    const rid = this.selectedRestaurant()?.id;
    if (!rid || !this.itemForm.price) return;
    this.savingItem.set(true);

    const editId = this.editingItemId();
    if (editId) {
      const payload: AdminUpdateItemPayload = {
        categoryId: this.itemForm.categoryId ?? undefined,
        name: this.itemForm.name.trim(),
        description: this.itemForm.description || null,
        price: this.itemForm.price,
        allergens: this.itemForm.allergens || null,
        dietaryTags: this.itemForm.dietaryTags || null,
        imageUrl: this.itemForm.imageUrl || null,
        isAvailable: this.itemForm.isAvailable,
      };
      this.menuSvc.updateItem(editId, payload).subscribe({
        next: updated => {
          this.categories.update(cs => cs.map(c => ({
            ...c, items: c.items.map(i => i.id === editId ? updated : i),
          })));
          this.toast.show('Item updated', 'success');
          this.closeItemForm();
          this.savingItem.set(false);
        },
        error: () => { this.toast.show('Failed to update item', 'error'); this.savingItem.set(false); },
      });
    } else {
      const catId = this.itemForm.categoryId ?? this.itemFormCatId()!;
      const payload: AdminCreateItemPayload = {
        restaurantId: rid, categoryId: catId,
        name: this.itemForm.name.trim(),
        description: this.itemForm.description || null,
        price: this.itemForm.price,
        allergens: this.itemForm.allergens || null,
        dietaryTags: this.itemForm.dietaryTags || null,
        imageUrl: this.itemForm.imageUrl || null,
      };
      this.menuSvc.createItem(payload).subscribe({
        next: created => {
          this.categories.update(cs => cs.map(c =>
            c.id === catId ? { ...c, items: [...c.items, created] } : c
          ));
          this.toast.show(`"${created.name}" added`, 'success');
          this.closeItemForm();
          this.savingItem.set(false);
        },
        error: () => { this.toast.show('Failed to add item', 'error'); this.savingItem.set(false); },
      });
    }
  }

  deleteItem(id: number): void {
    if (!confirm('Delete this item?')) return;
    this.menuSvc.deleteItem(id).subscribe({
      next: () => {
        this.categories.update(cs => cs.map(c => ({ ...c, items: c.items.filter(i => i.id !== id) })));
        this.toast.show('Item deleted', 'success');
      },
      error: () => this.toast.show('Failed to delete item', 'error'),
    });
  }

  private blankItemForm(catId: number | null = null): ItemForm {
    return { categoryId: catId, name: '', description: '', price: null, allergens: '', dietaryTags: '', imageUrl: '', isAvailable: true };
  }
}
