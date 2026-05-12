import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { User } from '../../../core/models';

/**
 * Responsible only for displaying the users table in the admin panel.
 * (SRP: user listing only; pagination mirrored from AdminOrdersTab pattern)
 */
@Component({
  selector: 'app-admin-users-tab',
  standalone: true,
  imports: [DatePipe, MatTableModule, MatChipsModule, MatCardModule,
            MatProgressBarModule, MatButtonModule, MatTooltipModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    <mat-card class="users-card">
      <mat-card-header>
        <mat-card-title>
          <span class="material-symbols-rounded">group</span>
          All Users
        </mat-card-title>
        <mat-card-subtitle>{{ totalCount() }} registered accounts</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (users().length === 0 && !loading()) {
          <div class="empty-state">
            <span class="material-symbols-rounded empty-icon">person_off</span>
            <p>No users found</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="users()" class="users-table">

              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let u"><strong>{{ u.id }}</strong></td>
              </ng-container>

              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let u">{{ u.username }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let u">{{ u.email }}</td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let u">
                  <mat-chip [class]="'chip-role chip-role--' + u.role.toLowerCase()" disableRipple>
                    {{ u.role }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="verified">
                <th mat-header-cell *matHeaderCellDef>Verified</th>
                <td mat-cell *matCellDef="let u">
                  @if (u.isEmailVerified) {
                    <span class="verified-badge verified-badge--yes"
                          matTooltip="Email verified">
                      <span class="material-symbols-rounded">verified</span>
                    </span>
                  } @else {
                    <span class="verified-badge verified-badge--no"
                          matTooltip="Not verified">
                      <span class="material-symbols-rounded">cancel</span>
                    </span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef>Joined</th>
                <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'d MMM y' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>

          <div class="pagination-row">
            <button mat-stroked-button [disabled]="page() === 1" (click)="goTo(page() - 1)">
              <span class="material-symbols-rounded">chevron_left</span> Prev
            </button>
            <span class="page-info">Page {{ page() }} of {{ totalPages() }}</span>
            <button mat-stroked-button [disabled]="page() >= totalPages()" (click)="goTo(page() + 1)">
              Next <span class="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .users-card { background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; }
    mat-card-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); }
    mat-card-subtitle { color: var(--text-secondary); }
    .table-wrap { overflow-x: auto; }
    .users-table { width: 100%; background: transparent; }
    .chip-role { font-size: .75rem; padding: 4px 10px; }
    .chip-role--admin    { background: rgba(239,68,68,.15);  color: #ef4444; }
    .chip-role--staff    { background: rgba(168,85,247,.15); color: #a855f7; }
    .chip-role--customer { background: rgba(59,130,246,.15); color: #3b82f6; }
    .verified-badge { display: inline-flex; }
    .verified-badge--yes .material-symbols-rounded { color: #22c55e; font-size: 20px; }
    .verified-badge--no  .material-symbols-rounded { color: #6b7280; font-size: 20px; }
    .empty-state { text-align: center; padding: 48px; color: var(--text-secondary); }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; color: var(--brand-primary); }
    .pagination-row { display: flex; align-items: center; gap: 16px; padding: 16px 0 4px; justify-content: center; }
    .page-info { color: var(--text-secondary); font-size: .85rem; }
  `],
})
export class AdminUsersTab implements OnInit {
  readonly columns = ['id', 'username', 'email', 'role', 'verified', 'joined'];
  readonly users      = signal<User[]>([]);
  readonly loading    = signal(true);
  readonly totalCount = signal(0);
  readonly page       = signal(1);
  readonly pageSize   = 50;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  constructor(private readonly userService: AdminUserService) {}

  ngOnInit(): void { this.load(); }

  goTo(p: number): void { this.page.set(p); this.load(); }

  private load(): void {
    this.loading.set(true);
    this.userService.allUsers(this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
