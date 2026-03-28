import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DrawerDirection, DrawerDirectionType } from '../types';

@Injectable({ providedIn: 'root' })
export class DrawerStateService {
  readonly stateChange$ = new BehaviorSubject<void>(undefined);
  readonly isOpen$ = new BehaviorSubject<boolean>(false);
  readonly isDragging$ = new BehaviorSubject<boolean>(false);
  readonly drawerRef$ = new BehaviorSubject<HTMLDivElement | null>(null);
  readonly overlayRef$ = new BehaviorSubject<HTMLElement | null>(null);
  readonly direction$ = new BehaviorSubject<DrawerDirectionType>(DrawerDirection.BOTTOM);
  readonly hasBeenOpened$ = new BehaviorSubject<boolean>(false);
  readonly openTime$ = new BehaviorSubject<Date | null>(null);

  readonly shouldScaleBackground$ = new BehaviorSubject<boolean>(false);
  readonly setBackgroundColorOnScale$ = new BehaviorSubject<boolean>(false);
  readonly noBodyStyles$ = new BehaviorSubject<boolean>(false);
  readonly nested$ = new BehaviorSubject<boolean>(false);
  readonly modal$ = new BehaviorSubject<boolean>(false);
  readonly preventScrollRestoration$ = new BehaviorSubject<boolean>(false);

  setIsOpen(isOpen: boolean): void {
    if (isOpen === this.isOpen$.value) return;
    this.isOpen$.next(isOpen);
    if (isOpen) this.hasBeenOpened$.next(true);
  }

  setIsDragging(isDragging: boolean): void {
    this.isDragging$.next(isDragging);
  }

  setDirection(direction: DrawerDirectionType): void {
    this.direction$.next(direction);
  }

  setDrawerRef(ref: HTMLDivElement | null): void {
    this.drawerRef$.next(ref);
  }

  setOverlayRef(ref: HTMLElement | null): void {
    this.overlayRef$.next(ref);
  }

  setScaleBackground(value: boolean): void {
    this.shouldScaleBackground$.next(value);
  }

  setBackgroundColor(value: boolean): void {
    this.setBackgroundColorOnScale$.next(value);
  }

  setNoBodyStyles(value: boolean): void {
    this.noBodyStyles$.next(value);
  }

  setNested(value: boolean): void {
    this.nested$.next(value);
  }

  setModal(value: boolean): void {
    this.modal$.next(value);
  }

  setHasBeenOpened(value: boolean): void {
    this.hasBeenOpened$.next(value);
  }

  setPreventScrollRestoration(value: boolean): void {
    this.preventScrollRestoration$.next(value);
  }

  getShouldScaleBackground(): boolean {
    return this.shouldScaleBackground$.value;
  }
  getBackgroundColorOnScale(): boolean {
    return this.setBackgroundColorOnScale$.value;
  }
  getNoBodyStyles(): boolean {
    return this.noBodyStyles$.value;
  }
  getNested(): boolean {
    return this.nested$.value;
  }
  getModal(): boolean {
    return this.modal$.value;
  }
  getHasBeenOpened(): boolean {
    return this.hasBeenOpened$.value;
  }
  getPreventScrollRestoration(): boolean {
    return this.preventScrollRestoration$.value;
  }

  ngOnDestroy(): void {
    this.stateChange$.complete();
    this.isOpen$.complete();
    this.isDragging$.complete();
    this.drawerRef$.complete();
    this.overlayRef$.complete();
    this.direction$.complete();
    this.hasBeenOpened$.complete();
    this.openTime$.complete();
    this.shouldScaleBackground$.complete();
    this.setBackgroundColorOnScale$.complete();
    this.noBodyStyles$.complete();
    this.nested$.complete();
    this.modal$.complete();
    this.preventScrollRestoration$.complete();
  }
}
