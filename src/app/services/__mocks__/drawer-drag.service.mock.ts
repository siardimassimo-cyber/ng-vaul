import { signal } from '@angular/core';
import { DrawerDirectionType } from '../../types';

export const createDrawerDragMock = () => ({
  pointerStart: signal<{ x: number; y: number } | null>(null),
  dragStartPosition: signal<{ x: number; y: number } | null>(null),
  currentPointerPosition: signal<{ x: number; y: number } | null>(null),
  wasBeyondThePoint: signal<boolean | null>(null),
  dragEndTime: signal<Date | null>(null),
  dragStartTime: signal<Date | null>(null),
  isAllowedToDrag: signal<boolean>(false),

  calculateDragDelta: (): number => 0,

  onPress: (event: PointerEvent, element?: HTMLDivElement): void => {},

  onDrag: (event: DragEvent | PointerEvent, element?: HTMLDivElement, dismissible?: boolean): void => {},

  onRelease: (event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void => {},

  shouldDrag: (el: EventTarget, isDraggingInDirection: boolean): boolean => false,

  resetDrawer: (direction: DrawerDirectionType, element?: HTMLDivElement): void => {},

  closeDrawer: (drawer: HTMLDivElement): void => {},

  ngOnDestroy: (): void => {},
});
