import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrawerDirectionType, SnapPoint } from './types';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="controls">
      <div class="control-section">
        <span class="controls-label">Direction:</span>
        <div class="button-group">
          <button 
            [class.active]="direction() === 'bottom'" 
            (click)="directionChange.emit('bottom')"
          >Bottom</button>
          <button 
            [class.active]="activeDirection === 'left'" 
            (click)="setDirection('left')"
          >Left</button>
          <button 
            [class.active]="activeDirection === 'right'" 
            (click)="setDirection('right')"
          >Right</button>
        </div>
      </div>

      <div class="control-section">
        <span class="controls-label">Snap Points:</span>
        <div class="snap-points-list">
          @for (point of snapPoints(); track point) {
            <span class="snap-pill">
              {{ point }}
              <button class="remove-btn" (click)="removeSnapPoint(point)">×</button>
            </span>
          }
        </div>
        
        <div class="add-snap-point">
          <input 
            type="text" 
            [(ngModel)]="newPointValue" 
            placeholder="e.g. 0.5 or 300px"
            (keyup.enter)="addSnapPoint()"
            [class.invalid]="error()"
          >
          <button (click)="addSnapPoint()">Add</button>
        </div>
        @if (error()) {
          <span class="error-text">{{ error() }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .controls {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }

    .control-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .controls-label {
      font-size: 11px;
      font-weight: 700;
      color: #868e96;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .button-group {
      display: flex;
      gap: 4px;
      background: #f1f3f5;
      padding: 4px;
      border-radius: 10px;
    }

    .button-group button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #495057;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .button-group button:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .button-group button.active {
      background: #ffffff;
      color: #000000;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .snap-points-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .snap-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #e9ecef;
      padding: 4px 8px 4px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      color: #495057;
    }

    .remove-btn {
      border: none;
      background: transparent;
      color: #adb5bd;
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .remove-btn:hover {
      background: #dee2e6;
      color: #495057;
    }

    .add-snap-point {
      display: flex;
      gap: 8px;
    }

    .add-snap-point input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }

    .add-snap-point input:focus {
      border-color: #007bff;
    }

    .add-snap-point input.invalid {
      border-color: #fa5252;
      background: #fff5f5;
    }

    .add-snap-point button {
      padding: 8px 16px;
      background: #212529;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .add-snap-point button:hover {
      opacity: 0.9;
    }

    .error-text {
      color: #fa5252;
      font-size: 11px;
      font-weight: 500;
    }
  `]
})
export class ControlsComponent {
  readonly direction = input.required<DrawerDirectionType>();
  readonly snapPoints = input.required<SnapPoint[]>();
  
  readonly directionChange = output<DrawerDirectionType>();
  readonly snapPointsChange = output<SnapPoint[]>();

  newPointValue = '';
  error = signal<string | null>(null);

  get activeDirection() {
    return this.direction();
  }

  setDirection(dir: DrawerDirectionType) {
    this.directionChange.emit(dir);
  }

  addSnapPoint() {
    const value = this.newPointValue.trim();
    if (!value) return;

    let validated: SnapPoint;

    // Validate pixels (e.g. 300px)
    if (value.endsWith('px')) {
      const num = parseInt(value, 10);
      if (isNaN(num) || num <= 0) {
        this.error.set('Invalid pixel value');
        return;
      }
      validated = value;
    } else {
      // Validate percentage (e.g. 0.5)
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 1) {
        this.error.set('Percentage must be between 0 and 1');
        return;
      }
      validated = num;
    }

    const current = this.snapPoints();
    if (current.includes(validated)) {
      this.error.set('Snap point already exists');
      return;
    }

    const updated = [...current, validated].sort((a, b) => {
      const valA = typeof a === 'string' ? parseInt(a, 10) : a * 1000; // Sort roughly
      const valB = typeof b === 'string' ? parseInt(b, 10) : b * 1000;
      return valA - valB;
    });

    this.snapPointsChange.emit(updated);
    this.newPointValue = '';
    this.error.set(null);
  }

  removeSnapPoint(point: SnapPoint) {
    const updated = this.snapPoints().filter(p => p !== point);
    this.snapPointsChange.emit(updated);
  }
}
