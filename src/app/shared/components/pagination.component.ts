import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)" aria-label="Previous page">
          <app-icon name="chevronLeft" [size]="16" />
        </button>
        <span class="muted">Page {{ page() }} of {{ totalPages() }} · {{ totalCount() }} tasks</span>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="pageChange.emit(page() + 1)" aria-label="Next page">
          <app-icon name="chevronRight" [size]="16" />
        </button>
      </nav>
    }
  `
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalCount = input(0);
  readonly pageChange = output<number>();
}
