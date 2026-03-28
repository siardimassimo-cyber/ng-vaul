import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DrawerComponent } from './drawer.component';
import { OverlayComponent } from './overlay.component';
import { ControlCenterComponent } from './control-center.component';
import { DrawerService } from './services/drawer.service';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from './types';
import { isVertical } from './utils/helpers';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-root',
  imports: [DrawerComponent, OverlayComponent, ControlCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-control-center
      [isOpen]="!!isOpen()"
      [direction]="drawerDirection()"
      [snapPoints]="snapPoints()"
      [dismissible]="dismissible()"
      (toggle)="toggleDrawer()"
      (directionChange)="setDirection($event)"
      (snapPointsChange)="snapPoints.set($event)"
      (dismissibleChange)="dismissible.set($event)"
    />

    <vaul-overlay [direction]="drawerDirection()" [dismissible]="dismissible()" />

    <vaul-drawer
      [class]="'origin-' + drawerDirection"
      [style.height]="isVertical(drawerDirection()) ? '100%' : '100%'"
      [style.width]="isVertical(drawerDirection()) ? '100vw' : '100%'"
      [open]="!!isOpen()"
      [initialDrawerHeightorWidth]="380"
      [snapPoints]="snapPoints()"
      (openChange)="setIsOpen($event)"
      [direction]="drawerDirection()"
      [dismissible]="dismissible()"
    >
      <div class="drawer-container">
        <div class="content">
          <h2>Drawer Example</h2>
          <p>This is a drawer with snap points at 50% and 80% of the screen height.</p>
          <div class="snap-stepper" data-vaul-no-drag>
            <button type="button" id="drawer-prev-snap" class="snap-step-btn" (click)="goToAdjacentSnap(-1)">
              Previous snap
            </button>
            <button type="button" id="drawer-next-snap" class="snap-step-btn" (click)="goToAdjacentSnap(1)">
              Next snap
            </button>
          </div>
          <button
            type="button"
            id="drawer-inner-close"
            class="drawer-close-btn"
            data-vaul-no-drag
            (click)="setIsOpen(false)"
            aria-label="Close drawer"
          >
            Close
          </button>
        </div>
      </div>
    </vaul-drawer>
  `,
  styles: [
    `
      .drawer-container {
        background: var(--color-white);
        border-radius: 8px 8px 0 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .content {
        padding: 16px;
        flex: 0.9;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      h2 {
        margin: 0 0 16px;
        font-size: 24px;
      }

      p {
        margin: 0;
        color: var(--color-gray-600);
      }

      .drawer-close-btn {
        align-self: flex-end;
        margin: 8px 12px 0;
        position: relative;
        z-index: 2;
        padding: 8px 14px;
        border: 1px solid var(--color-gray-300);
        border-radius: 8px;
        background: var(--color-white);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        color: var(--color-gray-800);
      }

      .drawer-close-btn:hover {
        background: var(--color-gray-50);
      }

      .drawer-close-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      .snap-stepper {
        display: flex;
        gap: 8px;
        padding: 0 12px 8px;
        position: relative;
        z-index: 2;
      }

      .snap-step-btn {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid var(--color-gray-300);
        border-radius: 8px;
        background: var(--color-gray-50);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        color: var(--color-gray-800);
      }

      .snap-step-btn:hover {
        background: var(--color-gray-200);
      }

      .snap-step-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly drawerService = inject(DrawerService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  public drawerDirectionValues = DrawerDirection;
  public drawerDirection = signal<DrawerDirectionType>(DrawerDirection.BOTTOM);
  public snapPoints = signal<SnapPoint[]>([0.4, 0.8, 1]);
  /** When true, overlay click and Escape close the drawer. */
  public dismissible = signal(true);
  public isOpen = toSignal(this.drawerService.isOpen$);
  public isVertical = isVertical;
  public readonly DrawerDirection = DrawerDirection;

  ngOnInit(): void {
    this.drawerService.setDirection(this.drawerDirection());
    const onKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.key !== 'Escape') {
        return;
      }
      if (!this.isOpen() || !this.dismissible()) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      this.drawerService.setIsOpen(false);
    };
    this.document.addEventListener('keydown', onKeyDown, true);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('keydown', onKeyDown, true);
    });
  }

  setDirection(direction: DrawerDirectionType) {
    this.drawerDirection.set(direction);
    this.drawerService.setDirection(direction);
  }

  setIsOpen(value: boolean) {
    this.drawerService.setIsOpen(value);
  }

  toggleDrawer() {
    this.setIsOpen(!this.isOpen());
  }

  goToAdjacentSnap(step: 1 | -1): void {
    this.drawerService.goToAdjacentSnap(step);
  }
}
