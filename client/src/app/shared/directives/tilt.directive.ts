import { Directive, Input } from '@angular/core';

/**
 * [appTilt] — disabled. 3D tilt was removed for a professional, premium UI.
 * Kept as a no-op so existing templates compile without churn.
 * (OCP: re-enable here without touching any template.)
 */
@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective {
  @Input() tiltMax = 12;
}
