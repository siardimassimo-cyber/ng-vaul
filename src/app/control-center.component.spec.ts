import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ControlCenterComponent } from './control-center.component';
import { DrawerDirection } from './types';

describe('ControlCenterComponent', () => {
  let component: ControlCenterComponent;
  let fixture: ComponentFixture<ControlCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlCenterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlCenterComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('direction', DrawerDirection.BOTTOM);
    fixture.componentRef.setInput('snapPoints', [0.4, 0.8, 1]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggle when trigger button is clicked', () => {
    const spy = vi.spyOn(component.toggle, 'emit');
    const button = fixture.nativeElement.querySelector('.trigger-button');
    button.click();
    expect(spy).toHaveBeenCalled();
  });
});
