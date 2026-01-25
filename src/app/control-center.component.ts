import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ControlsComponent } from './controls.component';
import { DrawerDirectionType, SnapPoint } from './types';

@Component({
  selector: 'app-control-center',
  standalone: true,
  imports: [ControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-center-wrapper">
      <div class="control-card">
        <button class="trigger-button" (click)="toggle.emit()">
          {{ isOpen() ? 'Close' : 'Open' }} Drawer
        </button>
        
        <app-controls 
          [direction]="direction()" 
          [snapPoints]="snapPoints()"
          (directionChange)="directionChange.emit($event)" 
          (snapPointsChange)="snapPointsChange.emit($event)"
        />
      </div>
    </div>
  `,
  styles: [`
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
      background: rgba(255, 255, 255, 0.82);
      padding: 24px;
      border-radius: 20px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .trigger-button {
      padding: 14px 28px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
      width: 100%;
    }

    .trigger-button:hover {
      background: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    }

    .trigger-button:active {
      transform: translateY(0);
    }
  `]
})
export class ControlCenterComponent {
  readonly isOpen = input.required<boolean>();
  readonly direction = input.required<DrawerDirectionType>();
  readonly snapPoints = input.required<SnapPoint[]>();
  
  readonly toggle = output<void>();
  readonly directionChange = output<DrawerDirectionType>();
  readonly snapPointsChange = output<SnapPoint[]>();
}
