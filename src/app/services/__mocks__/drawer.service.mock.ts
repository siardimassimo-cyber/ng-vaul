import { computed, signal } from '@angular/core';
import { DrawerDirection, DrawerDirectionType, SnapPoint } from '../../types';

export const createDrawerServiceMock = () => {
  const isOpen = signal<boolean>(false);
  const isDragging = signal<boolean>(false);
  const drawerRef = signal<HTMLDivElement | null>(null);
  const snapPoints = signal<SnapPoint[] | null>(null);
  const activeSnapPoint = signal<SnapPoint | null>(null);

  return {
    // State re-exports
    stateChange: signal<void>(undefined),
    isOpen,
    isDragging,
    drawerRef,
    overlayRef: signal<HTMLElement | null>(null),
    direction: signal<DrawerDirectionType>(DrawerDirection.BOTTOM),
    hasBeenOpened: signal<boolean>(false),
    openTime: signal<Date | null>(null),
    shouldScaleBackground: signal<boolean>(false),
    backgroundColorOnScale: signal<boolean>(false),
    noBodyStyles: signal<boolean>(false),
    nested: signal<boolean>(false),
    modal: signal<boolean>(false),
    preventScrollRestoration: signal<boolean>(false),

    // Drag re-exports
    pointerStart: signal<{ x: number; y: number } | null>(null),
    dragStartPosition: signal<{ x: number; y: number } | null>(null),
    currentPointerPosition: signal<{ x: number; y: number } | null>(null),
    wasBeyondThePoint: signal<boolean | null>(null),
    dragEndTime: signal<Date | null>(null),
    dragStartTime: signal<Date | null>(null),
    isAllowedToDrag: signal<boolean>(false),

    // Snap re-exports
    snapPoints,
    activeSnapPoint,
    fadeFromIndex: signal<number | undefined>(undefined),
    snapToSequentialPoint: signal<boolean>(false),
    activeSnapPointIndex: computed(() => {
      const sp = snapPoints();
      const asp = activeSnapPoint();
      if (!sp || asp === null) return null;
      return sp.indexOf(asp);
    }),

    drawerTransform: computed((): string | null => null),

    // State delegates
    setIsOpen: (isOpen: boolean): void => {},
    setIsDragging: (isDragging: boolean): void => {},
    setDirection: (direction: DrawerDirectionType): void => {},
    setDrawerRef: (ref: HTMLDivElement | null): void => {},
    setOverlayRef: (ref: HTMLElement | null): void => {},
    setScaleBackground: (value: boolean): void => {},
    setBackgroundColor: (value: boolean): void => {},
    setNoBodyStyles: (value: boolean): void => {},
    setNested: (value: boolean): void => {},
    setModal: (value: boolean): void => {},
    setHasBeenOpened: (value: boolean): void => {},
    setPreventScrollRestoration: (value: boolean): void => {},
    setOpenTime: (date: Date | null): void => {},

    // Snap delegates
    setSnapPoints: (value: SnapPoint[] | null): void => {},
    setActiveSnapPoint: (value: SnapPoint | null): void => {},
    setFadeFromIndex: (value: number | undefined): void => {},
    setSnapToSequentialPoint: (value: boolean): void => {},

    // Drag delegates
    onPress: (event: PointerEvent, element?: HTMLDivElement): void => {},
    onDrag: (event: DragEvent | PointerEvent, element?: HTMLDivElement, dismissible?: boolean): void => {},
    onRelease: (event: PointerEvent | null, direction: DrawerDirectionType, element?: HTMLDivElement): void => {},
    shouldDrag: (el: EventTarget, isDraggingInDirection: boolean): boolean => false,
    resetDrawer: (direction: DrawerDirectionType, element?: HTMLDivElement): void => {},
    closeDrawer: (drawer: HTMLDivElement): void => {},

    // Snap delegates
    getSnapPointsOffset: (): number[] => [],
    goToAdjacentSnap: (step: 1 | -1): void => {},

    // DOM delegates
    getTranslateBasedOnDirection: ({
      drawer,
      direction,
    }: {
      drawer: HTMLDivElement;
      direction: DrawerDirectionType;
    }): number => 0,
    getScale: (): number => 0.974,

    ngOnDestroy: (): void => {},
  };
};
