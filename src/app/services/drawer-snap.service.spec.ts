import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DrawerSnapService } from './drawer-snap.service';
import { DrawerStateService } from './drawer-state.service';
import { DrawerDirection } from '../types';
import { createDrawerStateServiceMock, createMockHTMLElement } from './__mocks__/dom-helpers.mock';

describe('DrawerSnapService', () => {
  let service: DrawerSnapService;
  const stateMock = createDrawerStateServiceMock();
  let mockDrawer: HTMLDivElement;

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [DrawerSnapService, { provide: DrawerStateService, useValue: stateMock }],
    });
    service = TestBed.inject(DrawerSnapService);
  });

  beforeEach(() => {
    mockDrawer = createMockHTMLElement();
    stateMock.drawerRef$.next(null);
    stateMock.direction$.next(DrawerDirection.BOTTOM);
    stateMock.overlayRef$.next(null);
    stateMock.isOpen$.next(false);
    service.snapPoints$.next(null);
    service.activeSnapPoint$.next(null);
    service.fadeFromIndex$.next(undefined);
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with null snap points', () => {
      expect(service.snapPoints$.value).toBeNull();
    });

    it('should start with null active snap point', () => {
      expect(service.activeSnapPoint$.value).toBeNull();
    });

    it('should start with undefined fadeFromIndex', () => {
      expect(service.fadeFromIndex$.value).toBeUndefined();
    });
  });

  describe('getSnapPointsOffset', () => {
    it('should return empty array when no snap points', () => {
      expect(service.getSnapPointsOffset()).toEqual([]);
    });

    it('should return empty array when drawer ref is not set', () => {
      service.snapPoints$.next([0.5, 1]);
      expect(service.getSnapPointsOffset()).toEqual([]);
    });

    it('should calculate percentage offsets for BOTTOM direction', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.direction$.next(DrawerDirection.BOTTOM);
      service.snapPoints$.next([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([250, 0]);
    });

    it('should calculate percentage offsets for TOP direction', () => {
      const topDrawer = createMockHTMLElement({ offsetHeight: 400 });
      stateMock.drawerRef$.next(topDrawer);
      stateMock.direction$.next(DrawerDirection.TOP);
      service.snapPoints$.next([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([-200, 0]);
    });

    it('should calculate percentage offsets for RIGHT direction', () => {
      const rightDrawer = createMockHTMLElement({ offsetWidth: 300 });
      stateMock.drawerRef$.next(rightDrawer);
      stateMock.direction$.next(DrawerDirection.RIGHT);
      service.snapPoints$.next([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([150, 0]);
    });

    it('should calculate percentage offsets for LEFT direction', () => {
      const leftDrawer = createMockHTMLElement({ offsetWidth: 350 });
      stateMock.drawerRef$.next(leftDrawer);
      stateMock.direction$.next(DrawerDirection.LEFT);
      service.snapPoints$.next([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([-175, 0]);
    });

    it('should parse pixel snap points for BOTTOM direction', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.direction$.next(DrawerDirection.BOTTOM);
      service.snapPoints$.next(['100px', '300px']);

      expect(service.getSnapPointsOffset()).toEqual([400, 200]);
    });

    it('should handle mixed percentage and pixel snap points', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.direction$.next(DrawerDirection.BOTTOM);
      service.snapPoints$.next([0.25, '250px']);

      expect(service.getSnapPointsOffset()).toEqual([375, 250]);
    });
  });

  describe('snapToPoint', () => {
    it('should do nothing when drawer ref is not set', () => {
      service.snapPoints$.next([0.5, 1]);
      service.snapToPoint(0.5);
      expect(service.activeSnapPoint$.value).toBeNull();
    });

    it('should do nothing when snap point is not in the array', () => {
      stateMock.drawerRef$.next(mockDrawer);
      service.snapPoints$.next([0.5, 1]);
      service.snapToPoint(0.75);
      expect(service.activeSnapPoint$.value).toBeNull();
    });

    it('should set the active snap point', () => {
      stateMock.drawerRef$.next(mockDrawer);
      service.snapPoints$.next([0.5, 1]);
      service.snapToPoint(0.5);
      expect(service.activeSnapPoint$.value).toBe(0.5);
    });

    it('should apply vertical transform for BOTTOM direction', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.direction$.next(DrawerDirection.BOTTOM);
      service.snapPoints$.next([0.5, 1]);

      service.snapToPoint(0.5);

      expect(mockDrawer.style.transform).toContain('translate3d(0, 250px, 0)');
    });

    it('should apply horizontal transform for RIGHT direction', () => {
      const rightDrawer = createMockHTMLElement({ offsetWidth: 300 });
      stateMock.drawerRef$.next(rightDrawer);
      stateMock.direction$.next(DrawerDirection.RIGHT);
      service.snapPoints$.next([0.5, 1]);

      service.snapToPoint(0.5);

      expect(rightDrawer.style.transform).toContain('translate3d(150px, 0, 0)');
    });

    it('should set a CSS transition on the drawer', () => {
      stateMock.drawerRef$.next(mockDrawer);
      service.snapPoints$.next([0.5]);
      service.snapToPoint(0.5);
      expect(mockDrawer.style.transition).toContain('transform');
    });

    it('should set overlay opacity to 0 when below fadeFromIndex', () => {
      const overlay = document.createElement('div');
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.overlayRef$.next(overlay);
      service.snapPoints$.next([0.3, 0.7, 1]);
      service.fadeFromIndex$.next(1);

      service.snapToPoint(0.3);
      expect(overlay.style.opacity).toBe('0');

      service.snapToPoint(0.7);
      expect(overlay.style.opacity).toBe('1');
    });
  });

  describe('goToAdjacentSnap', () => {
    it('should do nothing when drawer is closed', () => {
      service.snapPoints$.next([0.5, 0.8, 1]);
      service.activeSnapPoint$.next(0.5);
      stateMock.isOpen$.next(false);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint$.value).toBe(0.5);
    });

    it('should do nothing when no snap points', () => {
      stateMock.isOpen$.next(true);
      service.goToAdjacentSnap(1);
      expect(service.activeSnapPoint$.value).toBeNull();
    });

    it('should advance to the next snap point', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.isOpen$.next(true);
      service.snapPoints$.next([0.4, 0.8, 1]);
      service.activeSnapPoint$.next(0.4);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint$.value).toBe(0.8);
    });

    it('should go to the previous snap point with step -1', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.isOpen$.next(true);
      service.snapPoints$.next([0.4, 0.8, 1]);
      service.activeSnapPoint$.next(0.8);

      service.goToAdjacentSnap(-1);

      expect(service.activeSnapPoint$.value).toBe(0.4);
    });

    it('should not exceed the last snap point', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.isOpen$.next(true);
      service.snapPoints$.next([0.5, 1]);
      service.activeSnapPoint$.next(1);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint$.value).toBe(1);
    });

    it('should not go before the first snap point', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.isOpen$.next(true);
      service.snapPoints$.next([0.5, 1]);
      service.activeSnapPoint$.next(0.5);

      service.goToAdjacentSnap(-1);

      expect(service.activeSnapPoint$.value).toBe(0.5);
    });

    it('should default to first snap point when no active point', () => {
      stateMock.drawerRef$.next(mockDrawer);
      stateMock.isOpen$.next(true);
      service.snapPoints$.next([0.4, 0.8, 1]);
      service.activeSnapPoint$.next(null);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint$.value).toBe(0.8);
    });
  });

  describe('activeSnapPointIndex$ Observable', () => {
    it('should emit null when no snap points', () => {
      const values: (number | null)[] = [];
      service.activeSnapPointIndex$.subscribe((index) => values.push(index)).unsubscribe();
      expect(values[0]).toBeNull();
    });

    it('should emit null when no active snap point', () => {
      service.snapPoints$.next([0.5, 1]);
      const values: (number | null)[] = [];
      service.activeSnapPointIndex$.subscribe((index) => values.push(index)).unsubscribe();
      expect(values[0]).toBeNull();
    });

    it('should emit the correct index for the active snap point', () => {
      service.snapPoints$.next([0.3, 0.6, 1]);
      service.activeSnapPoint$.next(0.6);
      const values: (number | null)[] = [];
      service.activeSnapPointIndex$.subscribe((index) => values.push(index)).unsubscribe();
      expect(values[0]).toBe(1);
    });
  });
});
