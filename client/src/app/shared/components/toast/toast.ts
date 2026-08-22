import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  constructor(readonly toastService: ToastService) {}
}
