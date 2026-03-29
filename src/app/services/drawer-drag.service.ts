import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { DrawerDirectionType } from '../types';
import {
  BORDER_RADIUS,
  CLOSE_THRESHOLD,
  DRAG_CLASS,
  SCROLL_LOCK_TIMEOUT,
  TRANSITIONS,
  VELOCITY_THRESHOLD,
} from './constants';
import { isVertical, set } from '../utils/helpers';
import { DrawerDomService } from './drawer-dom.service';
import { DrawerSnapService } from './drawer-snap.service';
import { DrawerStateService } from './drawer-state.service';

@Injectable({ providedIn: 'root' })
export class DrawerDragService {
  private readonly state = inject(DrawerStateService);
  private readonly snap = inject(DrawerSnapService);
  private readonly dom = inject(DrawerDomService);

  readonly pointerStart = signal<{ x: number; y: number } | null>(null);
  readonly dragStartPosition = signal<{ x: number; y: number } | null>(null);
  readonly currentPointerPosition = signal<{ x: number; y: number } | null>(null);
  readonly wasBeyondThePoint = signal<boolean | null>(null);
  readonly dragEndTime = signal<Date | null>(null);
  readonly dragStartTime = signal<Date | null>(null);
  readonly isAllowedToDrag = signal<boolean>(false);

  private lastTimeDragPrevented: Date | null = null;

  constructor() {
    // While dragging, disable CSS transitions for a snappy follow-the-finger feel.
    // Tracks isDragging; reads currentPointerPosition only while dragging to mirror
    // the original switchMap(isDragging => isDragging ? combineLatest([of(drawer), position$]) : EMPTY) pattern.
    effect(() => {
      const isDragging = this.state.isDragging();
      if (!isDragging) return;

      const drawer = untracked(() => this.state.drawerRef());
      const currentPosition = this.currentPointerPosition();

      if (!drawer || !currentPosition) return;

      const dragDelta = this.calculateDragDelta();
      if (dragDelta <= 0) return;
      drawer.style.transition = 'none';
    });
  }

  calculateDragDelta(): number {
    const start = this.dragStartPosition();
    const current = this.currentPointerPosition();
    if (!start || !current) return 0;
    return isVertical(this.state.direction()) ? current.y - start.y : current.x - start.x;
  }

  onPress(event: PointerEvent, element?: HTMLDivElement): void {
    if (!element) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStartPosition.set({ x: event.clientX, y: event.clientY });
    this.currentPointerPosition.set({ x: event.clientX, y: event.clientY });
  }

