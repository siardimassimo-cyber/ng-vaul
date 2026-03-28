# Angular Signals Patterns

## Introduction to Signals

Signals are Angular's recommended way to manage reactive state in modern applications (Angular v16+). They replace RxJS Observables for local component state and provide better performance and developer experience.

## Basic Signal Patterns

### Simple Signal State

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>Count: {{ count() }}</div>
    <button (click)="increment()">Increment</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update((v) => v + 1);
  }
}
```

### Computed Derived State

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-user',
  standalone: true,
  template: ` <div>{{ fullName() }}</div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  firstName = signal('John');
  lastName = signal('Doe');
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
}
```

### Signal Update Methods

**Never use `mutate()` - use `update()` or `set()`:**

```typescript
// ✓ CORRECT - update method
mySignal.update((value) => ({ ...value, name: 'new' }));

// ✓ CORRECT - set method
mySignal.set(newValue);

// ✗ WRONG - mutate method
mySignal.mutate((value) => (value.name = 'new'));
```

## Service State Management

### Service with Signals

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private users = signal<User[]>([]);
  private selectedId = signal<number | null>(null);

  users$ = computed(() => this.users());
  selectedUser$ = computed(() => {
    const id = this.selectedId();
    return id ? this.users().find((u) => u.id === id) : null;
  });

  setUsers(users: User[]) {
    this.users.set(users);
  }

  selectUser(id: number) {
    this.selectedId.set(id);
  }
}
```

### Service with Async Data

```typescript
import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
  private loading = signal(false);
  private error = signal<string | null>(null);
  private data = signal<any[]>([]);

  constructor(private http: HttpClient) {
    this.setupAutoRefresh();
  }

  private setupAutoRefresh() {
    effect(() => {
      this.loading.set(true);
      this.error.set(null);

      this.http.get<any[]>('/api/data').subscribe({
        next: (items) => {
          this.data.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      });
    });
  }
}
```

## Effect Patterns

### Side Effects with Effect

```typescript
import { Component, signal, effect } from '@angular/core';

@Component({
  selector: 'app-logger',
  standalone: true,
})
export class LoggerComponent {
  count = signal(0);

  constructor() {
    effect(() => {
      console.log('Count changed to:', this.count());
    });
  }
}
```

### Cleanup in Effects

```typescript
effect((onCleanup) => {
  const subscription = someObservable.subscribe((value) => {
    // handle value
  });

  onCleanup(() => subscription.unsubscribe());
});
```

## Linked Signals (Angular v18+)

### linkedSignal for Derived State with Updates

```typescript
import { linkedSignal } from '@angular/core';

export class MyComponent {
  count = signal(0);
  doubledCount = linkedSignal(() => this.count() * 2);

  constructor() {
    effect(() => {
      console.log('Count:', this.count(), 'Doubled:', this.doubledCount());
    });
  }
}
```

## Resource Pattern (Angular v19+)

### Loading Data with Resource

```typescript
import { Component, signal, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    @if (usersResource.isLoading()) {
      <div>Loading...</div>
    } @else if (usersResource.error()) {
      <div>Error: {{ usersResource.error() }}</div>
    } @else {
      <ul>
        @for (user of usersResource.value()) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  userId = signal(1);

  usersResource = resource({
    request: () => ({ id: this.userId() }),
    loader: ({ request }) => {
      return this.http.get(`/api/users/${request.id}`);
    },
  });

  constructor(private http: HttpClient) {}
}
```

## Common Patterns

### Toggle State

```typescript
isOpen = signal(false);
toggleOpen() {
  this.isOpen.update(v => !v);
}
```

### List Management

```typescript
items = signal<Item[]>([]);

addItem(item: Item) {
  this.items.update(list => [...list, item]);
}

removeItem(id: number) {
  this.items.update(list => list.filter(i => i.id !== id));
}

updateItem(id: number, changes: Partial<Item>) {
  this.items.update(list =>
    list.map(i => i.id === id ? { ...i, ...changes } : i)
  );
}
```

### Form State

```typescript
formData = signal({
  name: '',
  email: '',
});

updateForm(field: string, value: string) {
  this.formData.update(form => ({
    ...form,
    [field]: value,
  }));
}
```

## Migration from RxJS

### From Observable to Signal

```typescript
// OLD - RxJS
data$: Observable<Data[]>;

// NEW - Signals
data = signal<Data[]>([]);
```

### From Subject to Signal

```typescript
// OLD - RxJS Subject
private subject = new Subject<number>();
id$ = this.subject.asObservable();

// NEW - Signal
id = signal<number | null>(null);
```

## Performance Considerations

1. **Signals are synchronous** - Faster than Observables for local state
2. **Computed signals cache** - Only recompute when dependencies change
3. **No subscription overhead** - Just read signals with `()`
4. **Track dependencies automatically** - Angular tracks which signals components use
5. **OnPush is optimal** - Always use ChangeDetectionStrategy.OnPush with signals

## TypeScript Types with Signals

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

users = signal<User[]>([]);
selectedUser = signal<User | null>(null);
isLoading = signal(false);
error = signal<string | null>(null);
```

## Best Practices

✅ **DO:**

- Use `update()` for transformations
- Use `set()` for simple replacements
- Use `computed()` for derived state
- Use `effect()` for side effects
- Always type signal values
- Use OnPush change detection

❌ **DON'T:**

- Use `mutate()` for updates
- Mutate signal values directly
- Create side effects in computed()
- Use signals for everything (observables still useful for async)
- Forget to unsubscribe in effects
