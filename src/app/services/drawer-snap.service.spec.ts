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
    stateMock.drawerRef.set(null);
    stateMock.direction.set(DrawerDirection.BOTTOM);
    stateMock.overlayRef.set(null);
    stateMock.isOpen.set(false);
    service.snapPoints.set(null);
    service.activeSnapPoint.set(null);
    service.fadeFromIndex.set(undefined);
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with null snap points', () => {
      expect(service.snapPoints()).toBeNull();
    });

    it('should start with null active snap point', () => {
      expect(service.activeSnapPoint()).toBeNull();
    });

    it('should start with undefined fadeFromIndex', () => {
      expect(service.fadeFromIndex()).toBeUndefined();
    });
  });

  describe('getSnapPointsOffset', () => {
    it('should return empty array when no snap points', () => {
      expect(service.getSnapPointsOffset()).toEqual([]);
    });

    it('should return empty array when drawer ref is not set', () => {
      service.snapPoints.set([0.5, 1]);
      expect(service.getSnapPointsOffset()).toEqual([]);
    });

    it('should calculate percentage offsets for BOTTOM direction', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.direction.set(DrawerDirection.BOTTOM);
      service.snapPoints.set([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([250, 0]);
    });

    it('should calculate percentage offsets for TOP direction', () => {
      const topDrawer = createMockHTMLElement({ offsetHeight: 400 });
      stateMock.drawerRef.set(topDrawer);
      stateMock.direction.set(DrawerDirection.TOP);
      service.snapPoints.set([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([-200, 0]);
    });

    it('should calculate percentage offsets for RIGHT direction', () => {
      const rightDrawer = createMockHTMLElement({ offsetWidth: 300 });
      stateMock.drawerRef.set(rightDrawer);
      stateMock.direction.set(DrawerDirection.RIGHT);
      service.snapPoints.set([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([150, 0]);
    });

    it('should calculate percentage offsets for LEFT direction', () => {
      const leftDrawer = createMockHTMLElement({ offsetWidth: 350 });
      stateMock.drawerRef.set(leftDrawer);
      stateMock.direction.set(DrawerDirection.LEFT);
      service.snapPoints.set([0.5, 1]);

      expect(service.getSnapPointsOffset()).toEqual([-175, 0]);
    });

    it('should parse pixel snap points for BOTTOM direction', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.direction.set(DrawerDirection.BOTTOM);
      service.snapPoints.set(['100px', '300px']);

      expect(service.getSnapPointsOffset()).toEqual([400, 200]);
    });

    it('should handle mixed percentage and pixel snap points', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.direction.set(DrawerDirection.BOTTOM);
      service.snapPoints.set([0.25, '250px']);

      expect(service.getSnapPointsOffset()).toEqual([375, 250]);
    });
  });

  describe('snapToPoint', () => {
    it('should do nothing when drawer ref is not set', () => {
      service.snapPoints.set([0.5, 1]);
      service.snapToPoint(0.5);
      expect(service.activeSnapPoint()).toBeNull();
    });

    it('should do nothing when snap point is not in the array', () => {
      stateMock.drawerRef.set(mockDrawer);
      service.snapPoints.set([0.5, 1]);
      service.snapToPoint(0.75);
      expect(service.activeSnapPoint()).toBeNull();
    });

    it('should set the active snap point', () => {
      stateMock.drawerRef.set(mockDrawer);
      service.snapPoints.set([0.5, 1]);
      service.snapToPoint(0.5);
      expect(service.activeSnapPoint()).toBe(0.5);
    });

    it('should apply vertical transform for BOTTOM direction', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.direction.set(DrawerDirection.BOTTOM);
      service.snapPoints.set([0.5, 1]);

      service.snapToPoint(0.5);

      expect(mockDrawer.style.transform).toContain('translate3d(0, 250px, 0)');
    });

    it('should apply horizontal transform for RIGHT direction', () => {
      const rightDrawer = createMockHTMLElement({ offsetWidth: 300 });
      stateMock.drawerRef.set(rightDrawer);
      stateMock.direction.set(DrawerDirection.RIGHT);
      service.snapPoints.set([0.5, 1]);

      service.snapToPoint(0.5);

      expect(rightDrawer.style.transform).toContain('translate3d(150px, 0, 0)');
    });

    it('should set a CSS transition on the drawer', () => {
      stateMock.drawerRef.set(mockDrawer);
      service.snapPoints.set([0.5]);
      service.snapToPoint(0.5);
      expect(mockDrawer.style.transition).toContain('transform');
    });

    it('should set overlay opacity to 0 when below fadeFromIndex', () => {
      const overlay = document.createElement('div');
      stateMock.drawerRef.set(mockDrawer);
      stateMock.overlayRef.set(overlay);
      service.snapPoints.set([0.3, 0.7, 1]);
      service.fadeFromIndex.set(1);

      service.snapToPoint(0.3);
      expect(overlay.style.opacity).toBe('0');

      service.snapToPoint(0.7);
      expect(overlay.style.opacity).toBe('1');
    });
  });

  describe('goToAdjacentSnap', () => {
    it('should do nothing when drawer is closed', () => {
      service.snapPoints.set([0.5, 0.8, 1]);
      service.activeSnapPoint.set(0.5);
      stateMock.isOpen.set(false);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint()).toBe(0.5);
    });

    it('should do nothing when no snap points', () => {
      stateMock.isOpen.set(true);
      service.goToAdjacentSnap(1);
      expect(service.activeSnapPoint()).toBeNull();
    });

    it('should advance to the next snap point', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.isOpen.set(true);
      service.snapPoints.set([0.4, 0.8, 1]);
      service.activeSnapPoint.set(0.4);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint()).toBe(0.8);
    });

    it('should go to the previous snap point with step -1', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.isOpen.set(true);
      service.snapPoints.set([0.4, 0.8, 1]);
      service.activeSnapPoint.set(0.8);

      service.goToAdjacentSnap(-1);

      expect(service.activeSnapPoint()).toBe(0.4);
    });

    it('should not exceed the last snap point', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.isOpen.set(true);
      service.snapPoints.set([0.5, 1]);
      service.activeSnapPoint.set(1);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint()).toBe(1);
    });

    it('should not go before the first snap point', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.isOpen.set(true);
      service.snapPoints.set([0.5, 1]);
      service.activeSnapPoint.set(0.5);

      service.goToAdjacentSnap(-1);

      expect(service.activeSnapPoint()).toBe(0.5);
    });

    it('should default to first snap point when no active point', () => {
      stateMock.drawerRef.set(mockDrawer);
      stateMock.isOpen.set(true);
      service.snapPoints.set([0.4, 0.8, 1]);
      service.activeSnapPoint.set(null);

      service.goToAdjacentSnap(1);

      expect(service.activeSnapPoint()).toBe(0.8);
    });
  });

  describe('activeSnapPointIndex computed signal', () => {
    it('should be null when no snap points', () => {
      expect(service.activeSnapPointIndex()).toBeNull();
    });

    it('should be null when no active snap point', () => {
      service.snapPoints.set([0.5, 1]);
      expect(service.activeSnapPointIndex()).toBeNull();
    });

    it('should return the correct index for the active snap point', () => {
      service.snapPoints.set([0.3, 0.6, 1]);
      service.activeSnapPoint.set(0.6);
      expect(service.activeSnapPointIndex()).toBe(1);
    });
  });
});
