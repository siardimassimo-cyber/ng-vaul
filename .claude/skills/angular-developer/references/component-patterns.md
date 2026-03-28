# Angular Component Patterns

## Standalone Component Structure

### Minimal Component

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-hello',
  template: '<h1>Hello</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelloComponent {}
```

### Component with Input/Output

```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>
      <button (click)="deleteClick.emit(user().id)">Delete</button>
    </div>
  `,
  styles: [
    `
      .card {
        border: 1px solid #ddd;
        padding: 1rem;
        border-radius: 4px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  user = input.required<User>();
  deleteClick = output<number>();
}
```

### Component with Signals State

```typescript
import { Component, signal, computed, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Doubled: {{ doubled() }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  initialCount = input(0);
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  ngOnInit() {
    this.count.set(this.initialCount());
  }

  increment() {
    this.count.update((v) => v + 1);
  }

  decrement() {
    this.count.update((v) => v - 1);
  }
}
```

## Component with External Template/Styles

### Separate Files (Relative Paths)

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html', // Relative to this file
  styleUrls: ['./profile.component.css'], // Relative to this file
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  // Component logic
}
```

## Host Bindings (NOT @HostBinding/@HostListener)

### Use Host Object Instead

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

// ✓ CORRECT - Use host object
@Component({
  selector: 'app-button',
  standalone: true,
  template: '<button>Click me</button>',
  host: {
    '[class.disabled]': 'isDisabled()',
    '[attr.aria-disabled]': 'isDisabled()',
    '(click)': 'handleClick()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  isDisabled = signal(false);

  handleClick() {
    // Handle click
  }
}

// ✗ WRONG - Don't use decorators
// @HostBinding('class.disabled') isDisabled = signal(false);
// @HostListener('click') handleClick() { }
```

## Forms with Reactive Forms

### Basic Reactive Form

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <label>Email:</label>
        <input formControlName="email" type="email" />
        @if (email.hasError('required')) {
          <span>Email is required</span>
        }
        @if (email.hasError('email')) {
          <span>Invalid email format</span>
        }
      </div>
      <div>
        <label>Password:</label>
        <input formControlName="password" type="password" />
        @if (password.hasError('minlength')) {
          <span>Password must be at least 8 characters</span>
        }
      </div>
      <button type="submit" [disabled]="!form.valid">Login</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get email() {
    return this.form.get('email')!;
  }

  get password() {
    return this.form.get('password')!;
  }

  constructor(private fb: FormBuilder) {}

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

### Typed Reactive Forms (Angular v14+)

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

interface LoginForm {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  form = this.fb.group<LoginForm>({
    email: '',
    password: '',
  });

  constructor(private fb: FormBuilder) {}
}
```

## Control Flow Templates

### Native Control Flow (@if, @for, @switch)

```typescript
@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div>Loading...</div>
    } @else if (items().length === 0) {
      <div>No items found</div>
    } @else {
      <ul>
        @for (item of items(); track item.id) {
          <li>{{ item.name }}</li>
        }
      </ul>
    }

    @switch (status()) {
      @case ('success') {
        <div class="success">Success!</div>
      }
      @case ('error') {
        <div class="error">Error occurred</div>
      }
      @default {
        <div>Unknown status</div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  isLoading = signal(false);
  items = signal<Item[]>([]);
  status = signal<'success' | 'error' | 'pending'>('pending');
}
```

## Directive Patterns

### Simple Directive

```typescript
import { Directive, HostBinding, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    '[style.backgroundColor]': 'color()',
  },
})
export class HighlightDirective {
  color = input('yellow');
}
```

## Component Composition

### Parent-Child Communication

```typescript
// Parent Component
@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [ChildComponent],
  template: ` <app-child [user]="currentUser()" (updateUser)="onUserUpdate($event)" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  currentUser = signal({ id: 1, name: 'John' });

  onUserUpdate(updatedUser: User) {
    this.currentUser.set(updatedUser);
  }
}

// Child Component
@Component({
  selector: 'app-child',
  standalone: true,
  template: `
    <div>{{ user().name }}</div>
    <button (click)="updateClick.emit(updatedUser())">Update</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildComponent {
  user = input.required<User>();
  updateUser = output<User>();

  updatedUser = signal({ ...this.user(), name: 'Jane' });
}
```

## Lifecycle Hooks

### OnInit and OnDestroy

```typescript
import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent implements OnInit, OnDestroy {
  data = signal<any>(null);
  private subscription?: Subscription;

  constructor(private dataService: DataService) {
    // Use effects for reactive cleanup
    effect((onCleanup) => {
      const sub = this.dataService.data$.subscribe((value) => {
        this.data.set(value);
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  ngOnInit() {
    // Initialize component
  }

  ngOnDestroy() {
    // Clean up resources
  }
}
```

## Accessibility Patterns

### ARIA Labels and Roles

```typescript
@Component({
  selector: 'app-button-group',
  standalone: true,
  template: `
    <div role="group" [attr.aria-label]="label()">
      @for (item of items(); track item.id) {
        <button [attr.aria-pressed]="isSelected(item.id)" (click)="select(item.id)">
          {{ item.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroupComponent {
  label = input('Options');
  items = input<Item[]>([]);
  selectedId = signal<number | null>(null);

  isSelected = (id: number) => this.selectedId() === id;

  select(id: number) {
    this.selectedId.set(id);
  }
}
```

### Focus Management

```typescript
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div role="dialog" [attr.aria-labelledby]="titleId" #dialogRef>
      <h1 [id]="titleId">{{ title() }}</h1>
      <button (click)="close()">Close</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements AfterViewInit {
  dialogRef = viewChild<ElementRef<HTMLDivElement>>('dialogRef');

  title = input('Modal');
  titleId = 'modal-title';

  ngAfterViewInit() {
    this.dialogRef?.nativeElement.focus();
  }

  close() {
    // Handle close
  }
}
```

## Testing Patterns

### Unit Test Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should update count on increment', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });
});
```

## Common Pitfalls to Avoid

❌ **Don't:**

- Use `*ngIf`, `*ngFor`, `*ngSwitch` (use native control flow)
- Use `[ngClass]` or `[ngStyle]` (use class/style bindings)
- Use `@HostBinding`/`@HostListener` (use host object)
- Write arrow functions in templates
- Use `any` types
- Set `standalone: true` in v20+ (it's default)
- Use template-driven forms
- Forget `ChangeDetectionStrategy.OnPush`

✅ **DO:**

- Use native control flow (`@if`, `@for`, `@switch`)
- Use direct class/style bindings
- Use host object for bindings
- Type everything properly
- Use Reactive Forms
- Implement OnPush change detection
- Keep templates simple
