import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

export interface UserAddress {
  label: string;
  line1: string;
  city: string;
  postcode: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

/**
 * Customer profile page — "Your SeethePrep".
 * SRP: Owns user identity display, saved address/payment drawers, notification toggles, account navigation, and sign-out confirmation.
 * DIP: Delegates auth state to AuthService and navigation to Angular Router.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  imports: [
    FormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    ScrollRevealDirective,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  // ── Profile Identity Data ──
  readonly name = computed(() => {
    const username = this.auth.username();
    if (!username || username === 'demo_user') return 'Harsha';
    return username.charAt(0).toUpperCase() + username.slice(1);
  });

  readonly email = computed(() => {
    const username = this.auth.username();
    if (!username || username === 'demo_user') return 'harsha@example.com';
    return `${username.toLowerCase()}@example.com`;
  });

  readonly phone = signal('+44 7700 900077');

  readonly userInitial = computed(() => {
    const n = this.name();
    return n ? n.charAt(0).toUpperCase() : 'H';
  });

  // ── Saved Addresses ──
  readonly addresses = signal<UserAddress[]>([
    {
      label: 'Home',
      line1: '12 Example Street',
      city: 'London',
      postcode: 'EC1A 1BB',
      isDefault: true,
    },
    {
      label: 'Work',
      line1: '45 Innovation Way',
      city: 'London',
      postcode: 'EC2V 6AA',
      isDefault: false,
    },
  ]);

  // ── Saved Payment Methods ──
  readonly paymentMethods = signal<PaymentMethod[]>([
    {
      brand: 'Visa',
      last4: '4821',
      expiry: '08/28',
      isDefault: true,
    },
    {
      brand: 'Mastercard',
      last4: '1192',
      expiry: '11/27',
      isDefault: false,
    },
  ]);

  // ── Notification Settings ──
  readonly orderUpdates = signal(true);
  readonly kitchenUpdates = signal(true);
  readonly offersRecommendations = signal(false);

  // ── Dialog & Drawer States ──
  readonly activeModal = signal<'editProfile' | 'addresses' | 'payments' | 'signOut' | null>(null);

  // Edit profile form state
  readonly editName = signal('');
  readonly editEmail = signal('');
  readonly editPhone = signal('');

  openEditProfile(): void {
    this.editName.set(this.name());
    this.editEmail.set(this.email());
    this.editPhone.set(this.phone());
    this.activeModal.set('editProfile');
  }

  saveProfile(): void {
    if (this.editPhone()) {
      this.phone.set(this.editPhone());
    }
    this.closeModal();
    this.toast.success('Profile updated successfully');
  }

  openAddresses(): void {
    this.activeModal.set('addresses');
  }

  openPayments(): void {
    this.activeModal.set('payments');
  }

  confirmSignOut(): void {
    this.activeModal.set('signOut');
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  toggleNotification(setting: 'order' | 'kitchen' | 'offers'): void {
    if (setting === 'order') {
      this.orderUpdates.update((v) => !v);
      this.toast.info(`Order updates ${this.orderUpdates() ? 'enabled' : 'disabled'}`);
    } else if (setting === 'kitchen') {
      this.kitchenUpdates.update((v) => !v);
      this.toast.info(`Kitchen updates ${this.kitchenUpdates() ? 'enabled' : 'disabled'}`);
    } else if (setting === 'offers') {
      this.offersRecommendations.update((v) => !v);
      this.toast.info(`Offers & recommendations ${this.offersRecommendations() ? 'enabled' : 'disabled'}`);
    }
  }

  navToSupport(): void {
    this.toast.info('Opening Help & Support...');
  }

  navToPrivacy(): void {
    this.toast.info('Opening Privacy & Security...');
  }

  navToTerms(): void {
    this.toast.info('Opening Terms & Conditions...');
  }

  executeSignOut(): void {
    this.closeModal();
    this.auth.clearSession();
    this.toast.success('Signed out');
    this.router.navigate(['/login']);
  }
}

