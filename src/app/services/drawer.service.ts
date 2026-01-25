import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from '../types';
import {
  BORDER_RADIUS,
  CLOSE_THRESHOLD,
  DRAG_CLASS,
  SCROLL_LOCK_TIMEOUT,
  TRANSITIONS,
  VELOCITY_THRESHOLD,
  WINDOW_TOP_OFFSET,
} from './constants';
import { dampenValue, isVertical, set } from './helpers';

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  private destroy$ = new Subject<void>();
  // Excerpt from: class DrawerService
  public stateChange$ = new BehaviorSubject<void>(undefined);

  // Core state subjects
  public isOpen$ = new BehaviorSubject<boolean>(false);
  public isDragging$ = new BehaviorSubject<boolean>(false);
  public isDraggingObs$ = this.isDragging$.asObservable();
  public drawerRef$ = new BehaviorSubject<HTMLDivElement | null>(null);
  public drawerRefObs$ = this.drawerRef$.asObservable();
  public overlayRef$ = new BehaviorSubject<HTMLElement | null>(null);
  public direction$ = new BehaviorSubject<DrawerDirectionType>(DrawerDirection.BOTTOM);
  public dragStartPosition$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  public shouldScaleBackground$ = new BehaviorSubject<boolean>(false);
  public setBackgroundColorOnScale$ = new BehaviorSubject<boolean>(false);
  public noBodyStyles$ = new BehaviorSubject<boolean>(false);
  public nested$ = new BehaviorSubject<boolean>(false);
  public modal$ = new BehaviorSubject<boolean>(false);
  public hasBeenOpened$ = new BehaviorSubject<boolean>(false);
  public preventScrollRestoration$ = new BehaviorSubject<boolean>(false);
  private currentPointerPosition$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  public currentPointerPositionObs$: Observable<{ x: number; y: number } | null> =
    this.currentPointerPosition$.asObservable();

  public wasBeyondThePoint$ = new BehaviorSubject<boolean | null>(null);
  public pointerStart$ = new BehaviorSubject<{ x: number; y: number } | null>(null);
  public dragEndTime$ = new BehaviorSubject<Date | null>(null);
  public dragStartTime$ = new BehaviorSubject<Date | null>(null);
  public isAllowedToDrag$ = new BehaviorSubject<boolean>(false);
  public openTime$ = new BehaviorSubject<Date | null>(null);

  // Snap Points State
  public snapPoints$ = new BehaviorSubject<SnapPoint[] | null>(null);
  public activeSnapPoint$ = new BehaviorSubject<SnapPoint | null>(null);
  public fadeFromIndex$ = new BehaviorSubject<number | undefined>(undefined);
  public snapToSequentialPoint$ = new BehaviorSubject<boolean>(false);

  public activeSnapPointIndex$ = combineLatest([this.snapPoints$, this.activeSnapPoint$]).pipe(
    map(([snapPoints, activeSnapPoint]) => {
      if (!snapPoints || activeSnapPoint === null) return null;
      return snapPoints.indexOf(activeSnapPoint);
    })
  );

  private lastTimeDragPrevented: Date | null = null;

  drawerTransform$ = combineLatest([this.drawerRefObs$, this.isDraggingObs$]).pipe(
    map(([drawer, isDragging]) => {
      if (!drawer) return null;
      const offset = isDragging ? this.calculateDragDelta() : 0;
      const direction = this.direction$.value;
      return isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
    }),
  );
  constructor() {
    // Subscribe to drawer ref changes
    this.drawerRefObs$.pipe(takeUntil(this.destroy$)).subscribe((drawer: HTMLDivElement | null) => {
      if (!drawer) return;
      const direction = this.direction$.value;
      if (!this.isOpen$.value) {
        const height = drawer.getBoundingClientRect().height;
        const width = drawer.getBoundingClientRect().width;
        drawer.style.transform = isVertical(direction) ? `translateY(${height}px)` : `translateX(${width}px)`;
      }
    });

    // Subscribe to drag state changes
    this.isDragging$
      .asObservable()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((isDragging) => {
          const drawer = this.drawerRef$.value;
          if (!drawer || !isDragging) return EMPTY;

          return combineLatest([of(drawer), this.currentPointerPositionObs$]).pipe(
            map(([drawer, currentPosition]) => {
              if (!currentPosition) return;
              const dragDelta = this.calculateDragDelta();
              if (dragDelta <= 0) {
                return;
              }

              drawer.style.transition = 'none';
            }),
          );
        }),
      )
      .subscribe();

    // Watch for open state changes
    this.isOpen$.pipe(takeUntil(this.destroy$)).subscribe((isOpen: boolean) => {
      const drawer = this.drawerRef$.value;
      if (!drawer) return;

      if (!isOpen) {
        const direction = this.direction$.value;
        const offset = this.getTranslateBasedOnDirection({ drawer, direction });
        drawer.style.transform = isVertical(direction) ? `translateY(${offset}px)` : `translateX(${offset}px)`;
      } else {
        // If opening and we have snap points, go to the first one (or active one)
        const snapPoints = this.snapPoints$.value;
        if (snapPoints && snapPoints.length > 0) {
          const activePoint = this.activeSnapPoint$.value ?? snapPoints[0];
          this.snapToPoint(activePoint);
        }
      }
    });
  }

  getSnapPointsOffset(): number[] {
    const snapPoints = this.snapPoints$.value;
    const drawer = this.drawerRef$.value;
    const direction = this.direction$.value;
    if (!snapPoints || !drawer) return [];

    const rect = drawer.getBoundingClientRect();
    const containerSize = isVertical(direction) ? window.innerHeight : window.innerWidth;
    const drawerSize = isVertical(direction) ? rect.height : rect.width;

    return snapPoints.map((snapPoint) => {
      let snapPointAsNumber = 0;
      const isPx = typeof snapPoint === 'string';

      if (isPx) {
        snapPointAsNumber = parseInt(snapPoint as string, 10);
      } else {
        snapPointAsNumber = (snapPoint as number) * drawerSize;
      }

      if (isVertical(direction)) {
        return direction === DrawerDirection.BOTTOM 
          ? drawerSize - snapPointAsNumber 
          : -drawerSize + snapPointAsNumber;
      } else {
        return direction === DrawerDirection.RIGHT 
          ? drawerSize - snapPointAsNumber 
          : -drawerSize + snapPointAsNumber;
      }
    });
  }

  private snapToPoint(snapPoint: SnapPoint) {
    const drawer = this.drawerRef$.value;
    const direction = this.direction$.value;
    if (!drawer) return;

    const index = this.snapPoints$.value?.indexOf(snapPoint) ?? -1;
    if (index === -1) return;

    const offsets = this.getSnapPointsOffset();
    const offset = offsets[index];

    this.activeSnapPoint$.next(snapPoint);

    set(drawer, {
      transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      transform: isVertical(direction) ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`,
    });

    // Handle overlay fading based on fadeFromIndex
    const fadeFromIndex = this.fadeFromIndex$.value;
    const overlay = this.overlayRef$.value;
    if (overlay && fadeFromIndex !== undefined) {
      const opacity = index < fadeFromIndex ? '0' : '1';
      set(overlay, {
        transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
        opacity,
      });
    }
  }

  // State updaters
  setIsOpen(isOpen: boolean) {
    if (isOpen === this.isOpen$.value) return;

    this.isOpen$.next(isOpen);
    if (isOpen) {
      this.hasBeenOpened$.next(true);
    }
  }

  setIsDragging(isDragging: boolean) {
    this.isDragging$.next(isDragging);
  }

  setDirection(direction: DrawerDirectionType) {
    this.direction$.next(direction);
  }

  setDrawerRef(ref: HTMLDivElement | null) {
    if (ref) {
      // Set initial transform to hide drawer
      const height = ref.getBoundingClientRect().height;
      const width = ref.getBoundingClientRect().width;
      ref.style.transform = isVertical(this.direction$.value) ? `translateY(${height}px)` : `translateX(${width}px)`;
    }

    this.drawerRef$.next(ref);
  }

  setOverlayRef(ref: HTMLElement | null) {
    this.overlayRef$.next(ref);
  }

  onPress(event: PointerEvent, element?: HTMLDivElement) {
    if (!element) return;
    // Ensure we maintain correct pointer capture even when going outside of the drawer
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStartPosition$.next({
      x: event.clientX,
      y: event.clientY,
    });
    this.currentPointerPosition$.next({
      x: event.clientX,
      y: event.clientY,
    });
  }

  onRelease(event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement) {
    if (!element) return;
    if (!event) return;
    
    // Always clear pointer start and dragging state
    this.pointerStart$.next(null);
    this.wasBeyondThePoint$.next(false);
    
    if (!this.isDragging$.value) return;
    this.isDragging$.next(false);
    
    this.dragEndTime$.next(new Date());

    const timeTaken = (this.dragEndTime$.value?.getTime() || 0) - (this.dragStartTime$.value?.getTime() || 0);
    const dragDelta = this.calculateDragDelta();
    
    const snapPoints = this.snapPoints$.value;
    const snapPointsOffset = this.getSnapPointsOffset();
    const activeSnapPointIndex = snapPoints && this.activeSnapPoint$.value ? snapPoints.indexOf(this.activeSnapPoint$.value) : 0;
    const activeSnapPointOffset = activeSnapPointIndex !== -1 ? snapPointsOffset[activeSnapPointIndex] : 0;

    const currentPosition = activeSnapPointOffset + dragDelta;
    const isFirst = activeSnapPointIndex === 0;
    const isVerticalDir = isVertical(direction);
    const drawerDimension = isVerticalDir ? element.offsetHeight : element.offsetWidth;

    // Determine if we are dragging in the "closing" direction
    const hasDraggedToClose = (direction === 'bottom' || direction === 'right')
        ? dragDelta > 0
        : dragDelta < 0;

    // 1. High velocity swipe? Advance to next/prev point or close
    const startX = this.dragStartPosition$.value?.x ?? 0;
    const startY = this.dragStartPosition$.value?.y ?? 0;
    const distMoved = isVerticalDir ? Math.abs(event.clientY - startY) : Math.abs(event.clientX - startX);
    const velocity = timeTaken > 0 ? distMoved / timeTaken : 0;

    if (velocity > VELOCITY_THRESHOLD) {
      if (!hasDraggedToClose && activeSnapPointIndex < (snapPoints?.length ?? 1) - 1) {
        this.snapToPoint(snapPoints![activeSnapPointIndex + 1]);
        return;
      }
      
      if (hasDraggedToClose) {
        if (isFirst) {
          this.closeDrawer(element);
        } else {
          this.snapToPoint(snapPoints![activeSnapPointIndex - 1]);
        }
        return;
      }
    }

    // 2. Proximity based snapping
    if (snapPoints && snapPoints.length > 0) {
      const closedOffset = isVerticalDir 
        ? (direction === 'bottom' ? drawerDimension : -drawerDimension)
        : (direction === 'right' ? drawerDimension : -drawerDimension);

      const closestSnapPointOffset = snapPointsOffset.reduce((prev, curr) => {
        return Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev;
      });

      const closestIndex = snapPointsOffset.indexOf(closestSnapPointOffset);
      
      // If we are closer to the closed position than to the best snap point, close it
      if (Math.abs(closedOffset - currentPosition) < Math.abs(closestSnapPointOffset - currentPosition)) {
         this.closeDrawer(element);
         return;
      }

      this.snapToPoint(snapPoints[closestIndex]);
      return;
    }

    // 3. Fallback for no snap points
    if (Math.abs(dragDelta) >= drawerDimension * CLOSE_THRESHOLD) {
      this.closeDrawer(element);
    } else {
      this.resetDrawer(direction, element);
    }
  }
  resetDrawer(direction: DrawerDirectionType, element?: HTMLDivElement) {
    if (!element) return;
    const currentPoint = this.activeSnapPoint$.value;
    
    this.isDragging$.next(false);
    this.dragStartPosition$.next(null);

    if (currentPoint) {
      this.snapToPoint(currentPoint);
    } else {
      set(element, {
        transform: 'translate3d(0, 0, 0)',
        transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      });
    }

    set(this.overlayRef$.value, {
      transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
      opacity: '1',
    });

    const wrapper = document.querySelector('[data-vaul-drawer-wrapper]');
    const currentSwipeAmount = this.getTranslate(element, this.direction$.value);

    // Don't reset background if swiped upwards
    if (this.shouldScaleBackground$.value && currentSwipeAmount && Math.abs(currentSwipeAmount) > 0 && this.isOpen$.value) {
      set(
        wrapper,
        {
          borderRadius: `${BORDER_RADIUS}px`,
          overflow: 'hidden',
          ...(isVertical(direction)
            ? {
                transform: `scale(${this.getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
                transformOrigin: 'top',
              }
            : {
                transform: `scale(${this.getScale()}) translate3d(${direction === 'right' ? '-14px' : '14px'}, 0, 0)`,
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
  onDrag(event: DragEvent | PointerEvent, element?: HTMLDivElement, dismissible: boolean = true) {
    const direction = this.direction$.value;
    if (!element) return;

    // Safety check: if buttons are released, terminate drag
    if (event instanceof PointerEvent && event.buttons === 0 && this.isDragging$.value) {
      this.onRelease(event, direction, element);
      return;
    }

    if (this.isDragging$.value) {
      const snapPoints = this.snapPoints$.value;
      const snapPointsOffset = this.getSnapPointsOffset();
      const activeSnapPointIndex = snapPoints && this.activeSnapPoint$.value ? snapPoints.indexOf(this.activeSnapPoint$.value) : null;
      const activeSnapPointOffset = activeSnapPointIndex !== null ? snapPointsOffset[activeSnapPointIndex] : 0;

      const directionMultiplier = direction === 'bottom' || direction === 'right' ? 1 : -1;
      const pointerStartY = this.pointerStart$?.value?.y ?? 0;
      const pointerStartX = this.pointerStart$?.value?.x ?? 0;
      
      const draggedDistance =
        (isVertical(direction) ? pointerStartY - event.clientY : pointerStartX - event.clientX) * directionMultiplier;
      
      const isDraggingInDirection = draggedDistance > 0;
      const wrapper = document.querySelector('[data-vaul-drawer-wrapper]');
      const drawerDimension = isVertical(this.direction$.value)
        ? element.getBoundingClientRect().height || 0
        : element.getBoundingClientRect().width || 0;

      if (!event.target) return;
      if (!this.isAllowedToDrag$.value && !this.shouldDrag(event.target, isDraggingInDirection)) return;
      
      element.classList.add(DRAG_CLASS);
      this.isAllowedToDrag$.next(true);

      this.currentPointerPosition$.next({
        x: event.clientX,
        y: event.clientY,
      });
      
      const dragDelta = this.calculateDragDelta();

      // Calculate new position based on active snap point
      let newValue = activeSnapPointOffset + dragDelta;

      // Clamp if needed
      if (snapPoints && snapPointsOffset.length > 0) {
        const lastPointOffset = snapPointsOffset[snapPointsOffset.length - 1];
        if ((direction === 'bottom' || direction === 'right') && newValue < lastPointOffset) {
          newValue = lastPointOffset;
        }
        if ((direction === 'top' || direction === 'left') && newValue > lastPointOffset) {
          newValue = lastPointOffset;
        }
      }

      // Update drawer transform
      set(element, {
        transition: 'none',
        transform: isVertical(direction)
          ? `translate3d(0, ${newValue}px, 0)`
          : `translate3d(${newValue}px, 0, 0)`,
      });

      if (wrapper && this.overlayRef$.value) {
        // Calculate percentageDragged for background scaling and overlay fading
        const absDragDelta = Math.abs(dragDelta);
        const percentageDragged = Math.min(absDragDelta / drawerDimension, 1);
        
        const scaleValue = Math.min(this.getScale() + percentageDragged * (1 - this.getScale()), 1);
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
  }
  shouldDrag(el: EventTarget, isDraggingInDirection: boolean) {
    let direction = this.direction$.value;
    let element = el as HTMLElement;
    const drawer = this.drawerRef$.value;
    const highlightedText = window.getSelection()?.toString();
    const swipeAmount = drawer ? this.getTranslate(drawer, direction) : null;
    const date = new Date();
    // Fixes https://github.com/emilkowalski/vaul/issues/483
    if (element.tagName === 'SELECT') {
      return false;
    }

    if (element.hasAttribute('data-vaul-no-drag') || element.closest('[data-vaul-no-drag]')) {
      return false;
    }
    // Allow scrolling when animating
    if (this.openTime$.value && date.getTime() - this.openTime$.value.getTime() < 500) {
      return false;
    }

    if (swipeAmount !== null) {
      // For bottom/right: positive swipe means already dragging to close
      // For top/left: negative swipe means already dragging to close
      const isClosingSwipe = (direction === 'bottom' || direction === 'right')
        ? swipeAmount > 0
        : swipeAmount < 0;
      if (isClosingSwipe) {
        return true;
      }
    }

    // Don't drag if there's highlighted text
    if (highlightedText && highlightedText.length > 0) {
      return false;
    }

    // Disallow dragging if drawer was scrolled within `scrollLockTimeout`
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

      // We are dragging down so we should allow scrolling
      return false;
    }

    // Keep climbing up the DOM tree as long as there's a parent
    while (element) {
      // Check if the element is scrollable
      if (element.scrollHeight > element.clientHeight) {
        if (element.scrollTop !== 0) {
          this.lastTimeDragPrevented = new Date();

          // The element is scrollable and not scrolled to the top, so don't drag
          return false;
        }

        if (element.getAttribute('role') === 'dialog') {
          return true;
        }
      }

      // Move up to the parent element
      element = element.parentNode as HTMLElement;
    }

    // No scrollable parents not scrolled to the top found, so drag
    return true;
  }

  getTranslateBasedOnDirection({ drawer, direction } : { drawer: HTMLDivElement; direction: DrawerDirectionType }): number {
    if(!drawer) return 0;
    if(direction === DrawerDirection.BOTTOM) {
      return drawer.offsetHeight;
    }
    if(direction === DrawerDirection.TOP) {
      return -drawer.offsetHeight;
    }
    if(direction === DrawerDirection.LEFT) {
      return -drawer.offsetWidth;
    }
    if(direction === DrawerDirection.RIGHT) {
      return drawer.offsetWidth;
    }
    return isVertical(direction) ? drawer.offsetHeight : drawer.offsetWidth;
  }

  closeDrawer(drawer: HTMLDivElement) {
    if (!drawer) return;
    this.isOpen$.next(false);
    this.cancelDrag(drawer);
  }

  getScale() {
    return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
  }

  private calculateDragDelta(): number {
    const start = this.dragStartPosition$.value;
    const current = this.currentPointerPosition$.value;
    if (!start || !current) return 0;

    return isVertical(this.direction$.value) ? current.y - start.y : current.x - start.x;
  }

  shouldScaleBackground() {
    return this.shouldScaleBackground$.value;
  }

  setBackgroundColorOnScale() {
    return this.setBackgroundColorOnScale$.value;
  }

  noBodyStyles() {
    return this.noBodyStyles$.value;
  }

  setScaleBackground(value: boolean) {
    this.shouldScaleBackground$.next(value);
  }

  setBackgroundColor(value: boolean) {
    this.setBackgroundColorOnScale$.next(value);
  }

  setNoBodyStyles(value: boolean) {
    this.noBodyStyles$.next(value);
  }

  nested() {
    return this.nested$.value;
  }

  modal() {
    return this.modal$.value;
  }

  hasBeenOpened() {
    return this.hasBeenOpened$.value;
  }

  preventScrollRestoration() {
    return this.preventScrollRestoration$.value;
  }

  setNested(value: boolean) {
    this.nested$.next(value);
  }

  setModal(value: boolean) {
    this.modal$.next(value);
  }

  setHasBeenOpened(value: boolean) {
    this.hasBeenOpened$.next(value);
  }

  setPreventScrollRestoration(value: boolean) {
    this.preventScrollRestoration$.next(value);
  }

  private cancelDrag(element: HTMLDivElement) {
    if (!this.isDragging$.value || !element) return;

    element.classList.remove(DRAG_CLASS);
    this.isDragging$.next(false);
    this.dragEndTime$.next(new Date());
  }

  private getTranslate(element: HTMLElement, direction: DrawerDirectionType) {
    if (!element) {
      return null;
    }
    const style = window.getComputedStyle(element);
    const transform =
      // @ts-ignore
      style.transform || style.webkitTransform || style.mozTransform;

    if (!transform || transform === 'none') {
      return 0;
    }

    let mat = transform.match(/^matrix3d\((.+)\)$/);
    if (mat) {
      // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix3d
      return parseFloat(mat[1].split(', ')[isVertical(direction) ? 13 : 12]);
    }
    // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix
    mat = transform.match(/^matrix\((.+)\)$/);
    return mat ? parseFloat(mat[1].split(', ')[isVertical(direction) ? 5 : 4]) : null;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.isOpen$.complete();
    this.isDragging$.complete();
    this.drawerRef$.complete();
    this.overlayRef$.complete();
    this.direction$.complete();
    this.dragStartPosition$.complete();
    this.shouldScaleBackground$.complete();
    this.setBackgroundColorOnScale$.complete();
    this.noBodyStyles$.complete();
    this.nested$.complete();
    this.modal$.complete();
    this.hasBeenOpened$.complete();
    this.preventScrollRestoration$.complete();
    this.currentPointerPosition$.complete();
  }
}
