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
      expect(service.isOpen()).toBe(false);
    });

    it('should start not dragging', () => {
      expect(service.isDragging()).toBe(false);
    });

    it('should start with BOTTOM direction', () => {
      expect(service.direction()).toBe(DrawerDirection.BOTTOM);
    });

    it('should have null drawer and overlay refs', () => {
      expect(service.drawerRef()).toBeNull();
      expect(service.overlayRef()).toBeNull();
    });

    it('should start with hasBeenOpened false', () => {
      expect(service.hasBeenOpened()).toBe(false);
    });

    it('should start with flags as false', () => {
      expect(service.shouldScaleBackground()).toBe(false);
      expect(service.backgroundColorOnScale()).toBe(false);
      expect(service.noBodyStyles()).toBe(false);
      expect(service.nested()).toBe(false);
      expect(service.modal()).toBe(false);
      expect(service.preventScrollRestoration()).toBe(false);
    });
  });

  describe('isOpen State Management', () => {
    it('should set isOpen to true', () => {
      service.setIsOpen(true);
      expect(service.isOpen()).toBe(true);
    });

    it('should set isOpen to false', () => {
      service.setIsOpen(true);
      service.setIsOpen(false);
      expect(service.isOpen()).toBe(false);
    });

    it('should not change state when setting same value (true)', () => {
      service.setIsOpen(true);
      const valueBefore = service.isOpen();

      service.setIsOpen(true);

      expect(service.isOpen()).toBe(valueBefore);
      expect(service.isOpen()).toBe(true);
    });

    it('should not change state when setting same value (false)', () => {
      service.setIsOpen(true);
      service.setIsOpen(false);
      const valueBefore = service.isOpen();

      service.setIsOpen(false);

      expect(service.isOpen()).toBe(valueBefore);
      expect(service.isOpen()).toBe(false);
    });

    it('should mark hasBeenOpened true when opening drawer', () => {
      expect(service.hasBeenOpened()).toBe(false);
      service.setIsOpen(true);
      expect(service.hasBeenOpened()).toBe(true);
    });

    it('should not reset hasBeenOpened when closing', () => {
      service.setIsOpen(true);
      expect(service.hasBeenOpened()).toBe(true);

      service.setIsOpen(false);
      expect(service.hasBeenOpened()).toBe(true);
    });
  });

  describe('isDragging State Management', () => {
    it('should set isDragging to true', () => {
      service.setIsDragging(true);
      expect(service.isDragging()).toBe(true);
    });

    it('should set isDragging to false', () => {
      service.setIsDragging(true);
      service.setIsDragging(false);
      expect(service.isDragging()).toBe(false);
    });

    it('should correctly reflect the last value set', () => {
      service.setIsDragging(true);
      expect(service.isDragging()).toBe(true);
      service.setIsDragging(true);
      expect(service.isDragging()).toBe(true);
    });
  });

  describe('Direction State Management', () => {
    it('should set direction to LEFT', () => {
      service.setDirection(DrawerDirection.LEFT);
      expect(service.direction()).toBe(DrawerDirection.LEFT);
    });

    it('should set direction to RIGHT', () => {
      service.setDirection(DrawerDirection.RIGHT);
      expect(service.direction()).toBe(DrawerDirection.RIGHT);
    });

    it('should set direction to TOP', () => {
      service.setDirection(DrawerDirection.TOP);
      expect(service.direction()).toBe(DrawerDirection.TOP);
    });

    it('should set direction to BOTTOM', () => {
      service.setDirection(DrawerDirection.BOTTOM);
      expect(service.direction()).toBe(DrawerDirection.BOTTOM);
    });
  });

  describe('Drawer and Overlay Ref Management', () => {
    it('should set drawer ref', () => {
      const mockDrawer = document.createElement('div');
      service.setDrawerRef(mockDrawer);
      expect(service.drawerRef()).toBe(mockDrawer);
    });

    it('should clear drawer ref when set to null', () => {
      const mockDrawer = document.createElement('div');
      service.setDrawerRef(mockDrawer);
      service.setDrawerRef(null);
      expect(service.drawerRef()).toBeNull();
    });

    it('should set overlay ref', () => {
      const mockOverlay = document.createElement('div');
      service.setOverlayRef(mockOverlay);
      expect(service.overlayRef()).toBe(mockOverlay);
    });

    it('should clear overlay ref when set to null', () => {
      const mockOverlay = document.createElement('div');
      service.setOverlayRef(mockOverlay);
      service.setOverlayRef(null);
      expect(service.overlayRef()).toBeNull();
    });
  });

  describe('Boolean Flag State Management', () => {
    it('should manage shouldScaleBackground flag', () => {
      service.setScaleBackground(true);
      expect(service.shouldScaleBackground()).toBe(true);
      expect(service.getShouldScaleBackground()).toBe(true);

      service.setScaleBackground(false);
      expect(service.shouldScaleBackground()).toBe(false);
      expect(service.getShouldScaleBackground()).toBe(false);
    });

    it('should manage backgroundColorOnScale flag', () => {
      service.setBackgroundColor(true);
      expect(service.backgroundColorOnScale()).toBe(true);
      expect(service.getBackgroundColorOnScale()).toBe(true);

      service.setBackgroundColor(false);
      expect(service.backgroundColorOnScale()).toBe(false);
      expect(service.getBackgroundColorOnScale()).toBe(false);
    });

    it('should manage noBodyStyles flag', () => {
      service.setNoBodyStyles(true);
      expect(service.noBodyStyles()).toBe(true);
      expect(service.getNoBodyStyles()).toBe(true);

      service.setNoBodyStyles(false);
      expect(service.noBodyStyles()).toBe(false);
      expect(service.getNoBodyStyles()).toBe(false);
    });

    it('should manage nested flag', () => {
      service.setNested(true);
      expect(service.nested()).toBe(true);
      expect(service.getNested()).toBe(true);

      service.setNested(false);
      expect(service.nested()).toBe(false);
      expect(service.getNested()).toBe(false);
    });

    it('should manage modal flag', () => {
      service.setModal(true);
      expect(service.modal()).toBe(true);
      expect(service.getModal()).toBe(true);

      service.setModal(false);
      expect(service.modal()).toBe(false);
      expect(service.getModal()).toBe(false);
    });

    it('should manage preventScrollRestoration flag', () => {
      service.setPreventScrollRestoration(true);
      expect(service.preventScrollRestoration()).toBe(true);
      expect(service.getPreventScrollRestoration()).toBe(true);

      service.setPreventScrollRestoration(false);
      expect(service.preventScrollRestoration()).toBe(false);
      expect(service.getPreventScrollRestoration()).toBe(false);
    });

    it('should manage hasBeenOpened flag directly', () => {
      service.setHasBeenOpened(true);
      expect(service.hasBeenOpened()).toBe(true);
      expect(service.getHasBeenOpened()).toBe(true);

      service.setHasBeenOpened(false);
      expect(service.hasBeenOpened()).toBe(false);
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

      expect(service.isOpen()).toBe(true);
      expect(service.direction()).toBe(DrawerDirection.LEFT);
      expect(service.isDragging()).toBe(true);
      expect(service.modal()).toBe(true);
      expect(service.nested()).toBe(true);
    });

    it('should isolate state changes (setting one does not affect others)', () => {
      service.setIsOpen(true);
      expect(service.isDragging()).toBe(false);

      service.setDirection(DrawerDirection.TOP);
      expect(service.isOpen()).toBe(true);

      service.setModal(true);
      expect(service.direction()).toBe(DrawerDirection.TOP);
    });
  });

  describe('Signal Reactivity', () => {
    it('should have separate signals for each state', () => {
      service.setIsOpen(true);
      service.setIsDragging(true);

      expect(service.isOpen()).toBe(true);
      expect(service.isDragging()).toBe(true);
    });

    it('stateChange signal is defined', () => {
      expect(service.stateChange).toBeDefined();
    });
  });

  describe('Lifecycle and Cleanup', () => {
    it('should allow cleanup to be called multiple times safely', () => {
      expect(() => {
        service.ngOnDestroy();
        service.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
