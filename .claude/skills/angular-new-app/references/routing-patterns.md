# Angular Routing Patterns (Standalone Routes)

## Basic Routes

### Simple Routes

```typescript
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { AboutComponent } from './pages/about.component';
import { NotFoundComponent } from './pages/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
```

## Lazy Loading

### Feature Routes

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
];

// features/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
];
```

## Route Guards

### Authentication Guard

```typescript
import { Injectable } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
```

### Using Guards in Routes

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
  },
];
```

## Route Parameters

### Dynamic Routes

```typescript
// routes
export const routes: Routes = [
  {
    path: 'user/:id',
    component: UserDetailComponent,
  },
];

// component
import { ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: ` <div>User ID: {{ userId() }}</div> `,
})
export class UserDetailComponent {
  private route = inject(ActivatedRoute);
  userId = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.route.params.subscribe((params) => {
        this.userId.set(params['id']);
      });
    });
  }
}
```

### Query Parameters

```typescript
// navigation
import { Router } from '@angular/router';

router.navigate(['/search'], {
  queryParams: { q: 'angular', page: 1 },
});

// component
@Component({
  template: `
    <div>Search: {{ searchQuery() }}</div>
    <div>Page: {{ page() }}</div>
  `,
})
export class SearchComponent {
  private route = inject(ActivatedRoute);
  searchQuery = signal('');
  page = signal(1);

  constructor() {
    effect(() => {
      this.route.queryParams.subscribe((params) => {
        this.searchQuery.set(params['q'] || '');
        this.page.set(params['page'] || 1);
      });
    });
  }
}
```

## Navigation

### Programmatic Navigation

```typescript
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component(...)
export class MyComponent {
  private router = inject(Router);

  navigate() {
    // Navigate with path
    this.router.navigate(['/user', 123]);

    // Navigate with query params
    this.router.navigate(['/search'], {
      queryParams: { q: 'angular' },
    });

    // Replace history
    this.router.navigate(['/home'], {
      replaceUrl: true,
    });

    // With state
    this.router.navigate(['/page'], {
      state: { data: 'value' },
    });
  }
}
```

### RouterLink

```typescript
@Component({
  template: `
    <a routerLink="/user/123">User 123</a>
    <a [routerLink]="['/user', userId()]">User</a>
    <a routerLink="/search" [queryParams]="{ q: 'angular' }" routerLinkActive="active"> Search </a>
  `,
  imports: [RouterLink, RouterLinkActive],
})
export class NavComponent {}
```

## Nested Routes

### Child Routes

```typescript
export const routes: Routes = [
  {
    path: 'parent',
    component: ParentComponent,
    children: [
      {
        path: 'child1',
        component: Child1Component,
      },
      {
        path: 'child2',
        component: Child2Component,
      },
    ],
  },
];

// parent.component.ts
@Component({
  template: `
    <h1>Parent</h1>
    <router-outlet></router-outlet>
  `,
  imports: [RouterOutlet],
})
export class ParentComponent {}
```

## Route Configuration

### Full Configuration Example

```typescript
export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
    canActivate: [authGuard],
    data: { title: 'Dashboard' },
  },
  {
    path: 'user/:id',
    component: UserDetailComponent,
    resolve: {
      user: userResolver,
    },
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
```

## Error Handling

### Error Route

```typescript
export const routes: Routes = [
  {
    path: 'error',
    component: ErrorComponent,
  },
  {
    path: '**',
    redirectTo: '/error',
  },
];
```

## Route Resolvers

### Data Resolver

```typescript
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from './user.service';

export const userResolver: ResolveFn<User> = (
  route,
  state,
) => {
  const userService = inject(UserService);
  return userService.getUser(route.params['id']);
};

// Use in routes
export const routes: Routes = [
  {
    path: 'user/:id',
    component: UserDetailComponent,
    resolve: {
      user: userResolver,
    },
  },
];

// Access in component
@Component(...)
export class UserDetailComponent {
  private route = inject(ActivatedRoute);

  constructor() {
    const user = this.route.snapshot.data['user'];
  }
}
```

## Route Events

### Track Navigation

```typescript
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component(...)
export class AppComponent {
  private router = inject(Router);
  isLoading = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
      )
      .subscribe(() => {
        this.isLoading.set(true);
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
      )
      .subscribe(() => {
        this.isLoading.set(false);
      });
  }
}
```

## Title Strategy

### Set Page Title

```typescript
import { TitleStrategy } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const title = this.buildTitle(routerState);
    if (title) {
      this.title.setTitle(`${title} | My App`);
    }
  }
}

// app.config.ts
import { provideRouter, TitleStrategy } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: TitleStrategy,
      useClass: AppTitleStrategy,
    },
  ],
};
```

## Common Patterns

### Feature Module Routes

```typescript
// features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
];

// app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
];
```

### Admin Routes with Guard

```typescript
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: 'users',
        component: UserManagementComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
    ],
  },
];
```

## Preloading Strategy

### Configure Preloading

```typescript
import { PreloadAllModules } from '@angular/router';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))],
};
```

## Best Practices

✅ **DO:**

- Use lazy loading for features
- Implement route guards for protection
- Use resolvers to fetch data before navigation
- Provide meaningful route data
- Use RouterLink for internal navigation
- Track loading state during navigation
- Implement 404/error routes
- Use feature route modules

❌ **DON'T:**

- Use eager loading for all routes
- Navigate without guards
- Load all data at app startup
- Use string concatenation for route paths
- Navigate in component constructors
- Use wildcard routes before specific routes
- Forget to unsubscribe in guards
