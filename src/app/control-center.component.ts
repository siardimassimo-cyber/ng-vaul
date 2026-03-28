import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ControlsComponent } from './controls.component';
import { DrawerDirectionType, SnapPoint } from './types';

@Component({
  selector: 'app-control-center',
  imports: [ControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-center-wrapper">
      <div class="control-card">
        <button type="button" id="drawer-open-close-trigger" class="trigger-button" (click)="toggle.emit()">
          {{ isOpen() ? 'Close' : 'Open' }} Drawer
        </button>

        <app-controls
          [direction]="direction()"
          [snapPoints]="snapPoints()"
          [dismissible]="dismissible()"
          (directionChange)="directionChange.emit($event)"
          (snapPointsChange)="snapPointsChange.emit($event)"
          (dismissibleChange)="dismissibleChange.emit($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .control-center-wrapper {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 1000;
      }

      .control-card {
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        background: var(--color-glass-bg);
        padding: 24px;
        border-radius: 20px;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px var(--color-black-alpha-12);
        border: 1px solid var(--color-glass-border);
      }

      .trigger-button {
        padding: 14px 28px;
        background: var(--color-primary);
        color: var(--color-white);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        width: 100%;
      }

      .trigger-button:hover {
        background: var(--color-primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--color-primary-shadow);
      }

      .trigger-button:active {
        transform: translateY(0);
      }
    `,
  ],
})
export class ControlCenterComponent {
  readonly isOpen = input.required<boolean>();
  readonly direction = input.required<DrawerDirectionType>();
  readonly snapPoints = input.required<SnapPoint[]>();
  readonly dismissible = input(true);

  readonly toggle = output<void>();
  readonly directionChange = output<DrawerDirectionType>();
  readonly snapPointsChange = output<SnapPoint[]>();
  readonly dismissibleChange = output<boolean>();
}
