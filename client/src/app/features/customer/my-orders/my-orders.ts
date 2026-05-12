import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models';
import { OrderStatusEmojiPipe, OrderStatusLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

/**
 * Displays all orders placed by the current customer.
 * (SRP: data loading via OrderService; status display via pipes)
 * (OCP: new statuses automatically appear via OrderStatusEmojiPipe)
 */
@Component({
  selector: 'app-my-orders',
  imports: [
    CurrencyPipe, DatePipe, RouterLink,
    OrderStatusEmojiPipe, OrderStatusLabelPipe,
    MatButtonModule, MatRippleModule, MatTooltipModule,
    ScrollRevealDirective, TiltDirective,
  ],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);

  constructor(
    private readonly orderService: OrderService,
    title: Title
  ) {
    title.setTitle('My Orders | SeeThePrep');
  }

  ngOnInit(): void {
    this.orderService.listMyOrders().subscribe({
      next: (data) => { this.orders.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  /** True while an order is still in the active pipeline. */
  isActive(order: Order): boolean {
    return !['Delivered', 'Rejected', 'Cancelled'].includes(order.status);
  }
}
