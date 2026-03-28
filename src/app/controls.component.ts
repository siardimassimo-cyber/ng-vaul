import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrawerDirectionType, SnapPoint } from './types';
import { validateSnapPointGuard } from './utils/utils';

@Component({
  selector: 'app-controls',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="controls">
      <div class="control-section">
        <span class="controls-label">Direction:</span>
        <div class="button-group">
          <button
            type="button"
            id="direction-bottom-btn"
            [class.active]="direction() === 'bottom'"
            (click)="directionChange.emit('bottom')"
          >
            Bottom
          </button>
          <button
            type="button"
            id="direction-left-btn"
            [class.active]="direction() === 'left'"
            (click)="setDirection('left')"
          >
            Left
          </button>
          <button
            type="button"
            id="direction-right-btn"
            [class.active]="direction() === 'right'"
            (click)="setDirection('right')"
          >
            Right
          </button>
          <button type="button" id="direction-top-btn" [class.active]="direction() === 'top'" (click)="setDirection('top')">
            Top
          </button>
        </div>
      </div>

      <div class="control-section">
        <span class="controls-label" id="dismissible-label">Dismissible overlay</span>
        <div class="dismissible-segmented" role="group" aria-labelledby="dismissible-label">
          <button
            type="button"
            id="dismissible-off-btn"
            class="segment"
            [class.active]="!dismissible()"
            (click)="setDismissible(false)"
          >
            Off
          </button>
          <button
            type="button"
            id="dismissible-on-btn"
            class="segment"
            [class.active]="dismissible()"
            (click)="setDismissible(true)"
          >
            On
          </button>
        </div>
      </div>

      <div class="control-section">
        <span class="controls-label">Snap Points:</span>
        <div class="snap-points-list" role="list" aria-label="Snap points">
          @for (point of snapPoints(); track $index) {
            <span class="snap-pill" role="listitem">
              {{ point }}
              <button
                type="button"
                class="remove-btn"
                [attr.data-snap-value]="point"
                [attr.aria-label]="'Remove snap point ' + point"
                (click)="removeSnapPoint(point)"
              >
                ×
              </button>
            </span>
          }
        </div>

        <div class="add-snap-point">
          <input
            type="text"
            id="snap-point-input"
            [(ngModel)]="newPointValue"
            placeholder="e.g. 0.5 or 300px"
            (keyup.enter)="addSnapPoint()"
            [class.invalid]="error()"
            [attr.aria-describedby]="error() ? 'snap-input-error' : null"
          />
          <button type="button" id="snap-point-add-btn" (click)="addSnapPoint()">Add</button>
        </div>
        @if (error()) {
          <span class="error-text" id="snap-input-error" role="alert">{{ error() }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
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
        color: var(--color-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .button-group {
        display: flex;
        gap: 4px;
        background: var(--color-gray-100);
        padding: 4px;
        border-radius: 10px;
      }

      .button-group button {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--color-gray-700);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .button-group button:hover {
        background: var(--color-black-alpha-5);
      }

      .button-group button.active {
        background: var(--color-white);
        color: var(--color-black);
        box-shadow: 0 2px 6px var(--color-black-alpha-8);
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
        background: var(--color-gray-200);
        padding: 4px 8px 4px 10px;
        border-radius: 100px;
        font-size: 12px;
        font-weight: 600;
        color: var(--color-gray-700);
      }

      .remove-btn {
        border: none;
        background: transparent;
        color: var(--color-gray-400);
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        min-height: 36px;
        border-radius: 50%;
      }

      .remove-btn:hover {
        background: var(--color-gray-300);
        color: var(--color-gray-700);
      }

      .add-snap-point {
        display: flex;
        gap: 8px;
      }

      .add-snap-point input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--color-gray-300);
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
      }

      .add-snap-point input:focus {
        border-color: var(--color-primary);
      }

      .add-snap-point input.invalid {
        border-color: var(--color-error);
        background: var(--color-error-bg);
      }

      .add-snap-point button {
        padding: 8px 16px;
        background: var(--color-gray-800);
        color: var(--color-white);
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
        color: var(--color-error);
        font-size: 11px;
        font-weight: 500;
      }

      .dismissible-segmented {
        display: flex;
        gap: 0;
        background: var(--color-gray-100);
        padding: 4px;
        border-radius: 10px;
        width: 100%;
      }

      .dismissible-segmented .segment {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--color-gray-700);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .dismissible-segmented .segment.active {
        background: var(--color-white);
        color: var(--color-black);
        box-shadow: 0 2px 6px var(--color-black-alpha-8);
      }
    `,
  ],
})
export class ControlsComponent {
  readonly direction = input.required<DrawerDirectionType>();
  readonly snapPoints = input.required<SnapPoint[]>();
  readonly dismissible = input(true);

  readonly directionChange = output<DrawerDirectionType>();
  readonly snapPointsChange = output<SnapPoint[]>();
  readonly dismissibleChange = output<boolean>();

  newPointValue: string | undefined = undefined;
  error = signal<string | null>(null);

  setDirection(dir: DrawerDirectionType) {
    this.directionChange.emit(dir);
  }

  setDismissible(value: boolean): void {
    this.dismissibleChange.emit(value);
  }

  addSnapPoint() {
    const value = this.newPointValue?.trim();
    if (!value) {
      this.error.set('Enter a valid snap point');
      return;
    }

    let validated: SnapPoint | undefined;

    // Validate pixels (e.g. 300px)
    if (validateSnapPointGuard(value)) {
      validated = value as SnapPoint;
    } else {
      // Validate percentage (e.g. 0.5)
      const num = parseFloat(value);
      if (isNaN(num)) {
        this.error.set('Invalid number: enter a number between 0 and 1');
        return;
      }
      if (num < 0 || num > 1) {
        this.error.set('Invalid number: value must be between 0 and 1');
        return;
      }
      validated = num;
    }

    const current = this.snapPoints();
    if (validated && current.includes(validated)) {
      this.error.set('Duplicate: snap point already exists');
      return;
    }

    if (!validated) return;
    const updated = [...current, validated].sort((a, b) => {
      const valA = typeof a === 'string' ? parseInt(a, 10) : a * 1000; // Sort roughly
      const valB = typeof b === 'string' ? parseInt(b, 10) : b * 1000;
      return valA - valB;
    });

    this.snapPointsChange.emit(updated);
    this.newPointValue = undefined;
    this.error.set(null);
  }

  removeSnapPoint(point: SnapPoint) {
    const updated = this.snapPoints().filter((p) => p !== point);
    this.snapPointsChange.emit(updated);
  }
}
