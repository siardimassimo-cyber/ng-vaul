import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DrawerComponent } from './drawer.component';
import { DrawerService } from './services/drawer.service';
import { DrawerDirection } from './types';

describe('DrawerComponent', () => {
  let component: DrawerComponent;
  let fixture: ComponentFixture<DrawerComponent>;
  let drawerService: DrawerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerComponent],
      providers: [DrawerService]
    }).compileComponents();

    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
    drawerService = TestBed.inject(DrawerService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render handle if handle is visible', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('vaul-handle')).toBeTruthy();
  });

  it('should have default direction as bottom', () => {
    expect(component.direction()).toBe(DrawerDirection.BOTTOM);
  });
});
