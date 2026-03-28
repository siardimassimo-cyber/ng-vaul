import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject, combineLatest, takeUntil } from 'rxjs';
import { BORDER_RADIUS, TRANSITIONS } from './constants';
import { DrawerService } from './drawer.service';
import { assignStyle, chain } from '../utils/helpers';

const noop = () => () => {};

@Injectable({
  providedIn: 'root',
})
export class ScaleBackgroundService {
  private readonly destroy$ = new Subject<void>();
  public timeoutId: number | null = null;
  public initialBackgroundColor = new BehaviorSubject<string>(
    typeof document !== 'undefined' ? document.body.style.backgroundColor : '',
  );

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.initialBackgroundColor.complete();
  }
}
