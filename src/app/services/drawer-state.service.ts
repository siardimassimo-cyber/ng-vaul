import { Injectable, signal } from '@angular/core';
import { DrawerDirection, DrawerDirectionType } from '../types';

@Injectable({ providedIn: 'root' })
export class DrawerStateService {
  readonly stateChange = signal<void>(undefined);
  readonly isOpen = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);
  readonly drawerRef = signal<HTMLDivElement | null>(null);
  readonly overlayRef = signal<HTMLElement | null>(null);
  readonly direction = signal<DrawerDirectionType>(DrawerDirection.BOTTOM);
  readonly hasBeenOpened = signal<boolean>(false);
  readonly openTime = signal<Date | null>(null);

  readonly shouldScaleBackground = signal<boolean>(false);
  readonly backgroundColorOnScale = signal<boolean>(false);
  readonly noBodyStyles = signal<boolean>(false);
  readonly nested = signal<boolean>(false);
  readonly modal = signal<boolean>(false);
  readonly preventScrollRestoration = signal<boolean>(false);

  setIsOpen(isOpen: boolean): void {
    if (isOpen === this.isOpen()) return;
    this.isOpen.set(isOpen);
    if (isOpen) this.hasBeenOpened.set(true);
  }

  setIsDragging(isDragging: boolean): void {
    this.isDragging.set(isDragging);
  }

  setDirection(direction: DrawerDirectionType): void {
    this.direction.set(direction);
  }

  setDrawerRef(ref: HTMLDivElement | null): void {
    this.drawerRef.set(ref);
  }

  setOverlayRef(ref: HTMLElement | null): void {
    this.overlayRef.set(ref);
  }

  setScaleBackground(value: boolean): void {
    this.shouldScaleBackground.set(value);
  }

  setBackgroundColor(value: boolean): void {
    this.backgroundColorOnScale.set(value);
  }

  setNoBodyStyles(value: boolean): void {
    this.noBodyStyles.set(value);
  }

  setNested(value: boolean): void {
    this.nested.set(value);
  }

  setModal(value: boolean): void {
    this.modal.set(value);
  }

  setHasBeenOpened(value: boolean): void {
    this.hasBeenOpened.set(value);
  }

  setPreventScrollRestoration(value: boolean): void {
    this.preventScrollRestoration.set(value);
  }

  setOpenTime(date: Date | null): void {
    this.openTime.set(date);
  }

  getShouldScaleBackground(): boolean {
    return this.shouldScaleBackground();
  }
  getBackgroundColorOnScale(): boolean {
    return this.backgroundColorOnScale();
  }
  getNoBodyStyles(): boolean {
    return this.noBodyStyles();
  }
  getNested(): boolean {
    return this.nested();
  }
  getModal(): boolean {
    return this.modal();
  }
  getHasBeenOpened(): boolean {
    return this.hasBeenOpened();
  }
  getPreventScrollRestoration(): boolean {
    return this.preventScrollRestoration();
  }

}
