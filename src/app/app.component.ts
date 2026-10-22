import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent, ToastsComponent } from './shared/components/overlays.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastsComponent, ConfirmDialogComponent],
  template: `
    <router-outlet />
    <app-toasts />
    <app-confirm-dialog />
  `
})
export class AppComponent {}
