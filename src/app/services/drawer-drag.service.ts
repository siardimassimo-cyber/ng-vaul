import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
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
  private readonly destroy$ = new Subject<void>();

  readonly pointerStart$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  readonly dragStartPosition$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  private readonly currentPointerPosition$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  readonly currentPointerPositionObs$: Observable<{ x: number; y: number } | null> =
    this.currentPointerPosition$.asObservable();
  readonly wasBeyondThePoint$ = new BehaviorSubject<boolean | null>(null);
  readonly dragEndTime$ = new BehaviorSubject<Date | null>(null);
  readonly dragStartTime$ = new BehaviorSubject<Date | null>(null);
  readonly isAllowedToDrag$ = new BehaviorSubject<boolean>(false);

  private lastTimeDragPrevented: Date | null = null;

  constructor() {
    // While dragging, disable CSS transitions for a snappy follow-the-finger feel
    this.state.isDragging$
      .asObservable()
      .pipe(
        switchMap((isDragging) => {
          const drawer = this.state.drawerRef$.value;
          if (!drawer || !isDragging) return EMPTY;
          return combineLatest([of(drawer), this.currentPointerPositionObs$]).pipe(
            // map used for its side-effect (disable transition when dragging forward)
            // eslint-disable-next-line rxjs/no-ignored-observable
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([drawer, currentPosition]) => {
        if (!currentPosition) return;
        const dragDelta = this.calculateDragDelta();
        if (dragDelta <= 0) return;
        drawer.style.transition = 'none';
      });
  }

  calculateDragDelta(): number {
    const start = this.dragStartPosition$.value;
    const current = this.currentPointerPosition$.value;
    if (!start || !current) return 0;
    return isVertical(this.state.direction$.value) ? current.y - start.y : current.x - start.x;
  }

  onPress(event: PointerEvent, element?: HTMLDivElement): void {
    if (!element) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStartPosition$.next({ x: event.clientX, y: event.clientY });
    this.currentPointerPosition$.next({ x: event.clientX, y: event.clientY });
  }

  onRelease(event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void {
    if (!element || !event) return;

    this.pointerStart$.next(null);
    this.wasBeyondThePoint$.next(false);

    if (!this.state.isDragging$.value) return;
    this.state.setIsDragging(false);
    this.dragEndTime$.next(new Date());

    const timeTaken = (this.dragEndTime$.value?.getTime() ?? 0) - (this.dragStartTime$.value?.getTime() ?? 0);
    const dragDelta = this.calculateDragDelta();
    const snapPoints = this.snap.snapPoints$.value;
    const snapPointsOffset = this.snap.getSnapPointsOffset();
    const activeSnapPoint = this.snap.activeSnapPoint$.value;
    const activeSnapPointIndex = snapPoints && activeSnapPoint ? snapPoints.indexOf(activeSnapPoint) : 0;
    const activeSnapPointOffset = activeSnapPointIndex !== -1 ? snapPointsOffset[activeSnapPointIndex] : 0;

    const currentPosition = activeSnapPointOffset + dragDelta;
    const isFirst = activeSnapPointIndex === 0;
    const isVerticalDir = isVertical(direction);
    const drawerDimension = isVerticalDir ? element.offsetHeight : element.offsetWidth;
    const hasDraggedToClose = direction === 'bottom' || direction === 'right' ? dragDelta > 0 : dragDelta < 0;

    const startX = this.dragStartPosition$.value?.x ?? 0;
    const startY = this.dragStartPosition$.value?.y ?? 0;
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
    const direction = this.state.direction$.value;
    if (!element) return;

    if (event instanceof PointerEvent && event.buttons === 0 && this.state.isDragging$.value) {
      this.onRelease(event, direction, element);
      return;
    }

    if (!this.state.isDragging$.value) return;

    const snapPoints = this.snap.snapPoints$.value;
    const snapPointsOffset = this.snap.getSnapPointsOffset();
    const activeSnapPoint = this.snap.activeSnapPoint$.value;
    const activeSnapPointIndex = snapPoints && activeSnapPoint ? snapPoints.indexOf(activeSnapPoint) : null;
    const activeSnapPointOffset = activeSnapPointIndex !== null ? snapPointsOffset[activeSnapPointIndex] : 0;

    const directionMultiplier = direction === 'bottom' || direction === 'right' ? 1 : -1;
    const pointerStartY = this.pointerStart$.value?.y ?? 0;
    const pointerStartX = this.pointerStart$.value?.x ?? 0;
    const draggedDistance =
      (isVertical(direction) ? pointerStartY - event.clientY : pointerStartX - event.clientX) * directionMultiplier;
    const isDraggingInDirection = draggedDistance > 0;

    if (!event.target) return;
    if (!this.isAllowedToDrag$.value && !this.shouldDrag(event.target, isDraggingInDirection)) return;

    const wrapper = this.dom.getWrapperElement();
    const drawerDimension = isVertical(direction)
      ? element.getBoundingClientRect().height || 0
      : element.getBoundingClientRect().width || 0;

    element.classList.add(DRAG_CLASS);
    this.isAllowedToDrag$.next(true);
    this.currentPointerPosition$.next({ x: event.clientX, y: event.clientY });

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

    if (wrapper && this.state.overlayRef$.value) {
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
    const direction = this.state.direction$.value;
    let element = el as HTMLElement;
    const drawer = this.state.drawerRef$.value;
    const highlightedText = window.getSelection()?.toString();
    const swipeAmount = drawer ? this.dom.getTranslate(drawer, direction) : null;
    const date = new Date();

    if (element.tagName === 'SELECT') return false;
    if (element.hasAttribute('data-vaul-no-drag') || element.closest('[data-vaul-no-drag]')) return false;

    if (this.state.openTime$.value && date.getTime() - this.state.openTime$.value.getTime() < 500) {
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
    const currentPoint = this.snap.activeSnapPoint$.value;

    this.state.setIsDragging(false);
    this.dragStartPosition$.next(null);

    if (currentPoint) {
      this.snap.snapToPoint(currentPoint);
    } else {
      set(element, {
        transform: 'translate3d(0, 0, 0)',
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }

    set(this.state.overlayRef$.value, {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      opacity: '1',
    });

    const wrapper = this.dom.getWrapperElement();
    const currentSwipeAmount = this.dom.getTranslate(element, this.state.direction$.value);

    if (
      this.state.shouldScaleBackground$.value &&
      currentSwipeAmount &&
      Math.abs(currentSwipeAmount) > 0 &&
      this.state.isOpen$.value
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
    if (!this.state.isDragging$.value || !element) return;
    element.classList.remove(DRAG_CLASS);
    this.state.setIsDragging(false);
    this.dragEndTime$.next(new Date());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pointerStart$.complete();
    this.dragStartPosition$.complete();
    this.currentPointerPosition$.complete();
    this.wasBeyondThePoint$.complete();
    this.dragEndTime$.complete();
    this.dragStartTime$.complete();
    this.isAllowedToDrag$.complete();
  }
}
