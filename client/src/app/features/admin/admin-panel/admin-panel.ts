import { Component, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { AdminOrdersTab } from './admin-orders-tab';
import { AdminDisputesTab } from './admin-disputes-tab';
import { AdminRestaurantsTab } from './admin-restaurants-tab';
import { AdminMenuTab } from './admin-menu-tab';

/**
 * Shell component — owns only the tab switcher state.
 * (SRP: data loading and actions delegated to AdminOrdersTab, AdminDisputesTab, AdminRestaurantsTab)
 */
@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [AdminOrdersTab, AdminDisputesTab, AdminRestaurantsTab, AdminMenuTab, MatTabsModule, MatButtonModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel {
  readonly tab = signal<'orders' | 'disputes' | 'restaurants' | 'menu'>('orders');

  setTab(t: 'orders' | 'disputes' | 'restaurants' | 'menu'): void {
    this.tab.set(t);
  }
}
