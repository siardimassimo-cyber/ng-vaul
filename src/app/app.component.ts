import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DrawerComponent } from './drawer.component';
import { OverlayComponent } from './overlay.component';
import { ControlCenterComponent } from './control-center.component';
import { DrawerService } from './services/drawer.service';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from './types';
import { isVertical } from './services/helpers';
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
      (toggle)="toggleDrawer()"
      (directionChange)="setDirection($event)"
      (snapPointsChange)="snapPoints.set($event)"
    />

    <vaul-overlay [direction]="drawerDirection()" />

    <vaul-drawer
      [class]="'origin-' + drawerDirection"
      [style.height]="isVertical(drawerDirection()) ? '100%' : '100%'"
      [style.width]="isVertical(drawerDirection()) ? '100vw' : '100%'"
      [open]="!!isOpen()"
      [initialDrawerHeightorWidth]="380"
      [snapPoints]="snapPoints()"
      (openChange)="setIsOpen($event)"
      [direction]="drawerDirection()"
    >
      <div class="drawer-content">
        <div class="content">
          <h2>Drawer Example</h2>
          <p>This is a drawer with snap points at 50% and 80% of the screen height.</p>
        </div>
      </div>
    </vaul-drawer>
  `,
    styles: [
        `
      .drawer-wrapper {
        position: relative;
        z-index: var(--vaul-drawer-z-index);
      }

      .drawer-content {
        background: white;
        border-radius: 8px 8px 0 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .content {
        padding: 16px;
        flex: 1;
        overflow-y: auto;
      }

      h2 {
        margin: 0 0 16px;
        font-size: 24px;
      }

      p {
        margin: 0;
        color: #666;
      }
    `,
    ]
})
export class AppComponent implements OnInit {
  private readonly drawerService = inject(DrawerService);
  public drawerDirectionValues = DrawerDirection;
  public drawerDirection = signal<DrawerDirectionType>(DrawerDirection.BOTTOM);
  public snapPoints = signal<SnapPoint[]>([0.4, 0.8, 1]);
  public isOpen = toSignal(this.drawerService.isOpen$);
  public isVertical = isVertical;

  ngOnInit(): void {
    this.drawerService.setDirection(this.drawerDirection());
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
}
