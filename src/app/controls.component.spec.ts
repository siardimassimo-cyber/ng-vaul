import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ControlsComponent } from './controls.component';
import { DrawerDirection } from './types';

describe('ControlsComponent', () => {
  let component: ControlsComponent;
  let fixture: ComponentFixture<ControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('direction', DrawerDirection.BOTTOM);
    fixture.componentRef.setInput('snapPoints', [0.5, 1]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit directionChange when a direction button is clicked', () => {
    const spy = vi.spyOn(component.directionChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('.button-group button');
    buttons[1].click(); // Click 'Left'
    expect(spy).toHaveBeenCalledWith('left');
  });

  it('should add a valid snap point', () => {
    const spy = vi.spyOn(component.snapPointsChange, 'emit');
    component.newPointValue = '0.3';
    component.addSnapPoint();
    expect(spy).toHaveBeenCalledWith([0.3, 0.5, 1]);
  });
});
