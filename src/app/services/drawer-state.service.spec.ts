import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DrawerStateService } from './drawer-state.service';
import { DrawerDirection } from '../types';

describe('DrawerStateService', () => {
  let service: DrawerStateService;

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [DrawerStateService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(DrawerStateService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  describe('Initial State', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with closed state', () => {
      expect(service.isOpen$.value).toBe(false);
    });

    it('should start not dragging', () => {
      expect(service.isDragging$.value).toBe(false);
    });

    it('should start with BOTTOM direction', () => {
      expect(service.direction$.value).toBe(DrawerDirection.BOTTOM);
    });

    it('should have null drawer and overlay refs', () => {
      expect(service.drawerRef$.value).toBeNull();
      expect(service.overlayRef$.value).toBeNull();
    });

    it('should start with hasBeenOpened false', () => {
      expect(service.hasBeenOpened$.value).toBe(false);
    });

    it('should start with flags as false', () => {
      expect(service.shouldScaleBackground$.value).toBe(false);
      expect(service.setBackgroundColorOnScale$.value).toBe(false);
      expect(service.noBodyStyles$.value).toBe(false);
      expect(service.nested$.value).toBe(false);
      expect(service.modal$.value).toBe(false);
      expect(service.preventScrollRestoration$.value).toBe(false);
    });
  });

  describe('isOpen State Management', () => {
    it('should set isOpen to true', () => {
      service.setIsOpen(true);
      expect(service.isOpen$.value).toBe(true);
    });

    it('should set isOpen to false', () => {
      service.setIsOpen(true);
      service.setIsOpen(false);
      expect(service.isOpen$.value).toBe(false);
    });

    it('should skip state change if value is already the same (true)', () => {
      let emissionCount = 0;
      service.isOpen$.subscribe(() => {
        emissionCount++;
      });

      service.setIsOpen(true);
      const countAfterFirst = emissionCount;

      service.setIsOpen(true);
      const countAfterSecond = emissionCount;

      expect(countAfterSecond).toBe(countAfterFirst);
    });

    it('should skip state change if value is already the same (false)', () => {
      service.setIsOpen(true);
      let emissionCount = 0;
      service.isOpen$.subscribe(() => {
        emissionCount++;
      });

      service.setIsOpen(false);
      const countAfterFirst = emissionCount;

      service.setIsOpen(false);
      const countAfterSecond = emissionCount;

      expect(countAfterSecond).toBe(countAfterFirst);
    });

    it('should mark hasBeenOpened true when opening drawer', () => {
      expect(service.hasBeenOpened$.value).toBe(false);
      service.setIsOpen(true);
      expect(service.hasBeenOpened$.value).toBe(true);
    });

    it('should not reset hasBeenOpened when closing', () => {
      service.setIsOpen(true);
      expect(service.hasBeenOpened$.value).toBe(true);

      service.setIsOpen(false);
      expect(service.hasBeenOpened$.value).toBe(true);
    });
  });

  describe('isDragging State Management', () => {
    it('should set isDragging to true', () => {
      service.setIsDragging(true);
      expect(service.isDragging$.value).toBe(true);
    });

    it('should set isDragging to false', () => {
      service.setIsDragging(true);
      service.setIsDragging(false);
      expect(service.isDragging$.value).toBe(false);
    });

    it('should emit even if value is the same', () => {
      let emissionCount = 0;
      service.isDragging$.subscribe(() => {
        emissionCount++;
      });

      service.setIsDragging(true);
      service.setIsDragging(true);

      expect(emissionCount).toBe(3);
    });
  });

  describe('Direction State Management', () => {
    it('should set direction to LEFT', () => {
      service.setDirection(DrawerDirection.LEFT);
      expect(service.direction$.value).toBe(DrawerDirection.LEFT);
    });

    it('should set direction to RIGHT', () => {
      service.setDirection(DrawerDirection.RIGHT);
      expect(service.direction$.value).toBe(DrawerDirection.RIGHT);
    });

    it('should set direction to TOP', () => {
      service.setDirection(DrawerDirection.TOP);
      expect(service.direction$.value).toBe(DrawerDirection.TOP);
    });

    it('should set direction to BOTTOM', () => {
      service.setDirection(DrawerDirection.BOTTOM);
      expect(service.direction$.value).toBe(DrawerDirection.BOTTOM);
    });
  });

  describe('Drawer and Overlay Ref Management', () => {
    it('should set drawer ref', () => {
      const mockDrawer = document.createElement('div');
      service.setDrawerRef(mockDrawer);
      expect(service.drawerRef$.value).toBe(mockDrawer);
    });

    it('should clear drawer ref when set to null', () => {
      const mockDrawer = document.createElement('div');
      service.setDrawerRef(mockDrawer);
      service.setDrawerRef(null);
      expect(service.drawerRef$.value).toBeNull();
    });

    it('should set overlay ref', () => {
      const mockOverlay = document.createElement('div');
      service.setOverlayRef(mockOverlay);
      expect(service.overlayRef$.value).toBe(mockOverlay);
    });

    it('should clear overlay ref when set to null', () => {
      const mockOverlay = document.createElement('div');
      service.setOverlayRef(mockOverlay);
      service.setOverlayRef(null);
      expect(service.overlayRef$.value).toBeNull();
    });
  });

  describe('Boolean Flag State Management', () => {
    it('should manage shouldScaleBackground flag', () => {
      service.setScaleBackground(true);
      expect(service.shouldScaleBackground$.value).toBe(true);
      expect(service.getShouldScaleBackground()).toBe(true);

      service.setScaleBackground(false);
      expect(service.shouldScaleBackground$.value).toBe(false);
      expect(service.getShouldScaleBackground()).toBe(false);
    });

    it('should manage setBackgroundColorOnScale flag', () => {
      service.setBackgroundColor(true);
      expect(service.setBackgroundColorOnScale$.value).toBe(true);
      expect(service.getBackgroundColorOnScale()).toBe(true);

      service.setBackgroundColor(false);
      expect(service.setBackgroundColorOnScale$.value).toBe(false);
      expect(service.getBackgroundColorOnScale()).toBe(false);
    });

    it('should manage noBodyStyles flag', () => {
      service.setNoBodyStyles(true);
      expect(service.noBodyStyles$.value).toBe(true);
      expect(service.getNoBodyStyles()).toBe(true);

      service.setNoBodyStyles(false);
      expect(service.noBodyStyles$.value).toBe(false);
      expect(service.getNoBodyStyles()).toBe(false);
    });

    it('should manage nested flag', () => {
      service.setNested(true);
      expect(service.nested$.value).toBe(true);
      expect(service.getNested()).toBe(true);

      service.setNested(false);
      expect(service.nested$.value).toBe(false);
      expect(service.getNested()).toBe(false);
    });

    it('should manage modal flag', () => {
      service.setModal(true);
      expect(service.modal$.value).toBe(true);
      expect(service.getModal()).toBe(true);

      service.setModal(false);
      expect(service.modal$.value).toBe(false);
      expect(service.getModal()).toBe(false);
    });

    it('should manage preventScrollRestoration flag', () => {
      service.setPreventScrollRestoration(true);
      expect(service.preventScrollRestoration$.value).toBe(true);
      expect(service.getPreventScrollRestoration()).toBe(true);

      service.setPreventScrollRestoration(false);
      expect(service.preventScrollRestoration$.value).toBe(false);
      expect(service.getPreventScrollRestoration()).toBe(false);
    });

    it('should manage hasBeenOpened flag directly', () => {
      service.setHasBeenOpened(true);
      expect(service.hasBeenOpened$.value).toBe(true);
      expect(service.getHasBeenOpened()).toBe(true);

      service.setHasBeenOpened(false);
      expect(service.hasBeenOpened$.value).toBe(false);
      expect(service.getHasBeenOpened()).toBe(false);
    });
  });

  describe('Multiple State Changes', () => {
    it('should handle rapid state changes', () => {
      service.setIsOpen(true);
      service.setDirection(DrawerDirection.LEFT);
      service.setIsDragging(true);
      service.setModal(true);
      service.setNested(true);

      expect(service.isOpen$.value).toBe(true);
      expect(service.direction$.value).toBe(DrawerDirection.LEFT);
      expect(service.isDragging$.value).toBe(true);
      expect(service.modal$.value).toBe(true);
      expect(service.nested$.value).toBe(true);
    });

    it('should isolate state changes (setting one does not affect others)', () => {
      service.setIsOpen(true);
      expect(service.isDragging$.value).toBe(false);

      service.setDirection(DrawerDirection.TOP);
      expect(service.isOpen$.value).toBe(true);

      service.setModal(true);
      expect(service.direction$.value).toBe(DrawerDirection.TOP);
    });
  });

  describe('Observable Emissions', () => {
    it('should emit stateChange when isOpen changes', () => {
      return new Promise<void>((resolve) => {
        let stateChangeEmissions = 0;
        service.stateChange$.subscribe(() => {
          stateChangeEmissions++;
          if (stateChangeEmissions > 0) {
            resolve();
          }
        });

        service.setIsOpen(true);
      });
    });

    it('should have separate observables for each state', () => {
      const isOpenCollections: boolean[] = [];
      const isDraggingCollections: boolean[] = [];

      service.isOpen$.subscribe((v) => isOpenCollections.push(v));
      service.isDragging$.subscribe((v) => isDraggingCollections.push(v));

      service.setIsOpen(true);
      service.setIsDragging(true);

      expect(isOpenCollections).toContain(true);
      expect(isDraggingCollections).toContain(true);
    });
  });

  describe('Lifecycle and Cleanup', () => {
    it('should complete all observables on destroy', () => {
      const completedObservables: string[] = [];

      service.stateChange$.subscribe({
        complete: () => completedObservables.push('stateChange'),
      });
      service.isOpen$.subscribe({
        complete: () => completedObservables.push('isOpen'),
      });
      service.isDragging$.subscribe({
        complete: () => completedObservables.push('isDragging'),
      });

      service.ngOnDestroy();

      expect(completedObservables.length).toBe(3);
    });

    it('should allow cleanup to be called multiple times safely', () => {
      expect(() => {
        service.ngOnDestroy();
        service.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