  onRelease(event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void {
    if (!element || !event) return;

    this.pointerStart.set(null);
    this.wasBeyondThePoint.set(false);

    if (!this.state.isDragging()) return;
    this.state.setIsDragging(false);
    this.dragEndTime.set(new Date());

    const timeTaken = (this.dragEndTime()?.getTime() ?? 0) - (this.dragStartTime()?.getTime() ?? 0);
    const dragDelta = this.calculateDragDelta();
    const snapPoints = this.snap.snapPoints();
    const snapPointsOffset = this.snap.getSnapPointsOffset();
    const activeSnapPoint = this.snap.activeSnapPoint();
    const activeSnapPointIndex = snapPoints && activeSnapPoint ? snapPoints.indexOf(activeSnapPoint) : 0;
    const activeSnapPointOffset = activeSnapPointIndex !== -1 ? snapPointsOffset[activeSnapPointIndex] : 0;

    const currentPosition = activeSnapPointOffset + dragDelta;
    const isFirst = activeSnapPointIndex === 0;
    const isVerticalDir = isVertical(direction);
    const drawerDimension = isVerticalDir ? element.offsetHeight : element.offsetWidth;
    const hasDraggedToClose = direction === 'bottom' || direction === 'right' ? dragDelta > 0 : dragDelta < 0;

    const startX = this.dragStartPosition()?.x ?? 0;
    const startY = this.dragStartPosition()?.y ?? 0;
    const distMoved = isVerticalDir ? Math.abs(event.clientY - startY) : Math.abs(event.clientX - startX);
    const velocity = timeTaken > 0 ? distMoved / timeTaken : 0;

    if (velocity > VELOCITY_THRESHOLD) {
      if (!hasDraggedToClose && activeSnapPointIndex < (snapPoints?.length ?? 1) - 1) {
        this.snap.snapToPoint(snapPoints![activeSnapPointIndex + 1]);
        return;
      }
      if (hasDraggedToClose) {
        if (isFirst) {
          this.closeDrawer(element);
        } else {
          this.snap.snapToPoint(snapPoints![activeSnapPointIndex - 1]);
        }
        return;
      }
    }

    if (snapPoints && snapPoints.length > 0) {
      const closedOffset = isVerticalDir
        ? direction === 'bottom'
          ? drawerDimension
          : -drawerDimension
        : direction === 'right'
          ? drawerDimension
          : -drawerDimension;

      const closestSnapPointOffset = snapPointsOffset.reduce((prev, curr) =>
        Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev,
      );
      const closestIndex = snapPointsOffset.indexOf(closestSnapPointOffset);

      if (Math.abs(closedOffset - currentPosition) < Math.abs(closestSnapPointOffset - currentPosition)) {
        this.closeDrawer(element);
        return;
      }

      this.snap.snapToPoint(snapPoints[closestIndex]);
      return;
    }

    if (Math.abs(dragDelta) >= drawerDimension * CLOSE_THRESHOLD) {
      this.closeDrawer(element);
    } else {
      this.resetDrawer(direction, element);
    }
  }

  onDrag(event: DragEvent | PointerEvent, element?: HTMLDivElement, _dismissible = true): void {
    const direction = this.state.direction();
    if (!element) return;

    if (event instanceof PointerEvent && event.buttons === 0 && this.state.isDragging()) {
      this.onRelease(event, direction, element);
      return;
    }

    if (!this.state.isDragging()) return;

    const snapPoints = this.snap.snapPoints();
    const snapPointsOffset = this.snap.getSnapPointsOffset();
    const activeSnapPoint = this.snap.activeSnapPoint();
    const activeSnapPointIndex = snapPoints && activeSnapPoint ? snapPoints.indexOf(activeSnapPoint) : null;
    const activeSnapPointOffset = activeSnapPointIndex !== null ? snapPointsOffset[activeSnapPointIndex] : 0;

    const directionMultiplier = direction === 'bottom' || direction === 'right' ? 1 : -1;
    const pointerStartY = this.pointerStart()?.y ?? 0;
    const pointerStartX = this.pointerStart()?.x ?? 0;
    const draggedDistance =
      (isVertical(direction) ? pointerStartY - event.clientY : pointerStartX - event.clientX) * directionMultiplier;
    const isDraggingInDirection = draggedDistance > 0;

    if (!event.target) return;
    if (!this.isAllowedToDrag() && !this.shouldDrag(event.target, isDraggingInDirection)) return;

    const wrapper = this.dom.getWrapperElement();
    const drawerDimension = isVertical(direction)
      ? element.getBoundingClientRect().height || 0
      : element.getBoundingClientRect().width || 0;

    element.classList.add(DRAG_CLASS);
    this.isAllowedToDrag.set(true);
    this.currentPointerPosition.set({ x: event.clientX, y: event.clientY });

    const dragDelta = this.calculateDragDelta();
    let newValue = activeSnapPointOffset + dragDelta;

    if (snapPoints && snapPointsOffset.length > 0) {
      const lastPointOffset = snapPointsOffset[snapPointsOffset.length - 1];
      if ((direction === 'bottom' || direction === 'right') && newValue < lastPointOffset) {
        newValue = lastPointOffset;
      }
      if ((direction === 'top' || direction === 'left') && newValue > lastPointOffset) {
        newValue = lastPointOffset;
      }
    }

    set(element, {
      transition: 'none',
      transform: isVertical(direction) ? `translate3d(0, ${newValue}px, 0)` : `translate3d(${newValue}px, 0, 0)`,
    });

    if (wrapper && this.state.overlayRef()) {
      const percentageDragged = Math.min(Math.abs(dragDelta) / drawerDimension, 1);
      const scale = this.dom.getScale();
      const scaleValue = Math.min(scale + percentageDragged * (1 - scale), 1);
      const borderRadiusValue = 8 - percentageDragged * 8;
      const translateValue = Math.max(0, 14 - percentageDragged * 14);

      set(
        wrapper,
        {
          borderRadius: `${borderRadiusValue}px`,
          transform: isVertical(direction)
            ? `scale(${scaleValue}) translate3d(0, ${translateValue}px, 0)`
            : `scale(${scaleValue}) translate3d(${translateValue}px, 0, 0)`,
          transition: 'none',
        },
        true,
      );
    }
  }

  shouldDrag(el: EventTarget, isDraggingInDirection: boolean): boolean {
    const direction = this.state.direction();
    let element = el as HTMLElement;
    const drawer = this.state.drawerRef();
    const highlightedText = window.getSelection()?.toString();
    const swipeAmount = drawer ? this.dom.getTranslate(drawer, direction) : null;
    const date = new Date();

    if (element.tagName === 'SELECT') return false;
    if (element.hasAttribute('data-vaul-no-drag') || element.closest('[data-vaul-no-drag]')) return false;

    const openTime = this.state.openTime();
    if (openTime && date.getTime() - openTime.getTime() < 500) {
      return false;
    }

    if (swipeAmount !== null) {
      const isClosingSwipe = direction === 'bottom' || direction === 'right' ? swipeAmount > 0 : swipeAmount < 0;
      if (isClosingSwipe) return true;
    }

    if (highlightedText && highlightedText.length > 0) return false;

    if (
      this.lastTimeDragPrevented &&
      date.getTime() - this.lastTimeDragPrevented.getTime() < SCROLL_LOCK_TIMEOUT &&
      swipeAmount === 0
    ) {
      this.lastTimeDragPrevented = date;
      return false;
    }

    if (isDraggingInDirection) {
      this.lastTimeDragPrevented = date;
      return false;
    }

    while (element) {
      if (element.scrollHeight > element.clientHeight) {
        if (element.scrollTop !== 0) {
          this.lastTimeDragPrevented = new Date();
          return false;
        }
        if (element.getAttribute('role') === 'dialog') return true;
      }
      element = element.parentNode as HTMLElement;
    }

    return true;
  }

  resetDrawer(direction: DrawerDirectionType, element?: HTMLDivElement): void {
    if (!element) return;
    const currentPoint = this.snap.activeSnapPoint();

    this.state.setIsDragging(false);
    this.dragStartPosition.set(null);

    if (currentPoint) {
      this.snap.snapToPoint(currentPoint);
    } else {
      set(element, {
        transform: 'translate3d(0, 0, 0)',
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }

    set(this.state.overlayRef(), {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      opacity: '1',
    });

    const wrapper = this.dom.getWrapperElement();
    const currentSwipeAmount = this.dom.getTranslate(element, this.state.direction());

    if (
      this.state.shouldScaleBackground() &&
      currentSwipeAmount &&
      Math.abs(currentSwipeAmount) > 0 &&
      this.state.isOpen()
    ) {
      set(
        wrapper,
        {
          borderRadius: `${BORDER_RADIUS}px`,
          overflow: 'hidden',
          ...(isVertical(direction)
            ? {
                transform: `scale(${this.dom.getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
                transformOrigin: 'top',
              }
            : {
                transform: `scale(${this.dom.getScale()}) translate3d(${direction === 'right' ? '-14px' : '14px'}, 0, 0)`,
                transformOrigin: direction === 'right' ? 'right' : 'left',
              }),
          transitionProperty: 'transform, border-radius',
          transitionDuration: `${TRANSITIONS.DURATION}s`,
          transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        },
        true,
      );
    }
  }

  closeDrawer(drawer: HTMLDivElement): void {
    if (!drawer) return;
    this.state.setIsOpen(false);
    this.cancelDrag(drawer);
  }

  cancelDrag(element: HTMLDivElement): void {
    if (!this.state.isDragging() || !element) return;
    element.classList.remove(DRAG_CLASS);
    this.state.setIsDragging(false);
    this.dragEndTime.set(new Date());
  }

  ngOnDestroy(): void {
    // Signals and effects clean up automatically; method kept for backward compatibility
  }
}
