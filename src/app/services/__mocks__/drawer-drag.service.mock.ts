import { BehaviorSubject, Observable } from 'rxjs';
import { DrawerDirectionType } from '../../types';

export const createDrawerDragMock = () => ({
  pointerStart$: new BehaviorSubject<{ x: number; y: number } | null>(null),
  dragStartPosition$: new BehaviorSubject<{ x: number; y: number } | null>(null),
  currentPointerPositionObs$: new Observable(),
  wasBeyondThePoint$: new BehaviorSubject<boolean | null>(null),
  dragEndTime$: new BehaviorSubject<Date | null>(null),
  dragStartTime$: new BehaviorSubject<Date | null>(null),
  isAllowedToDrag$: new BehaviorSubject<boolean>(false),

  calculateDragDelta: (): number => 0,

  onPress: (event: PointerEvent, element?: HTMLDivElement): void => {
    // implementation
  },

  onDrag: (event: DragEvent | PointerEvent, element?: HTMLDivElement, dismissible?: boolean): void => {
    // implementation
  },

  onRelease: (event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void => {
    // implementation
  },

  shouldDrag: (el: EventTarget, isDraggingInDirection: boolean): boolean => false,

  resetDrawer: (direction: DrawerDirectionType, element?: HTMLDivElement): void => {
    // implementation
  },

  closeDrawer: (drawer: HTMLDivElement): void => {
    // implementation
  },

  ngOnDestroy: (): void => {
    // implementation
  },
});
